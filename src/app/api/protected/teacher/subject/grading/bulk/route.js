// /app/api/protected/teacher/subject/grading/bulk/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify subject teacher access
async function verifySubjectTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'subject_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

// PUT - Bulk grade submissions
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { submissionIds, score, feedback = 'Bulk graded' } = body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
      return NextResponse.json({
        error: 'Submission IDs array is required'
      }, { status: 400 });
    }

    if (score === undefined || score === null || isNaN(score)) {
      return NextResponse.json({
        error: 'Valid score is required'
      }, { status: 400 });
    }

    // Verify all submissions belong to teacher's assignments
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        id: {
          in: submissionIds
        },
        schoolId: subjectTeacher.schoolId,
        assignment: {
          teacherId: subjectTeacher.id
        }
      },
      include: {
        assignment: {
          include: {
            subject: true
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (submissions.length === 0) {
      return NextResponse.json({
        error: 'No valid submissions found for bulk grading'
      }, { status: 404 });
    }

    if (submissions.length !== submissionIds.length) {
      return NextResponse.json({
        error: 'Some submissions not found or access denied'
      }, { status: 403 });
    }

    // Validate score is within range for all assignments
    const invalidScores = submissions.filter(submission => 
      score < 0 || score > submission.assignment.maxScore
    );

    if (invalidScores.length > 0) {
      return NextResponse.json({
        error: `Score must be between 0 and the assignment's maximum score`
      }, { status: 400 });
    }

    // Begin transaction for bulk operations
    const results = await prisma.$transaction(async (tx) => {
      const gradedSubmissions = [];
      const notifications = [];
      const grades = [];

      for (const submission of submissions) {
        // Update submission
        const updatedSubmission = await tx.assignmentSubmission.update({
          where: { id: submission.id },
          data: {
            score: parseInt(score),
            feedback: feedback,
            gradedAt: new Date(),
            gradedBy: subjectTeacher.id,
            status: 'graded'
          }
        });

        gradedSubmissions.push({
          id: submission.id,
          studentName: `${submission.student.firstName} ${submission.student.lastName}`,
          assignmentTitle: submission.assignment.title,
          score: parseInt(score),
          maxScore: submission.assignment.maxScore
        });

        // Prepare notification
        notifications.push({
          userId: submission.studentId,
          schoolId: subjectTeacher.schoolId,
          title: `Assignment Graded: ${submission.assignment.title}`,
          content: `Your assignment "${submission.assignment.title}" has been graded. Score: ${score}/${submission.assignment.maxScore}`,
          type: 'info',
          priority: 'normal',
          isRead: false
        });

        // Prepare grade entry
        const percentage = (score / submission.assignment.maxScore) * 100;
        const gradeValue = getGradeFromPercentage(percentage);

        grades.push({
          studentId: submission.studentId,
          subjectId: submission.assignment.subjectId,
          schoolId: subjectTeacher.schoolId,
          teacherId: subjectTeacher.id,
          assessmentType: 'assignment',
          assessmentName: submission.assignment.title,
          score: parseInt(score),
          maxScore: submission.assignment.maxScore,
          percentage: Number(percentage.toFixed(2)),
          grade: gradeValue,
          term: getCurrentTerm(),
          academicYear: new Date().getFullYear().toString(),
          assessmentDate: new Date(),
          comments: feedback,
          createdBy: subjectTeacher.id
        });
      }

      // Bulk create notifications
      await tx.notification.createMany({
        data: notifications
      });

      // Bulk create grades
      await tx.grade.createMany({
        data: grades
      });

      return {
        gradedSubmissions,
        gradedCount: gradedSubmissions.length
      };
    });

    return NextResponse.json({
      success: true,
      message: `Successfully graded ${results.gradedCount} submissions`,
      data: {
        gradedCount: results.gradedCount,
        gradedSubmissions: results.gradedSubmissions,
        bulkScore: parseInt(score),
        feedback: feedback,
        gradedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Bulk grade submissions error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get grade from percentage
function getGradeFromPercentage(percentage) {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

// Helper function to get current term
function getCurrentTerm() {
  const month = new Date().getMonth() + 1; // 0-based to 1-based
  
  if (month >= 9 && month <= 12) {
    return 'First Term';
  } else if (month >= 1 && month <= 4) {
    return 'Second Term';
  } else {
    return 'Third Term';
  }
}