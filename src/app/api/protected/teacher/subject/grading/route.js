// src/app/api/protected/teacher/subject/grading/route.js - IMPROVED
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Helper: Auto-grade objective questions with VERIFICATION
function autoGradeObjectiveQuestions(questions, studentAnswers) {
  let totalObjectiveScore = 0;
  let maxObjectiveScore = 0;
  const gradedQuestions = [];

  // Ensure we're using the correct data structures
  console.log('[Auto-Grade] Starting grading process');
  console.log('[Auto-Grade] Questions count:', questions?.length);
  console.log('[Auto-Grade] Student answers:', Object.keys(studentAnswers || {}).length);

  questions.forEach((question, index) => {
    if (question.type === 'objective' || question.type === 'multiple_choice') {
      const questionMarks = question.points || question.marks || 1;
      maxObjectiveScore += questionMarks;
      
      // Get student answer - try multiple formats
      let studentAnswer = studentAnswers[question.id];
      if (studentAnswer === undefined) {
        studentAnswer = studentAnswers[index];
      }
      if (studentAnswer === undefined) {
        studentAnswer = studentAnswers[`q_${index + 1}`];
      }
      
      // Get correct answer - handle multiple formats
      let correctAnswer = question.correctAnswer;
      if (correctAnswer === undefined) {
        correctAnswer = question.answer;
      }
      
      // VERIFICATION: Log each question grading
      console.log(`[Auto-Grade Q${index + 1}]`, {
        questionId: question.id,
        questionText: question.question?.substring(0, 50),
        studentAnswer: studentAnswer,
        correctAnswer: correctAnswer,
        studentAnswerType: typeof studentAnswer,
        correctAnswerType: typeof correctAnswer
      });
      
      // Determine if answer is correct
      let isCorrect = false;
      
      if (Array.isArray(correctAnswer)) {
        // Multiple correct answers (checkbox type)
        const studentAnswerArray = Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer];
        isCorrect = JSON.stringify(studentAnswerArray.sort()) === JSON.stringify(correctAnswer.sort());
      } else {
        // Single correct answer - CAREFUL TYPE CONVERSION
        // Convert both to same type for comparison
        const studentAnswerNormalized = String(studentAnswer).toLowerCase().trim();
        const correctAnswerNormalized = String(correctAnswer).toLowerCase().trim();
        
        isCorrect = studentAnswerNormalized === correctAnswerNormalized;
        
        // Also check numeric equivalence
        if (!isCorrect && !isNaN(studentAnswer) && !isNaN(correctAnswer)) {
          isCorrect = Number(studentAnswer) === Number(correctAnswer);
        }
      }
      
      // Award marks if correct
      if (isCorrect) {
        totalObjectiveScore += questionMarks;
      }
      
      // VERIFICATION: Log result
      console.log(`[Auto-Grade Q${index + 1} Result]`, {
        isCorrect,
        marksAwarded: isCorrect ? questionMarks : 0
      });
      
      gradedQuestions.push({
        questionId: question.id,
        questionNumber: index + 1,
        type: question.type,
        question: question.text || question.question,
        studentAnswer: studentAnswer,
        correctAnswer: correctAnswer,
        isCorrect: isCorrect,
        points: questionMarks,
        scored: isCorrect ? questionMarks : 0,
        options: question.options || null,
        explanation: question.explanation || null
      });
    }
  });

  // VERIFICATION: Log final totals
  console.log('[Auto-Grade Summary]', {
    totalObjectiveScore,
    maxObjectiveScore,
    percentage: maxObjectiveScore > 0 ? (totalObjectiveScore / maxObjectiveScore) * 100 : 0,
    gradedQuestionsCount: gradedQuestions.length
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
        teacherId: user.id,
        schoolId: user.schoolId
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
            attachments: true,
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
      let parsedContent = null;
      let autoGradingResult = null;
      
      try {
        if (sub.content) {
          parsedContent = typeof sub.content === 'string' ? JSON.parse(sub.content) : sub.content;
          
          // Get questions from assignment attachments
          let questions = [];
          if (sub.assignment.attachments && sub.assignment.attachments.length > 0) {
            const testConfig = JSON.parse(sub.assignment.attachments[0]);
            questions = testConfig.questions || [];
          }
          
          // If we have questions and answers, auto-grade
          if (questions.length > 0 && parsedContent.answers) {
            // Build answers object from parsedContent
            const answersMap = {};
            if (Array.isArray(parsedContent.answers)) {
              parsedContent.answers.forEach(ans => {
                answersMap[ans.questionId] = ans.studentAnswer;
              });
            } else {
              Object.assign(answersMap, parsedContent.answers);
            }
            
            autoGradingResult = autoGradeObjectiveQuestions(questions, answersMap);
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

// POST - Grade a submission with VERIFICATION
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

    // Fetch submission with full details
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            teacherId: true,
            maxScore: true,
            assignmentType: true,
            attachments: true,
            subjectId: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            schoolId: true
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

    // Get questions from assignment
    let questions = [];
    if (submission.assignment.attachments && submission.assignment.attachments.length > 0) {
      const testConfig = JSON.parse(submission.assignment.attachments[0]);
      questions = testConfig.questions || [];
    }

    // Auto-grade objective questions if enabled
    if (autoGrade && parsedContent && questions.length > 0) {
      // Build answers map
      const answersMap = {};
      if (Array.isArray(parsedContent.answers)) {
        parsedContent.answers.forEach(ans => {
          answersMap[ans.questionId] = ans.studentAnswer;
        });
      } else if (parsedContent.answers) {
        Object.assign(answersMap, parsedContent.answers);
      }
      
      const autoGradingResult = autoGradeObjectiveQuestions(questions, answersMap);
      
      totalScore += autoGradingResult.totalObjectiveScore;
      gradingDetails.objectiveGrading = autoGradingResult;
      
      console.log('[Grading] Auto-grade result:', {
        submissionId,
        objectiveScore: autoGradingResult.totalObjectiveScore,
        maxObjectiveScore: autoGradingResult.maxObjectiveScore
      });
    }

    // Add theory score if provided
    if (theoryScore !== undefined && theoryScore !== null) {
      const theoryScoreNum = parseInt(theoryScore);
      totalScore += theoryScoreNum;
      gradingDetails.theoryScore = theoryScoreNum;
    }

    // Validate total score
    const maxScore = submission.maxScore || submission.assignment.maxScore;
    if (totalScore > maxScore) {
      return NextResponse.json(
        { success: false, error: `Total score (${totalScore}) exceeds max score (${maxScore})` },
        { status: 400 }
      );
    }

    // Calculate percentage and grade
    const percentage = (totalScore / maxScore) * 100;
    const gradeLetter = percentage >= 90 ? 'A' :
                       percentage >= 80 ? 'B' :
                       percentage >= 70 ? 'C' :
                       percentage >= 60 ? 'D' : 'F';

    // Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: totalScore,
        feedback: feedback || null,
        status: 'graded',
        gradedAt: new Date(),
        gradedBy: user.id,
        content: JSON.stringify({
          ...parsedContent,
          gradingDetails: gradingDetails
        })
      }
    });

    // Create or update grade record
    await prisma.grade.upsert({
      where: {
        studentId_subjectId_assessmentName_termName: {
          studentId: submission.student.id,
          subjectId: submission.assignment.subjectId,
          assessmentName: `Assignment: ${submission.assignment.id}`,
          termName: 'Current Term'
        }
      },
      update: {
        score: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        grade: gradeLetter,
        assessmentDate: new Date(),
        comments: feedback || null
      },
      create: {
        studentId: submission.student.id,
        subjectId: submission.assignment.subjectId,
        schoolId: submission.student.schoolId,
        teacherId: user.id,
        assessmentType: submission.assignment.assignmentType,
        assessmentName: `Assignment: ${submission.assignment.id}`,
        score: totalScore,
        maxScore: maxScore,
        percentage: percentage,
        grade: gradeLetter,
        termName: 'Current Term',
        academicYear: new Date().getFullYear().toString(),
        assessmentDate: new Date(),
        comments: feedback || null,
        createdBy: user.id
      }
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: submission.student.id,
        schoolId: submission.student.schoolId,
        title: 'Assignment Graded',
        content: `Your assignment has been graded. Score: ${totalScore}/${maxScore} (${Math.round(percentage)}%)`,
        type: 'success',
        actionUrl: `/protected/students/assignments/${submission.assignmentId}/result`,
        actionText: 'View Result'
      }
    });

    console.log('[Grading Complete]', {
      submissionId,
      totalScore,
      maxScore,
      percentage: percentage.toFixed(2),
      grade: gradeLetter
    });

    return NextResponse.json({
      success: true,
      data: {
        submission: updatedSubmission,
        totalScore: totalScore,
        maxScore: maxScore,
        percentage: percentage.toFixed(2),
        grade: gradeLetter,
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

// PUT - Auto-grade objective questions with verification
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

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: {
            teacherId: true,
            maxScore: true,
            attachments: true
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

    // Parse content and questions
    let parsedContent = null;
    let questions = [];
    
    try {
      parsedContent = typeof submission.content === 'string' 
        ? JSON.parse(submission.content) 
        : submission.content;
        
      if (submission.assignment.attachments && submission.assignment.attachments.length > 0) {
        const testConfig = JSON.parse(submission.assignment.attachments[0]);
        questions = testConfig.questions || [];
      }
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid submission content format' },
        { status: 400 }
      );
    }

    if (questions.length === 0 || !parsedContent?.answers) {
      return NextResponse.json(
        { success: false, error: 'No questions or answers found in submission' },
        { status: 400 }
      );
    }

    // Build answers map
    const answersMap = {};
    if (Array.isArray(parsedContent.answers)) {
      parsedContent.answers.forEach(ans => {
        answersMap[ans.questionId] = ans.studentAnswer;
      });
    } else {
      Object.assign(answersMap, parsedContent.answers);
    }

    const autoGradingResult = autoGradeObjectiveQuestions(questions, answersMap);

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