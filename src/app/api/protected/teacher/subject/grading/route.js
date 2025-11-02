// app/api/protected/teacher/subject/grading/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper function to automatically grade objective questions
function autoGradeObjectiveQuestions(questions, studentAnswers) {
  let totalObjectiveScore = 0;
  let maxObjectiveScore = 0;
  const gradedQuestions = [];

  questions.forEach((question, index) => {
    if (question.type === 'objective' || question.type === 'multiple_choice') {
      maxObjectiveScore += question.points || 1;
      
      const studentAnswer = studentAnswers[question.id] || studentAnswers[index];
      const correctAnswer = question.correctAnswer || question.answer;
      
      let isCorrect = false;
      
      // Handle different answer formats
      if (Array.isArray(correctAnswer)) {
        // Multiple correct answers (checkbox type)
        isCorrect = JSON.stringify(studentAnswer?.sort()) === JSON.stringify(correctAnswer.sort());
      } else {
        // Single correct answer
        isCorrect = String(studentAnswer).toLowerCase().trim() === String(correctAnswer).toLowerCase().trim();
      }
      
      if (isCorrect) {
        totalObjectiveScore += question.points || 1;
      }
      
      gradedQuestions.push({
        questionId: question.id,
        questionNumber: index + 1,
        type: question.type,
        question: question.text || question.question,
        studentAnswer: studentAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: question.points || 1,
        scored: isCorrect ? (question.points || 1) : 0
      });
    }
  });

  return {
    totalObjectiveScore,
    maxObjectiveScore,
    gradedQuestions,
    objectivePercentage: maxObjectiveScore > 0 ? (totalObjectiveScore / maxObjectiveScore) * 100 : 0
  };
}

// GET - Fetch submissions to grade
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignment');
    const status = searchParams.get('status') || 'submitted';

    const whereClause = {
      assignment: {
        teacherId: user.id
      }
    };

    if (assignmentId && assignmentId !== 'all') {
      whereClause.assignmentId = assignmentId;
    }

    if (status && status !== 'all') {
      if (status === 'pending') {
        whereClause.status = 'submitted';
        whereClause.score = null;
      } else if (status === 'graded') {
        whereClause.status = 'graded';
      } else if (status === 'late') {
        whereClause.isLateSubmission = true;
      }
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
                className: true
              }
            }
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueDate: true,
            assignmentType: true,
            // Assuming questions are stored as JSON in a field
            // Adjust based on your actual schema
            description: true,
            subject: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: [
        { submittedAt: 'asc' }
      ]
    });

    const formattedSubmissions = submissions.map(sub => {
      // Parse submission content if it contains answers
      let parsedContent = null;
      let autoGradingResult = null;
      
      try {
        if (sub.content) {
          parsedContent = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
          
          // If assignment has questions, auto-grade objective questions
          if (parsedContent.questions && parsedContent.answers) {
            autoGradingResult = autoGradeObjectiveQuestions(
              parsedContent.questions,
              parsedContent.answers
            );
          }
        }
      } catch (e) {
        console.error('Error parsing submission content:', e);
      }

      return {
        id: sub.id,
        content: sub.content,
        parsedContent: parsedContent,
        autoGradingResult: autoGradingResult,
        attachments: sub.attachments,
        submittedAt: sub.submittedAt,
        isLateSubmission: sub.isLateSubmission,
        attemptNumber: sub.attemptNumber,
        score: sub.score,
        maxScore: sub.maxScore,
        feedback: sub.feedback,
        gradedAt: sub.gradedAt,
        status: sub.status,
        hasObjectiveQuestions: autoGradingResult !== null,
        objectiveScore: autoGradingResult?.totalObjectiveScore,
        maxObjectiveScore: autoGradingResult?.maxObjectiveScore,
        requiresManualGrading: parsedContent?.hasTheoryQuestions || false,
        student: {
          id: sub.student.id,
          name: `${sub.student.firstName} ${sub.student.lastName}`,
          email: sub.student.email,
          studentId: sub.student.studentProfile?.studentId,
          className: sub.student.studentProfile?.className
        },
        assignment: {
          id: sub.assignment.id,
          title: sub.assignment.title,
          type: sub.assignment.assignmentType,
          maxScore: sub.assignment.maxScore,
          dueDate: sub.assignment.dueDate,
          subject: sub.assignment.subject.name,
          subjectCode: sub.assignment.subject.code
        }
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        submissions: formattedSubmissions,
        total: formattedSubmissions.length,
        pending: formattedSubmissions.filter(s => !s.score).length,
        graded: formattedSubmissions.filter(s => s.score !== null).length,
        autoGradable: formattedSubmissions.filter(s => s.hasObjectiveQuestions && !s.requiresManualGrading).length
      }
    });

  } catch (error) {
    console.error('Fetch submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions', details: error.message },
      { status: 500 }
    );
  }
}

