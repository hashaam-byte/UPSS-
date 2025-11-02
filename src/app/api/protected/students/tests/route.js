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
    // Valid AssignmentType values: homework, project, quiz, exam, essay, lab_report, presentation, research, classwork
    // Valid AssignmentStatus values: draft, active, closed, cancelled
    const whereClause = {
      schoolId: user.schoolId,
      assignmentType: { in: ['quiz', 'exam'] },
      classes: { has: studentProfile.className }
    };

    // Filter by status - handle frontend status values
    // Frontend sends: 'available', 'upcoming', 'completed', 'pending', 'all'
    // We need to map these to database queries
    if (status === 'available') {
      // Active tests that are currently available
      whereClause.status = 'active';
      whereClause.availableFrom = { lte: now };
      whereClause.dueDate = { gte: now };
    } else if (status === 'upcoming') {
      // Tests that are scheduled but not yet available
      whereClause.availableFrom = { gt: now };
      whereClause.status = 'active';
    } else if (status === 'draft') {
      whereClause.status = 'draft';
    } else if (status === 'closed') {
      whereClause.status = 'closed';
    } else if (status === 'cancelled') {
      whereClause.status = 'cancelled';
    } else if (status === 'active') {
      whereClause.status = 'active';
    }
    // For 'completed' and 'pending', we'll filter after fetching based on submissions
    // For 'all', no status filter is applied

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
        } : null,
        // Helper properties for filtering
        hasSubmission: !!submission,
        isGraded: submission?.status === 'graded',
        isPending: submission && submission.status !== 'graded',
        isAvailable: test.status === 'active' && 
                     test.availableFrom <= now && 
                     test.dueDate >= now,
        isUpcoming: test.availableFrom > now,
        isPastDue: test.dueDate < now
      };
    });

    // Apply client-side filtering for submission-based statuses
    let filteredTests = transformedTests;
    
    if (status === 'completed') {
      // Tests that have been submitted and graded
      filteredTests = transformedTests.filter(t => t.isGraded);
    } else if (status === 'pending') {
      // Tests that have been submitted but not yet graded
      filteredTests = transformedTests.filter(t => t.isPending);
    } else if (status === 'not-submitted') {
      // Tests available but not submitted
      filteredTests = transformedTests.filter(t => !t.hasSubmission && t.isAvailable);
    }

    return NextResponse.json({
      success: true,
      data: {
        tests: filteredTests,
        studentClass: studentProfile.className,
        summary: {
          total: filteredTests.length,
          available: transformedTests.filter(t => t.isAvailable && !t.hasSubmission).length,
          completed: transformedTests.filter(t => t.isGraded).length,
          pending: transformedTests.filter(t => t.isPending).length,
          upcoming: transformedTests.filter(t => t.isUpcoming).length
        }
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