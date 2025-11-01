// src/app/api/protected/students/tests/route.js
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

// src/app/api/protected/students/tests/[id]/route.js
// import { NextResponse } from 'next/server';
// import { prisma } from '@/lib/prisma';
// import { requireAuth } from '@/lib/auth';

export async function GET_TEST_BY_ID(request, { params }) {
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

// src/app/api/protected/students/tests/submit/route.js
export async function POST_SUBMIT(request) {
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
          type: 'success',
          actionUrl: `/protected/students/tests/result/${testId}`,
          actionText: 'View Result'
        }
      });
    }

    // Notify teacher
    await prisma.notification.create({
      data: {
        userId: test.teacherId,
        schoolId: user.schoolId,
        title: needsManualGrading ? 'Test Submitted - Grading Required' : 'Test Completed',
        content: `${user.firstName} ${user.lastName} ${autoSubmit ? 'auto-submitted' : 'submitted'} ${test.title}${needsManualGrading ? '. Manual grading required.' : ''}`,
        type: needsManualGrading ? 'alert' : 'info',
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