// app/api/protected/teacher/subject/online-tests/grade-theory/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { submissionId, theoryGrades, feedback } = await request.json();

    // Get the submission
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            subject: true
          }
        },
        student: true
      }
    });

    if (!submission) {
      return NextResponse.json(
        { success: false, error: 'Submission not found' },
        { status: 404 }
      );
    }

    // Parse submission content
    const submissionData = JSON.parse(submission.content);
    
    // Update theory question scores
    let totalTheoryScore = 0;
    const updatedAnswers = submissionData.answers.map(answer => {
      if (answer.type === 'theory' && theoryGrades[answer.questionId] !== undefined) {
        const score = parseFloat(theoryGrades[answer.questionId]);
        totalTheoryScore += score;
        
        return {
          ...answer,
          scored: score,
          needsGrading: false,
          teacherFeedback: feedback[answer.questionId] || ''
        };
      }
      return answer;
    });

    // Calculate final score (objective + theory)
    const objectiveScore = submissionData.objectiveScore || 0;
    const finalScore = objectiveScore + totalTheoryScore;
    const maxScore = submission.maxScore;
    const percentage = (finalScore / maxScore) * 100;
    
    // Determine grade
    const grade = percentage >= 90 ? 'A' : 
                 percentage >= 80 ? 'B' : 
                 percentage >= 70 ? 'C' : 
                 percentage >= 60 ? 'D' : 'F';

    // Update submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: finalScore,
        feedback: feedback.general || '',
        status: 'graded',
        gradedBy: user.id,
        gradedAt: new Date(),
        content: JSON.stringify({
          ...submissionData,
          answers: updatedAnswers,
          finalScore,
          objectiveScore,
          theoryScore: totalTheoryScore
        })
      }
    });

    // Create grade record
    await prisma.grade.create({
      data: {
        studentId: submission.studentId,
        subjectId: submission.assignment.subjectId,
        schoolId: user.schoolId,
        teacherId: user.id,
        assessmentType: submission.assignment.assignmentType,
        assessmentName: submission.assignment.title,
        score: finalScore,
        maxScore: maxScore,
        percentage,
        grade,
        termName: 'Current Term',
        academicYear: new Date().getFullYear().toString(),
        assessmentDate: new Date(),
        comments: feedback.general || '',
        createdBy: user.id
      }
    });

    // Notify student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        schoolId: user.schoolId,
        title: 'Test Graded',
        content: `Your ${submission.assignment.assignmentType} "${submission.assignment.title}" has been graded. Score: ${finalScore}/${maxScore} (${Math.round(percentage)}%)`,
        type: 'success',
        actionUrl: `/protected/student/tests/result/${submissionId}`,
        actionText: 'View Result'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Theory questions graded successfully',
      submission: {
        id: updatedSubmission.id,
        finalScore,
        percentage: Math.round(percentage),
        grade
      }
    });

  } catch (error) {
    console.error('Grade theory error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to grade theory questions' },
      { status: 500 }
    );
  }
}

// GET - Get submissions needing theory grading
export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    const where = {
      assignment: {
        teacherId: user.id,
        assignmentType: { in: ['test', 'exam', 'quiz'] }
      },
      status: 'submitted' // Needs grading
    };

    if (testId) {
      where.assignmentId = testId;
    }

    const submissions = await prisma.assignmentSubmission.findMany({
      where,
      include: {
        assignment: {
          include: {
            subject: true
          }
        },
        student: {
          include: {
            studentProfile: true
          }
        }
      },
      orderBy: { submittedAt: 'desc' }
    });

    // Parse and filter only those with theory questions
    const submissionsNeedingGrading = submissions.filter(sub => {
      const data = JSON.parse(sub.content);
      return data.needsManualGrading;
    }).map(sub => {
      const data = JSON.parse(sub.content);
      return {
        id: sub.id,
        student: {
          id: sub.student.id,
          name: `${sub.student.firstName} ${sub.student.lastName}`,
          className: sub.student.studentProfile?.className
        },
        assignment: {
          id: sub.assignment.id,
          title: sub.assignment.title,
          subject: sub.assignment.subject.name
        },
        submittedAt: sub.submittedAt,
        objectiveScore: data.objectiveScore,
        objectiveMaxScore: data.objectiveMaxScore,
        theoryMaxScore: data.theoryMaxScore,
        answers: data.answers.filter(a => a.type === 'theory')
      };
    });

    return NextResponse.json({
      success: true,
      submissions: submissionsNeedingGrading
    });

  } catch (error) {
    console.error('Fetch grading queue error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch submissions' },
      { status: 500 }
    );
  }
}