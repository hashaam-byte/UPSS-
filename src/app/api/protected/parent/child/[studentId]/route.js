// /api/protected/parent/child/[studentId]
// Full academic snapshot for one of a parent's linked children: grades,
// attendance summary, and test/exam history. Access is always checked
// against ParentStudentLink first — a parent can never fetch data for a
// student who isn't actually theirs, regardless of what id is in the URL.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params: paramsPromise }) {
  const params = await paramsPromise;
  try {
    const user = await requireAuth(['PARENT']);
    const studentId = params.studentId;

    const parentProfile = await prisma.parentProfile.findUnique({ where: { userId: user.id } });
    if (!parentProfile) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    const link = await prisma.parentStudentLink.findUnique({
      where: { parentId_studentId: { parentId: parentProfile.id, studentId } }
    });
    if (!link) {
      return NextResponse.json({ error: 'This student is not linked to your account' }, { status: 403 });
    }

    const student = await prisma.user.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        studentProfile: {
          select: {
            studentId: true,
            className: true,
            section: true,
            currentStream: true,
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const termName = searchParams.get('term'); // optional filter, e.g. "First Term"

    // ---- Grades ----
    const grades = await prisma.grade.findMany({
      where: {
        studentId,
        ...(termName && { termName }),
      },
      orderBy: { assessmentDate: 'desc' },
      take: 50,
      include: {
        subject: { select: { name: true, code: true } }
      }
    });

    // ---- Attendance summary + recent history ----
    const attendanceRecords = await prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 30,
    });

    const attendanceCounts = attendanceRecords.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    const totalMarked = attendanceRecords.length;
    const presentCount = (attendanceCounts.present || 0) + (attendanceCounts.late || 0);
    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null;

    // ---- Tests/exams taken (assignments of type exam/quiz that this student submitted) ----
    const testSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: { assignmentType: { in: ['exam', 'quiz'] } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 30,
      include: {
        assignment: {
          select: {
            title: true,
            assignmentType: true,
            maxScore: true,
            dueDate: true,
            subject: { select: { name: true } }
          }
        }
      }
    });

    // ---- Regular assignments/homework (non-test types) ----
    const assignmentSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        studentId,
        assignment: { assignmentType: { notIn: ['exam', 'quiz'] } }
      },
      orderBy: { submittedAt: 'desc' },
      take: 30,
      include: {
        assignment: {
          select: {
            title: true,
            assignmentType: true,
            maxScore: true,
            dueDate: true,
            subject: { select: { name: true } }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        student: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          avatar: student.avatar,
          studentId: student.studentProfile?.studentId,
          className: student.studentProfile?.className,
          section: student.studentProfile?.section,
          stream: student.studentProfile?.currentStream,
        },
        grades: grades.map(g => ({
          id: g.id,
          subject: g.subject?.name,
          assessmentType: g.assessmentType,
          assessmentName: g.assessmentName,
          score: g.score,
          maxScore: g.maxScore,
          percentage: g.percentage,
          grade: g.grade,
          term: g.termName,
          academicYear: g.academicYear,
          date: g.assessmentDate,
          comments: g.comments,
          classAverage: g.classAverage,
          position: g.position,
        })),
        attendance: {
          rate: attendanceRate,
          totalMarked,
          counts: attendanceCounts,
          recent: attendanceRecords.map(r => ({
            date: r.date,
            status: r.status,
            period: r.period,
            arrivalTime: r.arrivalTime,
            notes: r.notes,
          })),
        },
        tests: testSubmissions.map(s => ({
          id: s.id,
          title: s.assignment.title,
          type: s.assignment.assignmentType,
          subject: s.assignment.subject?.name,
          score: s.score,
          maxScore: s.assignment.maxScore,
          status: s.status,
          submittedAt: s.submittedAt,
          gradedAt: s.gradedAt,
          feedback: s.feedback,
        })),
        assignments: assignmentSubmissions.map(s => ({
          id: s.id,
          title: s.assignment.title,
          type: s.assignment.assignmentType,
          subject: s.assignment.subject?.name,
          score: s.score,
          maxScore: s.assignment.maxScore,
          status: s.status,
          submittedAt: s.submittedAt,
          isLate: s.isLateSubmission,
          gradedAt: s.gradedAt,
          feedback: s.feedback,
        })),
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Parent child-detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
