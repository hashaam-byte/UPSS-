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

// POST - Submit bulk grades
export async function POST(request) {
  try {
    await requireAuth(['subject_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { grades } = body;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json({
        error: 'Grades array is required and must not be empty'
      }, { status: 400 });
    }

    const results = {
      successful: [],
      failed: [],
      totalProcessed: grades.length
    };

    // Process each grade
    for (const gradeData of grades) {
      try {
        const { submissionId, score, feedback = '' } = gradeData;

        if (!submissionId || score === null || score === undefined) {
          results.failed.push({
            submissionId,
            error: 'Submission ID and score are required'
          });
          continue;
        }

        const scoreNum = parseInt(score);
        if (isNaN(scoreNum) || scoreNum < 0) {
          results.failed.push({
            submissionId,
            error: 'Score must be a valid number greater than or equal to 0'
          });
          continue;
        }

        // TODO: In production, verify and update each submission
        
        const submission = await prisma.assignmentSubmission.findUnique({
          where: { id: submissionId },
          include: {
            assignment: {
              include: {
                teacher: true
              }
            },
            student: true
          }
        });

        if (!submission) {
          results.failed.push({
            submissionId,
            error: 'Submission not found'
          });
          continue;
        }

        // Verify teacher owns this assignment
        if (submission.assignment.teacherId !== subjectTeacher.id) {
          results.failed.push({
            submissionId,
            error: 'You can only grade your own assignments'
          });
          continue;
        }

        // Verify score doesn't exceed max score
        if (scoreNum > submission.assignment.maxScore) {
          results.failed.push({
            submissionId,
            error: `Score cannot exceed maximum score of ${submission.assignment.maxScore}`
          });
          continue;
        }

        // Update the submission
        await prisma.assignmentSubmission.update({
          where: { id: submissionId },
          data: {
            score: scoreNum,
            feedback: feedback,
            gradedAt: new Date(),
            gradedBy: subjectTeacher.id,
            status: 'graded'
          }
        });

        // Create notification for student
        await prisma.notification.create({
          data: {
            userId: submission.student.id,
            schoolId: subjectTeacher.schoolId,
            title: 'Assignment Graded',
            content: `Your ${submission.assignment.title} has been graded. Score: ${scoreNum}/${submission.assignment.maxScore}`,
            type: 'info',
            priority: 'normal',
            isRead: false
          }
        });
        

        results.successful.push({
          submissionId,
          score: scoreNum,
          feedback: feedback,
          gradedAt: new Date()
        });

      } catch (error) {
        results.failed.push({
          submissionId: gradeData.submissionId,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Bulk grading completed. ${results.successful.length} successful, ${results.failed.length} failed.`,
      data: results
    });

  } catch (error) {
    console.error('Bulk grading error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}