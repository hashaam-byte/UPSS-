// src/app/api/protected/students/tests/result/[id]/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['student']);
    const testId = params.id;

    // Fetch test and submission
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
          },
          take: 1
        }
      }
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    const submission = test.submissions[0];

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'No submission found for this test' },
        { status: 404 }
      );
    }

    // Parse submission details
    let details = null;
    let statistics = null;

    if (submission.content) {
      try {
        details = JSON.parse(submission.content);
        
        // Calculate statistics
        if (details.answers) {
          const objectiveAnswers = details.answers.filter(a => a.type === 'objective');
          statistics = {
            totalQuestions: details.answers.length,
            correctAnswers: objectiveAnswers.filter(a => a.isCorrect).length,
            incorrectAnswers: objectiveAnswers.filter(a => !a.isCorrect).length,
            objectiveScore: details.objectiveScore || 0,
            objectiveMaxScore: details.objectiveMaxScore || 0,
            theoryMaxScore: details.theoryMaxScore || 0
          };
        }
      } catch (e) {
        console.error('Error parsing submission content:', e);
      }
    }

    const transformedTest = {
      id: test.id,
      title: test.title,
      description: test.description,
      assignmentType: test.assignmentType,
      maxScore: test.maxScore,
      passingScore: test.passingScore,
      dueDate: test.dueDate,
      subject: test.subject,
      teacherName: `${test.teacher.firstName} ${test.teacher.lastName}`
    };

    const transformedSubmission = {
      id: submission.id,
      submittedAt: submission.submittedAt,
      score: submission.score,
      maxScore: submission.maxScore,
      status: submission.status,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt,
      isLateSubmission: submission.isLateSubmission
    };

    return NextResponse.json({
      success: true,
      data: {
        test: transformedTest,
        submission: transformedSubmission,
        details: details,
        statistics: statistics
      }
    });
  } catch (error) {
    console.error('Get test result error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test result' },
      { status: 500 }
    );
  }
}