// app/api/protected/teacher/subject/grading/bulk/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST - Bulk grade submissions
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
    const { grades } = body;

    if (!grades || !Array.isArray(grades) || grades.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid grades data' },
        { status: 400 }
      );
    }

    // Verify all submissions belong to this teacher
    const submissionIds = grades.map(g => g.submissionId);
    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        id: { in: submissionIds },
        assignment: {
          teacherId: user.id
        }
      },
      include: {
        assignment: {
          select: {
            maxScore: true
          }
        }
      }
    });

    if (submissions.length !== grades.length) {
      return NextResponse.json(
        { success: false, error: 'Some submissions not found or unauthorized' },
        { status: 403 }
      );
    }

    // Validate all scores
    for (const grade of grades) {
      const submission = submissions.find(s => s.id === grade.submissionId);
      const maxScore = submission.maxScore || submission.assignment.maxScore;

      if (grade.score < 0 || grade.score > maxScore) {
        return NextResponse.json(
          { success: false, error: `Invalid score for a submission. Must be between 0 and ${maxScore}` },
          { status: 400 }
        );
      }
    }

    // Update all submissions in a transaction
    const results = await prisma.$transaction(
      grades.map(grade => 
        prisma.assignmentSubmission.update({
          where: { id: grade.submissionId },
          data: {
            score: parseInt(grade.score),
            feedback: grade.feedback || null,
            status: 'graded',
            gradedAt: new Date(),
            gradedBy: user.id
          }
        })
      )
    );

    return NextResponse.json({
      success: true,
      data: {
        gradedCount: results.length,
        message: `${results.length} submissions graded successfully`
      }
    });

  } catch (error) {
    console.error('Bulk grading error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit bulk grades', details: error.message },
      { status: 500 }
    );
  }
}
