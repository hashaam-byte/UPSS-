// ===================================================================
// FILE: src/app/api/protected/teacher/subject/online-tests/create/route.js
// ===================================================================
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // Get teacher's subjects and classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        teacherSubjects: {
          include: {
            subject: true
          }
        }
      }
    });

    const subjects = teacherProfile?.teacherSubjects || [];
    const classes = [...new Set(subjects.flatMap(ts => ts.classes))];

    return NextResponse.json({
      success: true,
      subjects,
      classes
    });
  } catch (error) {
    console.error('Fetch create test data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['teacher']);
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
      status,
    } = data;

    // Map testType and status to valid enum values
    const validAssignmentType = testType === 'test' ? 'quiz' : testType; // Adjust mapping as needed
    const validStatus = status === 'published' ? 'active' : status; // Map "published" to "active"

    // Create the assignment/test
    const test = await prisma.assignment.create({
      data: {
        schoolId: user.schoolId,
        subjectId,
        teacherId: user.id,
        title,
        description: description || '',
        instructions: instructions || '',
        assignmentType: validAssignmentType,
        classes: classes || [],
        maxScore: totalMarks || 100,
        passingScore: passingMarks || 60,
        status: validStatus, // Use the mapped value
        dueDate: new Date(scheduledDate),
        availableFrom: new Date(),
        // Store test settings and questions in attachments as JSON
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

    // Create notifications for students in selected classes
    if (status === 'published' && classes && classes.length > 0) {
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
            title: `New ${testType}: ${title}`,
            content: `${user.firstName} ${user.lastName} has published a new ${testType} for ${test.subject.name}`,
            type: 'info',
            actionUrl: `/protected/students/tests/${test.id}`,
            actionText: 'Take Test'
          }))
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Test created successfully',
      test
    });
  } catch (error) {
    console.error('Create test error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create test' },
      { status: 500 }
    );
  }
}