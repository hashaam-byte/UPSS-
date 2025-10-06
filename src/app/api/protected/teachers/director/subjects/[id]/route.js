// app/api/protected/teachers/director/subjects/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subjectId = params.id;

    // Fetch subject with teachers
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId
      },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                    isActive: true
                  }
                }
              }
            }
          }
        },
        assignments: {
          where: {
            schoolId: user.schoolId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 10,
          include: {
            teacher: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            },
            submissions: {
              select: {
                id: true,
                status: true
              }
            }
          }
        },
        grades: {
          where: {
            schoolId: user.schoolId
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 100
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Calculate statistics
    const totalTeachers = subject.teachers.length;
    const totalAssignments = subject.assignments.length;
    const totalGrades = subject.grades.length;

    // Calculate average grade
    const averageGrade = totalGrades > 0
      ? Math.round(subject.grades.reduce((sum, g) => sum + Number(g.percentage), 0) / totalGrades)
      : 0;

    // Calculate pass rate
    const passedGrades = subject.grades.filter(g => Number(g.percentage) >= 50).length;
    const passRate = totalGrades > 0 ? Math.round((passedGrades / totalGrades) * 100) : 0;

    // Get grade distribution
    const gradeDistribution = {
      A: subject.grades.filter(g => Number(g.percentage) >= 70).length,
      B: subject.grades.filter(g => Number(g.percentage) >= 60 && Number(g.percentage) < 70).length,
      C: subject.grades.filter(g => Number(g.percentage) >= 50 && Number(g.percentage) < 60).length,
      D: subject.grades.filter(g => Number(g.percentage) >= 40 && Number(g.percentage) < 50).length,
      F: subject.grades.filter(g => Number(g.percentage) < 40).length
    };

    // Assignment completion rate
    const totalSubmissions = subject.assignments.reduce((sum, a) => sum + a.submissions.length, 0);
    const gradedSubmissions = subject.assignments.reduce(
      (sum, a) => sum + a.submissions.filter(s => s.status === 'graded').length,
      0
    );
    const completionRate = totalSubmissions > 0 
      ? Math.round((gradedSubmissions / totalSubmissions) * 100)
      : 0;

    // Teachers with their assignment data
    const teachersData = subject.teachers.map(ts => {
      const teacherAssignments = subject.assignments.filter(a => a.teacher.id === ts.teacher.userId);
      const teacherGrades = subject.grades.filter(g => g.teacherId === ts.teacher.userId);
      
      return {
        id: ts.teacher.user.id,
        name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
        email: ts.teacher.user.email,
        phone: ts.teacher.user.phone,
        avatar: ts.teacher.user.avatar,
        isActive: ts.teacher.user.isActive,
        classes: ts.classes,
        assignmentsCreated: teacherAssignments.length,
        gradesGiven: teacherGrades.length
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        subject: {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category,
          classes: subject.classes,
          isActive: subject.isActive
        },
        statistics: {
          totalTeachers,
          totalAssignments,
          totalGrades,
          averageGrade,
          passRate,
          completionRate,
          gradeDistribution
        },
        teachers: teachersData,
        recentAssignments: subject.assignments.map(a => ({
          id: a.id,
          title: a.title,
          dueDate: a.dueDate,
          status: a.status,
          teacher: a.teacher,
          submissions: a.submissions.length,
          graded: a.submissions.filter(s => s.status === 'graded').length
        }))
      }
    });
  } catch (error) {
    console.error('Subject detail fetch error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch subject details' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subjectId = params.id;
    const updates = await request.json();

    // Verify subject exists
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: updates.name,
        code: updates.code,
        category: updates.category,
        classes: updates.classes,
        isActive: updates.isActive
      }
    });

    return NextResponse.json({
      success: true,
      data: { subject: updatedSubject },
      message: 'Subject updated successfully'
    });
  } catch (error) {
    console.error('Subject update error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update subject' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const subjectId = params.id;

    // Verify subject exists
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId
      }
    });

    if (!subject) {
      return NextResponse.json(
        { success: false, error: 'Subject not found' },
        { status: 404 }
      );
    }

    // Soft delete - just deactivate
    await prisma.subject.update({
      where: { id: subjectId },
      data: { isActive: false }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject deactivated successfully'
    });
  } catch (error) {
    console.error('Subject delete error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete subject' },
      { status: 500 }
    );
  }
}