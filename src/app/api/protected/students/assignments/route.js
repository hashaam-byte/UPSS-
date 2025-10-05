// /app/api/protected/students/assignments/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const subject = searchParams.get('subject');
    const limit = searchParams.get('limit');

    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return NextResponse.json({
        success: true,
        data: { assignments: [] }
      });
    }

    // Build where clause
    const whereClause = {
      schoolId: user.schoolId,
      classes: {
        has: studentProfile.className
      }
    };

    if (status && status !== 'all') {
      if (status === 'active') {
        whereClause.status = 'active';
        whereClause.dueDate = { gte: new Date() };
      } else if (status === 'pending') {
        whereClause.status = 'active';
      } else if (status === 'overdue') {
        whereClause.status = 'active';
        whereClause.dueDate = { lt: new Date() };
      }
    }

    if (subject && subject !== 'all') {
      whereClause.subjectId = subject;
    }

    // Fetch assignments
    let assignments = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            name: true
          }
        },
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        submissions: {
          where: {
            studentId: user.id
          },
          orderBy: {
            submittedAt: 'desc'
          },
          take: 1
        }
      },
      orderBy: {
        dueDate: 'asc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Transform assignments data
    const transformedAssignments = assignments.map(assignment => {
      const submission = assignment.submissions[0];
      const now = new Date();
      const dueDate = new Date(assignment.dueDate);
      const isOverdue = dueDate < now && !submission;

      let assignmentStatus = 'pending';
      if (submission) {
        assignmentStatus = 'submitted';
      } else if (isOverdue) {
        assignmentStatus = 'overdue';
      }

      return {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        subject: assignment.subject.name,
        subjectId: assignment.subjectId,
        teacherName: `${assignment.teacher.firstName} ${assignment.teacher.lastName}`,
        dueDate: assignment.dueDate,
        maxScore: assignment.maxScore,
        assignmentType: assignment.assignmentType,
        status: assignmentStatus,
        submission: submission ? {
          id: submission.id,
          submittedAt: submission.submittedAt,
          score: submission.score,
          maxScore: submission.maxScore,
          feedback: submission.feedback,
          status: submission.status
        } : null
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        assignments: transformedAssignments
      }
    });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch assignments' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['student']);
    const body = await request.json();
    const { assignmentId, content, attachments } = body;

    // Get the assignment
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        subject: true
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Check if already submitted
    const existingSubmission = await prisma.assignmentSubmission.findFirst({
      where: {
        assignmentId,
        studentId: user.id
      }
    });

    if (existingSubmission) {
      return NextResponse.json(
        { success: false, error: 'You have already submitted this assignment' },
        { status: 400 }
      );
    }

    // Check if late
    const isLate = new Date() > new Date(assignment.dueDate);

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: user.id,
        schoolId: user.schoolId,
        content,
        attachments: attachments || [],
        submittedAt: new Date(),
        isLateSubmission: isLate,
        maxScore: assignment.maxScore,
        status: 'submitted'
      }
    });

    return NextResponse.json({
      success: true,
      data: { submission }
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit assignment' },
      { status: 500 }
    );
  }
}