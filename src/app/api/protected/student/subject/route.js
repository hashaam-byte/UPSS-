// /app/api/protected/student/subjects/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify student access
async function verifyStudentAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      studentProfile: true,
      school: true 
    }
  });

  if (!user || user.role !== 'student') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch student's subjects
export async function GET(request) {
  try {
    await requireAuth(['student']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const student = await verifyStudentAccess(token);
    const { searchParams } = new URL(request.url);
    const includePerformance = searchParams.get('includePerformance') !== 'false';

    // Get student's class info
    const studentClass = student.studentProfile?.className;
    const studentSection = student.studentProfile?.section;

    if (!studentClass) {
      return NextResponse.json({
        success: true,
        data: {
          subjects: [],
          summary: { totalSubjects: 0, averagePerformance: 0 },
          message: 'Student class not assigned'
        }
      });
    }

    // Get subjects available to student's class
    const availableSubjects = await prisma.subject.findMany({
      where: {
        schoolId: student.schoolId,
        isActive: true,
        classes: {
          has: studentClass
        }
      }
    });

    // Process subjects with performance data
    const subjectsWithData = await Promise.all(
      availableSubjects.map(async (subject) => {
        const baseSubjectData = {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category,
          classes: subject.classes.filter(cls => cls === studentClass) // Only student's class
        };

        // Get teacher information for this subject
        const teacherSubjects = await prisma.teacherSubject.findMany({
          where: {
            subjectId: subject.id,
            classes: {
              has: studentClass
            }
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        });

        // Add teacher info if available
        if (teacherSubjects.length > 0) {
          const teacherProfile = teacherSubjects[0].teacher;
          baseSubjectData.teacher = {
            id: teacherProfile.user.id,
            name: `${teacherProfile.user.firstName} ${teacherProfile.user.lastName}`,
            email: teacherProfile.user.email
          };
        }

        // Add performance data if requested
        if (includePerformance) {
          // TODO: In production, this would calculate from actual grades/attendance tables
          // For now, generate realistic mock performance data
          const currentAverage = Math.floor(Math.random() * 35) + 65; // 65-100
          const totalAssessments = Math.floor(Math.random() * 8) + 5; // 5-12
          const completedAssignments = Math.floor(Math.random() * totalAssessments);
          const attendanceRate = Math.floor(Math.random() * 20) + 80; // 80-100
          
          baseSubjectData.performance = {
            currentAverage: currentAverage,
            highestScore: Math.min(100, currentAverage + Math.floor(Math.random() * 15)),
            lowestScore: Math.max(0, currentAverage - Math.floor(Math.random() * 20)),
            totalAssessments: totalAssessments,
            completedAssessments: completedAssignments,
            pendingAssignments: totalAssessments - completedAssignments,
            attendanceRate: attendanceRate,
            trend: Math.random() > 0.6 ? 'improving' : 
                   Math.random() > 0.5 ? 'stable' : 'declining'
          };

          // Add mock schedule info
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
          const periods = ['8:00-8:45', '9:00-9:45', '10:15-11:00', '11:15-12:00', '1:00-1:45', '2:00-2:45'];
          baseSubjectData.schedule = `${days[Math.floor(Math.random() * days.length)]} ${periods[Math.floor(Math.random() * periods.length)]}`;
        }

        return baseSubjectData;
      })
    );

    // Calculate summary statistics
    const summary = {
      totalSubjects: subjectsWithData.length,
      averagePerformance: includePerformance && subjectsWithData.length > 0
        ? Math.round(
            subjectsWithData.reduce((sum, subject) => sum + (subject.performance?.currentAverage || 0), 0) / subjectsWithData.length
          )
        : 0,
      excellentSubjects: includePerformance 
        ? subjectsWithData.filter(s => s.performance?.currentAverage >= 85).length
        : 0,
      goodSubjects: includePerformance 
        ? subjectsWithData.filter(s => s.performance?.currentAverage >= 70 && s.performance?.currentAverage < 85).length
        : 0,
      needAttentionSubjects: includePerformance 
        ? subjectsWithData.filter(s => s.performance?.currentAverage < 60).length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        subjects: subjectsWithData,
        summary: summary,
        studentInfo: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: studentClass,
          section: studentSection,
          studentId: student.studentProfile?.studentId
        }
      }
    });

  } catch (error) {
    console.error('Student subjects GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}