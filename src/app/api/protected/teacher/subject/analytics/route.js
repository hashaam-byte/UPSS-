// app/api/protected/teacher/subject/analytics/route.js
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
    const period = searchParams.get('period') || 'current_term';

    // Get teacher's subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: { teacherId: user.profile.id },
      include: { subject: true }
    });

    const subjectIds = teacherSubjects.map(ts => ts.subject.id);
    const allClasses = [...new Set(teacherSubjects.flatMap(ts => ts.classes))];

    // Get all students in teacher's classes
    const students = await prisma.user.findMany({
      where: {
        role: 'student',
        schoolId: user.schoolId,
        studentProfile: {
          className: { in: allClasses }
        }
      },
      include: {
        studentProfile: true
      }
    });

    // Get assignments
    const assignments = await prisma.assignment.findMany({
      where: {
        teacherId: user.id,
        subjectId: { in: subjectIds }
      },
      include: {
        submissions: true
      }
    });

    // Get grades
    const grades = await prisma.grade.findMany({
      where: {
        teacherId: user.id,
        subjectId: { in: subjectIds }
      }
    });

    // Calculate metrics
    const totalStudents = students.length;
    const totalAssignments = assignments.length;
    const activeAssignments = assignments.filter(a => a.status === 'active').length;
    
    const averageScore = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + Number(g.percentage), 0) / grades.length)
      : 0;

    const totalSubmissions = assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const expectedSubmissions = assignments.reduce((sum, a) => {
      const classStudents = students.filter(s => 
        a.classes.includes(s.studentProfile?.className)
      ).length;
      return sum + classStudents;
    }, 0);

    const completionRate = expectedSubmissions > 0
      ? Math.round((totalSubmissions / expectedSubmissions) * 100)
      : 0;

    const pendingSubmissions = assignments.reduce((sum, a) => {
      return sum + a.submissions.filter(s => s.status === 'submitted').length;
    }, 0);

    // Performance trend (last 8 weeks)
    const performanceTrend = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const weekGrades = grades.filter(g => {
        const gradeDate = new Date(g.assessmentDate);
        return gradeDate >= weekStart && gradeDate < weekEnd;
      });

      const weekAssignments = assignments.filter(a => {
        const dueDate = new Date(a.dueDate);
        return dueDate >= weekStart && dueDate < weekEnd;
      });

      performanceTrend.push({
        period: `Week ${8 - i}`,
        averageScore: weekGrades.length > 0
          ? Math.round(weekGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / weekGrades.length)
          : 0,
        completionRate: weekAssignments.length > 0
          ? Math.round((weekAssignments.reduce((sum, a) => sum + a.submissions.length, 0) / 
              (weekAssignments.length * totalStudents)) * 100)
          : 0
      });
    }

    // Grade distribution
    const gradeDistribution = [
      { name: 'A (90-100)', count: grades.filter(g => Number(g.percentage) >= 90).length },
      { name: 'B (80-89)', count: grades.filter(g => Number(g.percentage) >= 80 && Number(g.percentage) < 90).length },
      { name: 'C (70-79)', count: grades.filter(g => Number(g.percentage) >= 70 && Number(g.percentage) < 80).length },
      { name: 'D (60-69)', count: grades.filter(g => Number(g.percentage) >= 60 && Number(g.percentage) < 70).length },
      { name: 'F (<60)', count: grades.filter(g => Number(g.percentage) < 60).length }
    ];

    // Class performance comparison
    const classPerformance = allClasses.map(className => {
      const classGrades = grades.filter(g => 
        students.find(s => s.id === g.studentId)?.studentProfile?.className === className
      );

      const classAssignments = assignments.filter(a => a.classes.includes(className));
      const classSubmissions = classAssignments.reduce((sum, a) => {
        return sum + a.submissions.filter(s => 
          students.find(st => st.id === s.studentId)?.studentProfile?.className === className
        ).length;
      }, 0);

      const classStudentCount = students.filter(s => s.studentProfile?.className === className).length;
      const expectedClassSubmissions = classAssignments.length * classStudentCount;

      return {
        className,
        averageScore: classGrades.length > 0
          ? Math.round(classGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / classGrades.length)
          : 0,
        completionRate: expectedClassSubmissions > 0
          ? Math.round((classSubmissions / expectedClassSubmissions) * 100)
          : 0
      };
    });

    // Top performers (top 5)
    const studentPerformance = students.map(student => {
      const studentGrades = grades.filter(g => g.studentId === student.id);
      const avgScore = studentGrades.length > 0
        ? studentGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / studentGrades.length
        : 0;

      return {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        className: student.studentProfile?.className,
        averageScore: Math.round(avgScore),
        assignmentsCompleted: assignments.filter(a => 
          a.submissions.some(s => s.studentId === student.id)
        ).length
      };
    });

    const topPerformers = studentPerformance
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, 5);

    const needsAttention = studentPerformance
      .filter(s => s.averageScore < 60)
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 5)
      .map(s => ({
        ...s,
        missedAssignments: totalAssignments - s.assignmentsCompleted
      }));

    return NextResponse.json({
      success: true,
      totalStudents,
      averageScore,
      completionRate,
      totalAssignments,
      activeAssignments,
      pendingSubmissions,
      performanceTrend,
      gradeDistribution,
      classPerformance,
      topPerformers,
      needsAttention
    });

  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}