// POST - Grade a submission (with auto-grading for objective questions)
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionId, theoryScore, feedback, autoGrade } = body;

    if (!submissionId) {
      return NextResponse.json(
        { success: false, error: 'Missing submission ID' },
        { status: 400 }
      );
    }

    // Fetch submission with assignment details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            teacherId: true,
            maxScore: true,
            assignmentType: true,
            description: true
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

    if (submission.assignment.teacherId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to grade this submission' },
        { status: 403 }
      );
    }

    let totalScore = 0;
    let gradingDetails = {};

    // Parse submission content
    let parsedContent = null;
    try {
      parsedContent = typeof submission.content === 'string' 
        ? JSON.parse(submission.content) 
        : submission.content;
    } catch (e) {
      console.error('Error parsing submission content:', e);
    }

    // Auto-grade objective questions if enabled
    if (autoGrade && parsedContent?.questions && parsedContent?.answers) {
      const autoGradingResult = autoGradeObjectiveQuestions(
        parsedContent.questions,
        parsedContent.answers
      );
      
      totalScore += autoGradingResult.totalObjectiveScore;
      gradingDetails.objectiveGrading = autoGradingResult;
    }

    // Add theory score if provided
    if (theoryScore !== undefined && theoryScore !== null) {
      totalScore += parseInt(theoryScore);
      gradingDetails.theoryScore = parseInt(theoryScore);
    }

    // Validate total score
    const maxScore = submission.maxScore || submission.assignment.maxScore;
    if (totalScore > maxScore) {
      return NextResponse.json(
        { success: false, error: `Total score (${totalScore}) exceeds max score (${maxScore})` },
        { status: 400 }
      );
    }

    // Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: totalScore,
        feedback: feedback || null,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: user.id,
        // Store grading details as JSON in content or a separate field
        content: JSON.stringify({
          ...parsedContent,
          gradingDetails: gradingDetails
        })
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        },
        assignment: {
          select: {
            title: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        submission: updatedSubmission,
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: ((totalScore / maxScore) * 100).toFixed(2),
        gradingDetails: gradingDetails,
        message: 'Grade submitted successfully'
      }
    });

  } catch (error) {
    console.error('Grade submission error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit grade', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Auto-grade all objective questions in a submission
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { submissionId } = body;

    // Fetch submission
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            teacherId: true,
            maxScore: true
          }
        }
      }
    });

    if (!submission || submission.assignment.teacherId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or submission not found' },
        { status: 403 }
      );
    }

    // Parse and auto-grade
    let parsedContent = null;
    try {
      parsedContent = typeof submission.content === 'string' 
        ? JSON.parse(submission.content) 
        : submission.content;
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission content format' },
        { status: 400 }
      );
    }

    if (!parsedContent?.questions || !parsedContent?.answers) {
      return NextResponse.json(
        { success: false, error: 'No questions found in submission' },
        { status: 400 }
      );
    }

    const autoGradingResult = autoGradeObjectiveQuestions(
      parsedContent.questions,
      parsedContent.answers
    );

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submissionId,
        autoGradingResult: autoGradingResult,
        message: 'Objective questions auto-graded successfully'
      }
    });

  } catch (error) {
    console.error('Auto-grade error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to auto-grade', details: error.message },
      { status: 500 }
    );
  }
}