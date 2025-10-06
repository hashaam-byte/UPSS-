// app/api/protected/teacher/subject/students/route.js
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

    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('subjectId');

    // Get teacher's classes
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: user.profile.id },
      include: { subject: true }
    });

    let classFilter = teacherSubjects.flatMap(ts => ts.classes);
    
    if (subjectId) {
      const specificSubject = teacherSubjects.find(ts => ts.subject.id === subjectId);
      if (specificSubject) {
        classFilter = specificSubject.classes;
      }
    }

    const classes = [...new Set(classFilter)];

    // Get all students in these classes
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        schoolId: user.schoolId,
        studentProfile: {
          className: { in: classes }
        }
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { studentProfile: { className: 'asc' } },
        { lastName: 'asc' }
      ]
    });

    // Get performance data for each student
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        // Get grades for this teacher's subjects
        const subjectIds = teacherSubjects.map(ts => ts.subject.id);
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            subjectId: { in: subjectIds },
            teacherId: user.id
          }
        });

        const averageScore = grades.length > 0
          ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
          : 0;

        // Get assignment submissions
        const assignments = await prisma.assignment.findMany({
          where: {
            teacherId: user.id,
            classes: {
              has: student.studentProfile?.className
            }
          }
        });

        const submissions = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: student.id,
            assignmentId: { in: assignments.map(a => a.id) }
          }
        });

        const completionRate = assignments.length > 0
          ? Math.round((submissions.length / assignments.length) * 100)
          : 0;

        // Get attendance
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            date: { gte: thirtyDaysAgo }
          }
        });

        const attendanceRate = attendanceRecords.length > 0
          ? Math.round((attendanceRecords.filter(a => a.status === 'present').length / attendanceRecords.length) * 100)
          : 0;

        // Calculate trend
        const recentGrades = grades.slice(-5);
        const olderGrades = grades.slice(-10, -5);
        
        let trend = 'stable';
        if (recentGrades.length > 0 && olderGrades.length > 0) {
          const recentAvg = recentGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / recentGrades.length;
          const olderAvg = olderGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / olderGrades.length;
          
          if (recentAvg > olderAvg + 5) trend = 'improving';
          else if (recentAvg < olderAvg - 5) trend = 'declining';
        }

        // Get recent activity
        const recentActivity = submissions
          .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
          .slice(0, 5)
          .map(s => {
            const assignment = assignments.find(a => a.id === s.assignmentId);
            return {
              title: assignment?.title || 'Assignment',
              type: assignment?.assignmentType || 'homework',
              score: s.score ? Math.round((s.score / s.maxScore) * 100) : null,
              date: new Date(s.submittedAt).toLocaleDateString()
            };
          });

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          studentProfile: student.studentProfile,
          performance: {
            averageScore,
            completionRate,
            attendanceRate,
            assignmentsSubmitted: submissions.length,
            missedAssignments: assignments.length - submissions.length,
            trend
          },
          recentActivity
        };
      })
    );

    return NextResponse.json({
      success: true,
      students: studentsWithPerformance,
      classes
    });

  } catch (error) {
    console.error('Fetch students error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
}