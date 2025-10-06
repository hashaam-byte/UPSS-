// app/api/protected/teacher/subject/online-tests/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET - Fetch all tests created by teacher
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
    const status = searchParams.get('status') || 'all';
    const subjectId = searchParams.get('subjectId');

    const where = {
      teacherId: user.id,
      schoolId: user.schoolId,
      assignmentType: { in: ['test', 'exam', 'quiz'] }
    };

    if (status !== 'all') {
      where.status = status;
    }

    if (subjectId) {
      where.subjectId = subjectId;
    }

    const tests = await prisma.assignment.findMany({
      where,
      include: {
        subject: true,
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                studentProfile: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add statistics to each test
    const testsWithStats = tests.map(test => {
      const totalStudents = test.submissions.length > 0 
        ? new Set(test.submissions.map(s => s.studentId)).size
        : 0;

      const gradedSubmissions = test.submissions.filter(s => s.score !== null);
      const averageScore = gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.score / s.maxScore * 100), 0) / gradedSubmissions.length
        : 0;

      return {
        ...test,
        totalSubmissions: test.submissions.length,
        totalStudents,
        gradedCount: gradedSubmissions.length,
        averageScore: Math.round(averageScore)
      };
    });

    return NextResponse.json({
      success: true,
      tests: testsWithStats
    });

  } catch (error) {
    console.error('Fetch tests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch tests' },
      { status: 500 }
    );
  }
}

// POST - Create new test with questions
export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher' || user.department !== 'subject_teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

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

    // Create the assignment/test
    const test = await prisma.assignment.create({
      data: {
        schoolId: user.schoolId,
        subjectId,
        teacherId: user.id,
        title,
        description,
        instructions,
        assignmentType: testType,
        classes,
        maxScore: totalMarks,
        passingScore: passingMarks,
        status: status || 'draft',
        dueDate: scheduledDate ? new Date(scheduledDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        availableFrom: scheduledDate ? new Date(scheduledDate) : new Date(),
        // Store test settings and questions in attachments as JSON
        attachments: [JSON.stringify({
          isOnlineTest: true,
          duration,
          allowRetake,
          showResultsImmediately,
          shuffleQuestions,
          shuffleOptions,
          questions: questions.map((q, index) => ({
            id: q.id,
            order: index + 1,
            type: q.type,
            question: q.question,
            marks: q.marks,
            options: q.options,
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            sampleAnswer: q.sampleAnswer
          }))
        })]
      },
      include: {
        subject: true
      }
    });

    // Create notifications for students in selected classes
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

    if (status === 'published' && students.length > 0) {
      await prisma.notification.createMany({
        data: students.map(student => ({
          userId: student.id,
          schoolId: user.schoolId,
          title: `New ${testType}: ${title}`,
          content: `${user.firstName} ${user.lastName} has published a new ${testType} for ${test.subject.name}`,
          type: 'info',
          actionUrl: `/protected/student/tests/${test.id}`,
          actionText: 'Take Test'
        }))
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Test created successfully',
      test
    });

  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create test' },
      { status: 500 }
    );
  }
}

// PUT - Update test
export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const data = await request.json();
    const { testId, ...updateData } = data;

    const test = await prisma.assignment.update({
      where: {
        id: testId,
        teacherId: user.id
      },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Test updated successfully',
      test
    });

  } catch (error) {
    console.error('Update test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update test' },
      { status: 500 }
    );
  }
}

// DELETE - Delete test
export async function DELETE(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('id');

    await prisma.assignment.delete({
      where: {
        id: testId,
        teacherId: user.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Test deleted successfully'
    });

  } catch (error) {
    console.error('Delete test error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete test' },
      { status: 500 }
    );
  }
}