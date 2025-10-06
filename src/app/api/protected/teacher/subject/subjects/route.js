// app/api/protected/teacher/subject/subjects/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get teacher's assigned subjects with detailed information
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: user.profile.id
      },
      include: {
        subject: {
          include: {
            assignments: {
              where: {
                teacherId: user.id,
                status: 'active'
              }
            },
            grades: {
              where: {
                teacherId: user.id
              }
            }
          }
        }
      }
    });

    // Calculate statistics for each subject
    const subjectsWithStats = await Promise.all(
      teacherSubjects.map(async (ts) => {
        // Get total students across all classes
        const studentCount = await prisma.user.count({
          where: {
            role: 'student',
            schoolId: user.schoolId,
            studentProfile: {
              className: {
                in: ts.classes
              }
            }
          }
        });

        // Calculate average score
        const grades = await prisma.grade.findMany({
          where: {
            subjectId: ts.subject.id,
            teacherId: user.id,
            studentProfile: {
              className: {
                in: ts.classes
              }
            }
          },
          select: {
            percentage: true
          }
        });

        const averageScore = grades.length > 0
          ? grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length
          : 0;

        return {
          id: ts.id,
          name: ts.subject.name,
          code: ts.subject.code,
          category: ts.subject.category,
          classes: ts.classes,
          isActive: ts.subject.isActive,
          totalStudents: studentCount,
          activeAssignments: ts.subject.assignments.length,
          averageScore: Math.round(averageScore),
          passRate: grades.filter(g => Number(g.percentage) >= 60).length / grades.length * 100 || 0
        };
      })
    );

    return NextResponse.json({
      success: true,
      subjects: subjectsWithStats,
      teacherSubjects: teacherSubjects
    });

  } catch (error) {
    console.error('Fetch subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects' },
      { status: 500 }
    );
  }
}