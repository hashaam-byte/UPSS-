// app/api/protected/teacher/subject/online-tests/[id]/route.js
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch single test details
export async function GET(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    const testId = params.id;

    const test = await prisma.assignment.findUnique({
      where: {
        id: testId,
        schoolId: user.schoolId,
        teacherId: user.id // Ensure teacher owns this test
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
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentProfile: {
                  select: {
                    className: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        }
      }
    });

    if (!test) {
      return NextResponse.json({
        success: false,
        error: 'Test not found'
      }, { status: 404 });
    }

    // Parse test config
    let testConfig = null;
    if (test.attachments && test.attachments.length > 0) {
      try {
        testConfig = JSON.parse(test.attachments[0]);
      } catch (e) {
        console.error('Error parsing test config:', e);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        test,
        testConfig
      }
    });

  } catch (error) {
    console.error('Get test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch test' },
      { status: 500 }
    );
  }
}

// PUT - Update test
export async function PUT(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    const testId = params.id;
    
    const data = await request.json();
    const {
      title,
      description,
      subjectId,
      testType,
      duration,
      classes,
      scheduledDate,
      totalMarks,
      passingMarks,
      instructions,
      allowRetake,
      showResultsImmediately,
      shuffleQuestions,
      shuffleOptions,
      questions,
      status
    } = data;

    // Verify test exists and belongs to teacher
    const existingTest = await prisma.assignment.findUnique({
      where: {
        id: testId,
        schoolId: user.schoolId,
        teacherId: user.id
      }
    });

    if (!existingTest) {
      return NextResponse.json({
        success: false,
        error: 'Test not found or you do not have permission to edit it'
      }, { status: 404 });
    }

    // Validate and parse dates
    let dueDate;
    let availableFrom;

    if (scheduledDate) {
      const parsedDate = new Date(scheduledDate);
      if (!isNaN(parsedDate.getTime())) {
        availableFrom = parsedDate;
        dueDate = new Date(parsedDate.getTime() + 7 * 24 * 60 * 60 * 1000);
      } else {
        availableFrom = new Date();
        dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }
    } else {
      availableFrom = new Date();
      dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    // Map testType to valid AssignmentType enum
    const validAssignmentType = testType === 'test' ? 'exam' : (testType === 'quiz' ? 'quiz' : 'exam');

    // Map status to valid AssignmentStatus enum
    const validStatus = status === 'published' ? 'active' : (status || 'draft');

    // Calculate total marks from questions
    const calculatedTotalMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

    console.log('[Update Test] Updating test:', {
      id: testId,
      title,
      assignmentType: validAssignmentType,
      status: validStatus,
      classes,
      totalMarks: calculatedTotalMarks
    });

    // Update the test
    const updatedTest = await prisma.assignment.update({
      where: { id: testId },
      data: {
        title,
        description: description || '',
        subjectId,
        instructions: instructions || '',
        assignmentType: validAssignmentType,
        classes: classes || [],
        maxScore: calculatedTotalMarks || totalMarks || 100,
        passingScore: passingMarks || 60,
        status: validStatus,
        dueDate: dueDate,
        availableFrom: availableFrom,
        attachments: [JSON.stringify({
          isOnlineTest: true,
          duration: duration || 60,
          allowRetake: allowRetake || false,
          showResultsImmediately: showResultsImmediately || true,
          shuffleQuestions: shuffleQuestions || false,
          shuffleOptions: shuffleOptions || false,
          questions: (questions || []).map((q, index) => ({
            id: q.id || `q_${index + 1}`,
            order: index + 1,
            type: q.type || 'objective',
            question: q.question || '',
            marks: q.marks || 1,
            options: q.options || null,
            correctAnswer: q.correctAnswer ?? null,
            explanation: q.explanation || '',
            sampleAnswer: q.sampleAnswer || null
          }))
        })]
      },
      include: {
        subject: true
      }
    });

    console.log('[Update Test] Test updated successfully:', {
      id: updatedTest.id,
      title: updatedTest.title,
      status: updatedTest.status
    });

    // If status changed to published, notify students
    if (validStatus === 'active' && existingTest.status !== 'active' && classes && classes.length > 0) {
      const students = await prisma.user.findMany({
        where: {
          role: 'student',
          schoolId: user.schoolId,
          studentProfile: {
            className: { in: classes }
          }
        },
        select: { id: true }
      });

      if (students.length > 0) {
        await prisma.notification.createMany({
          data: students.map(student => ({
            userId: student.id,
            schoolId: user.schoolId,
            title: `Test Updated: ${title}`,
            content: `${user.firstName} ${user.lastName} has updated the ${validAssignmentType} for ${updatedTest.subject.name}`,
            type: 'info',
            actionUrl: `/protected/students/tests/${updatedTest.id}`,
            actionText: 'View Test'
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test updated successfully',
      test: updatedTest
    });

  } catch (error) {
    console.error('Update test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update test' },
      { status: 500 }
    );
  }
}

// DELETE - Delete test
export async function DELETE(request, { params }) {
  try {
    const user = await requireAuth(['teacher']);
    const testId = params.id;

    // Verify test exists and belongs to teacher
    const existingTest = await prisma.assignment.findUnique({
      where: {
        id: testId,
        schoolId: user.schoolId,
        teacherId: user.id
      },
      include: {
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!existingTest) {
      return NextResponse.json({
        success: false,
        error: 'Test not found or you do not have permission to delete it'
      }, { status: 404 });
    }

    // Check if test has submissions
    if (existingTest._count.submissions > 0) {
      return NextResponse.json({
        success: false,
        error: 'Cannot delete test with existing submissions. Consider closing it instead.'
      }, { status: 400 });
    }

    // Delete the test
    await prisma.assignment.delete({
      where: { id: testId }
    });

    console.log('[Delete Test] Test deleted:', {
      id: testId,
      title: existingTest.title
    });

    return NextResponse.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Delete test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete test' },
      { status: 500 }
    );
  }
}