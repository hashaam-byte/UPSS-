// app/api/protected/teacher/subject/subjects/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get teacher profile to access teacher subjects
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get teacher's assigned subjects with detailed information
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: teacherProfile.id
      },
      include: {
        subject: true
      }
    });

    // Calculate statistics for each subject
    const subjectsWithStats = await Promise.all(
      teacherSubjects.map(async (ts) => {
        // Get total students across all classes this teacher teaches
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

        // Count active assignments for this subject and teacher
        const activeAssignments = await prisma.assignment.count({
          where: {
            subjectId: ts.subject.id,
            teacherId: user.id,
            status: 'active'
          }
        });

        // Get grades for average score calculation
        const grades = await prisma.grade.findMany({
          where: {
            subjectId: ts.subject.id,
            teacherId: user.id,
            student: {
              studentProfile: {
                className: {
                  in: ts.classes
                }
              }
            }
          },
          select: {
            percentage: true
          }
        });

        // Calculate average score and pass rate
        const averageScore = grades.length > 0
          ? grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length
          : 0;

        const passRate = grades.length > 0
          ? (grades.filter(g => Number(g.percentage) >= 60).length / grades.length) * 100
          : 0;

        return {
          id: ts.id,
          name: ts.subject.name,
          code: ts.subject.code,
          category: ts.subject.category,
          classes: ts.classes,
          isActive: ts.subject.isActive,
          totalStudents: studentCount,
          activeAssignments: activeAssignments,
          averageScore: Math.round(averageScore),
          passRate: Math.round(passRate)
        };
      })
    );

    return NextResponse.json({
      success: true,
      subjects: subjectsWithStats,
      totalSubjects: subjectsWithStats.length
    });

  } catch (error) {
    console.error('Fetch subjects error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subjects', details: error.message },
      { status: 500 }
    );
  }
}