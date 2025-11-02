
// ===================================================================
// FILE 2: src/app/api/protected/students/tests/[id]/route.js
// ===================================================================
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['student']);
    const testId = params.id;

    // Get student's class
    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    // Fetch test
    const test = await prisma.assignment.findUnique({
      where: {
        id: testId,
        schoolId: user.schoolId
      },
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
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Check if student's class is included
    if (!test.classes.includes(studentProfile.className)) {
      return NextResponse.json(
        { success: false, error: 'This test is not assigned to your class' },
        { status: 403 }
      );
    }

    // Parse test configuration
    let testConfig = {
      duration: 60,
      questions: [],
      allowRetake: false,
      showResultsImmediately: true,
      shuffleQuestions: false,
      shuffleOptions: false
    };

    if (test.attachments && test.attachments.length > 0) {
      try {
        testConfig = JSON.parse(test.attachments[0]);
      } catch (e) {
        console.error('Error parsing test config:', e);
      }
    }

    // Shuffle questions if configured
    let questions = testConfig.questions || [];
    if (testConfig.shuffleQuestions) {
      questions = [...questions].sort(() => Math.random() - 0.5);
    }

    // Shuffle options for objective questions if configured
    if (testConfig.shuffleOptions) {
      questions = questions.map(q => {
        if (q.type === 'objective' && q.options) {
          const shuffledOptions = [...q.options];
          const correctAnswer = q.correctAnswer;
          const correctOption = shuffledOptions[correctAnswer];
          
          // Fisher-Yates shuffle
          for (let i = shuffledOptions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
          }
          
          return {
            ...q,
            options: shuffledOptions,
            correctAnswer: shuffledOptions.indexOf(correctOption)
          };
        }
        return q;
      });
    }

    const submission = test.submissions[0] || null;

    const transformedTest = {
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
      subject: test.subject,
      teacherName: `${test.teacher.firstName} ${test.teacher.lastName}`,
      testConfig: {
        ...testConfig,
        questions: questions
      },
      mySubmission: submission ? {
        id: submission.id,
        submittedAt: submission.submittedAt,
        score: submission.score,
        maxScore: submission.maxScore,
        status: submission.status
      } : null
    };

    return NextResponse.json({
      success: true,
      data: {
        test: transformedTest
      }
    });
  } catch (error) {
    console.error('Get test by ID error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test' },
      { status: 500 }
    );
  }
}
