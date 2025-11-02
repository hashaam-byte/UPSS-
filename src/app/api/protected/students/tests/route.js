// ===================================================================
// FILE 1: src/app/api/protected/students/tests/route.js
// ===================================================================
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['student']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    if (!studentProfile || !studentProfile.className) {
      return NextResponse.json({
        success: true,
        data: { tests: [], message: 'Student class not found' }
      });
    }

    const now = new Date();
    
    // Build where clause
    const whereClause = {
      schoolId: user.schoolId,
      assignmentType: { in: ['test', 'exam', 'quiz'] },
      classes: { has: studentProfile.className }
    };

    // Filter by status
    if (status === 'available') {
      whereClause.status = 'published';
      whereClause.availableFrom = { lte: now };
      whereClause.dueDate = { gte: now };
    } else if (status === 'upcoming') {
      whereClause.availableFrom = { gt: now };
    } else if (status !== 'all') {
      whereClause.status = status;
    }

    // Fetch tests
    const tests = await prisma.assignment.findMany({
      where: whereClause,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true
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
      }
    });

    // Transform tests data
    const transformedTests = tests.map(test => {
      // Parse test configuration from attachments
      let testConfig = null;
      if (test.attachments && test.attachments.length > 0) {
        try {
          testConfig = JSON.parse(test.attachments[0]);
        } catch (e) {
          console.error('Error parsing test config:', e);
        }
      }

      const submission = test.submissions[0] || null;

      return {
        id: test.id,
        title: test.title,
        description: test.description,
        instructions: test.instructions,
        assignmentType: test.assignmentType,
        maxScore: test.maxScore,
        passingScore: test.passingScore,
        status: test.status,
        availableFrom: test.availableFrom,
        dueDate: test.dueDate,
        createdAt: test.createdAt,
        subject: test.subject,
        teacherName: `${test.teacher.firstName} ${test.teacher.lastName}`,
        testConfig: testConfig || {
          duration: 60,
          questions: [],
          allowRetake: false,
          showResultsImmediately: true,
          shuffleQuestions: false,
          shuffleOptions: false
        },
        mySubmission: submission ? {
          id: submission.id,
          submittedAt: submission.submittedAt,
          score: submission.score,
          maxScore: submission.maxScore,
          status: submission.status,
          feedback: submission.feedback
        } : null
      };
    });

    // Filter based on submission status if needed
    let filteredTests = transformedTests;
    if (status === 'completed') {
      filteredTests = transformedTests.filter(t => t.mySubmission?.status === 'graded');
    } else if (status === 'pending') {
      filteredTests = transformedTests.filter(t => t.mySubmission && t.mySubmission.status !== 'graded');
    }

    return NextResponse.json({
      success: true,
      data: {
        tests: filteredTests,
        studentClass: studentProfile.className
      }
    });
  } catch (error) {
    console.error('Get student tests error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}
