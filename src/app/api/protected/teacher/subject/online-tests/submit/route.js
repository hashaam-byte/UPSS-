// app/api/protected/teacher/subject/online-tests/submit/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { testId, answers, timeSpent } = await request.json();

    // Get the test/assignment
    const test = await prisma.assignment.findUnique({
      where: { id: testId },
      include: { subject: true }
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Parse test data from attachments
    const testData = JSON.parse(test.attachments[0]);
    const questions = testData.questions;

    // Auto-grade objective questions
    let objectiveScore = 0;
    let objectiveMaxScore = 0;
    let theoryMaxScore = 0;
    const gradedAnswers = [];

    questions.forEach((question, index) => {
      const studentAnswer = answers[question.id];
      
      if (question.type === 'objective') {
        objectiveMaxScore += question.marks;
        const isCorrect = studentAnswer === question.correctAnswer;
        
        if (isCorrect) {
          objectiveScore += question.marks;
        }

        gradedAnswers.push({
          questionId: question.id,
          question: question.question,
          type: 'objective',
          studentAnswer,
          correctAnswer: question.correctAnswer,
          isCorrect,
          marks: question.marks,
          scored: isCorrect ? question.marks : 0,
          explanation: question.explanation
        });
      } else {
        // Theory question - needs manual grading
        theoryMaxScore += question.marks;
        
        gradedAnswers.push({
          questionId: question.id,
          question: question.question,
          type: 'theory',
          studentAnswer,
          sampleAnswer: question.sampleAnswer,
          marks: question.marks,
          scored: null, // Will be graded manually
          needsGrading: true
        });
      }
    });

    // Calculate status
    const needsManualGrading = theoryMaxScore > 0;
    const submissionStatus = needsManualGrading ? 'submitted' : 'graded';
    
    // Partial score (only objective questions)
    const partialScore = needsManualGrading ? objectiveScore : objectiveScore;
    const maxScore = test.maxScore;

    // Create submission
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: testId,
        studentId: user.id,
        schoolId: user.schoolId,
        content: JSON.stringify({
          answers: gradedAnswers,
          timeSpent,
          submittedAt: new Date(),
          objectiveScore,
          objectiveMaxScore,
          theoryMaxScore,
          needsManualGrading
        }),
        submittedAt: new Date(),
        score: needsManualGrading ? null : objectiveScore,
        maxScore: maxScore,
        status: submissionStatus
      }
    });

    // If no manual grading needed, also create grade record
    if (!needsManualGrading) {
      const percentage = (objectiveScore / maxScore) * 100;
      const grade = percentage >= 90 ? 'A' : 
                   percentage >= 80 ? 'B' : 
                   percentage >= 70 ? 'C' : 
                   percentage >= 60 ? 'D' : 'F';

      await prisma.grade.create({
        data: {
          studentId: user.id,
          subjectId: test.subjectId,
          schoolId: user.schoolId,
          teacherId: test.teacherId,
          assessmentType: test.assignmentType,
          assessmentName: test.title,
          score: objectiveScore,
          maxScore: maxScore,
          percentage,
          grade,
          termName: 'Current Term',
          academicYear: new Date().getFullYear().toString(),
          assessmentDate: new Date(),
          createdBy: test.teacherId
        }
      });

      // Notify teacher
      await prisma.notification.create({
        data: {
          userId: test.teacherId,
          schoolId: user.schoolId,
          title: 'Test Completed',
          content: `${user.firstName} ${user.lastName} completed ${test.title} - Score: ${objectiveScore}/${maxScore}`,
          type: 'info'
        }
      });
    } else {
      // Notify teacher that grading is needed
      await prisma.notification.create({
        data: {
          userId: test.teacherId,
          schoolId: user.schoolId,
          title: 'Test Submitted - Grading Required',
          content: `${user.firstName} ${user.lastName} submitted ${test.title}. Theory questions need manual grading.`,
          type: 'alert',
          actionUrl: `/protected/teacher/subject/grading?submission=${submission.id}`,
          actionText: 'Grade Now'
        }
      });
    }

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        objectiveScore,
        objectiveMaxScore,
        theoryMaxScore,
        needsManualGrading,
        status: submissionStatus,
        gradedAnswers: testData.showResultsImmediately ? gradedAnswers : null
      }
    });

  } catch (error) {
    console.error('Submit test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit test' },
      { status: 500 }
    );
  }
}

// GET - Get student's test result
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submissionId');

    const submission = await prisma.assignmentSubmission.findUnique({
      where: {
        id: submissionId,
        studentId: user.id
      },
      include: {
        assignment: {
          include: {
            subject: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    const submissionData = JSON.parse(submission.content);

    return NextResponse.json({
      success: true,
      submission: {
        ...submission,
        details: submissionData
      }
    });

  } catch (error) {
    console.error('Get result error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch result' },
      { status: 500 }
    );
  }
}