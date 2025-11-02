// ===================================================================
// FILE: src/app/api/protected/students/tests/submit/route.js
// ===================================================================
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await requireAuth(['student']);
    const { testId, answers, timeSpent, autoSubmit } = await request.json();

    // Get the test
    const test = await prisma.assignment.findUnique({
      where: { id: testId },
      include: { subject: true, teacher: true }
    });

    if (!test) {
      return NextResponse.json(
        { success: false, error: 'Test not found' },
        { status: 404 }
      );
    }

    // Parse test configuration
    const testConfig = JSON.parse(test.attachments[0]);
    const questions = testConfig.questions;

    // Auto-grade objective questions
    let objectiveScore = 0;
    let objectiveMaxScore = 0;
    let theoryMaxScore = 0;
    const gradedAnswers = [];

    questions.forEach((question) => {
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
          scored: null,
          needsGrading: true
        });
      }
    });

    const needsManualGrading = theoryMaxScore > 0;
    const submissionStatus = needsManualGrading ? 'submitted' : 'graded';
    const finalScore = needsManualGrading ? null : objectiveScore;

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
          needsManualGrading,
          autoSubmit
        }),
        submittedAt: new Date(),
        score: finalScore,
        maxScore: test.maxScore,
        status: submissionStatus,
        isLateSubmission: new Date() > test.dueDate
      }
    });

    // If no manual grading needed, create grade record
    if (!needsManualGrading) {
      const percentage = (objectiveScore / test.maxScore) * 100;
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
          maxScore: test.maxScore,
          percentage,
          grade,
          termName: 'Current Term',
          academicYear: new Date().getFullYear().toString(),
          assessmentDate: new Date(),
          createdBy: test.teacherId
        }
      });

      // Notify student
      await prisma.notification.create({
        data: {
          userId: user.id,
          schoolId: user.schoolId,
          title: 'Test Submitted',
          content: `Your ${test.title} has been submitted and graded. Score: ${objectiveScore}/${test.maxScore}`,
          type: 'success', // Valid NotificationType
          actionUrl: `/protected/students/tests/result/${testId}`,
          actionText: 'View Result'
        }
      });
    }

    // Notify teacher
    // Valid NotificationType values: info, success, warning, error, system
    await prisma.notification.create({
      data: {
        userId: test.teacherId,
        schoolId: user.schoolId,
        title: needsManualGrading ? 'Test Submitted - Grading Required' : 'Test Completed',
        content: `${user.firstName} ${user.lastName} ${autoSubmit ? 'auto-submitted' : 'submitted'} ${test.title}${needsManualGrading ? '. Manual grading required.' : ''}`,
        type: needsManualGrading ? 'warning' : 'info', // Changed from 'alert' to 'warning'
        actionUrl: needsManualGrading ? `/protected/teacher/subject/online-tests/grade/${testId}` : null,
        actionText: needsManualGrading ? 'Grade Now' : null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test submitted successfully',
      submission: {
        id: submission.id,
        objectiveScore,
        objectiveMaxScore,
        theoryMaxScore,
        needsManualGrading,
        status: submissionStatus,
        showResults: testConfig.showResultsImmediately,
        gradedAnswers: testConfig.showResultsImmediately && !needsManualGrading ? gradedAnswers : null
      }
    });
  } catch (error) {
    console.error('Submit test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit test' },
      { status: 500 }
    );
  }
}