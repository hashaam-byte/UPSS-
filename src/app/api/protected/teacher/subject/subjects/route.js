// /app/api/protected/teacher/subject/subjects/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify subject teacher access
async function verifySubjectTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'subject_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    await requireAuth(['subject_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const includeStudentCount = searchParams.get('includeStudentCount') === 'true';
    const includePerformance = searchParams.get('includePerformance') === 'true';

    // Get teacher's assigned subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: subjectTeacher.teacherProfile.id
      },
      include: {
        subject: true
      }
    });

    if (teacherSubjects.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          teacherSubjects: [],
          summary: {
            totalSubjects: 0,
            totalClasses: 0,
            totalStudents: 0
          },
          message: 'No subjects assigned to this teacher'
        }
      });
    }

    // Process each subject with additional data
    const processedSubjects = await Promise.all(
      teacherSubjects.map(async (teacherSubject) => {
        const baseData = {
          id: teacherSubject.id,
          subject: {
            id: teacherSubject.subject.id,
            name: teacherSubject.subject.name,
            code: teacherSubject.subject.code,
            category: teacherSubject.subject.category,
            isActive: teacherSubject.subject.isActive
          },
          classes: teacherSubject.classes,
          assignedAt: teacherSubject.createdAt || new Date()
        };

        // Add student count if requested
        if (includeStudentCount) {
          const studentCount = await prisma.user.count({
            where: {
              schoolId: subjectTeacher.schoolId,
              role: 'student',
              isActive: true,
              studentProfile: {
                className: {
                  in: teacherSubject.classes
                }
              }
            }
          });
          baseData.studentCount = studentCount;
        }

        // Add performance data if requested
        if (includePerformance) {
          // TODO: In production, calculate from actual grades/results tables
          baseData.performance = {
            averageScore: null, // Would be calculated from results table
            passRate: null, // Would be calculated from results table
            lastUpdated: null,
            trendDirection: 'stable' // 'improving', 'declining', 'stable'
          };
        }

        return baseData;
      })
    );

    // Calculate summary statistics
    const totalClasses = [...new Set(processedSubjects.flatMap(ps => ps.classes))].length;
    const totalStudents = includeStudentCount 
      ? processedSubjects.reduce((sum, ps) => sum + (ps.studentCount || 0), 0)
      : 0;

    return NextResponse.json({
      success: true,
      data: {
        teacherSubjects: processedSubjects,
        summary: {
          totalSubjects: teacherSubjects.length,
          totalClasses: totalClasses,
          totalStudents: totalStudents
        },
        teacherInfo: {
          id: subjectTeacher.id,
          name: `${subjectTeacher.firstName} ${subjectTeacher.lastName}`,
          employeeId: subjectTeacher.teacherProfile?.employeeId,
          department: subjectTeacher.teacherProfile?.department
        }
      }
    });

  } catch (error) {
    console.error('Subject teacher subjects GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Request new subject assignment (would need admin approval)
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { subjectId, classes = [], message } = body;

    if (!subjectId || classes.length === 0) {
      return NextResponse.json({
        error: 'Subject ID and classes are required'
      }, { status: 400 });
    }

    // Verify the subject exists in the school
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: subjectTeacher.schoolId,
        isActive: true
      }
    });

    if (!subject) {
      return NextResponse.json({
        error: 'Subject not found in your school'
      }, { status: 404 });
    }

    // Check if teacher already has this subject
    const existingAssignment = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: subjectTeacher.teacherProfile.id,
        subjectId: subjectId
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'You are already assigned to this subject'
      }, { status: 409 });
    }

    // Create notification for admin to approve the request
    await prisma.notification.create({
      data: {
        schoolId: subjectTeacher.schoolId,
        title: `Subject Assignment Request`,
        content: `${subjectTeacher.firstName} ${subjectTeacher.lastName} has requested to teach ${subject.name} for classes: ${classes.join(', ')}. ${message || ''}`,
        type: 'info',
        priority: 'normal',
        isGlobal: false,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject assignment request sent to admin for approval',
      data: {
        subjectName: subject.name,
        requestedClasses: classes,
        requestedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Subject assignment request error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}