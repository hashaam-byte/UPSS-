// src/app/api/protected/teacher/subject/online-tests/create/route.js - FIXED
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { 
  getTeacherSubjects, 
  getTeacherClasses, 
  validateTeacherSubjectAccess,
  mapTestTypeToAssignmentType,
  mapStatusToAssignmentStatus 
} from '@/lib/subject-helpers';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    // FIXED: Use helper to get subjects with actual Subject.id
    const subjects = await getTeacherSubjects(user.id, user.schoolId);
    const classes = await getTeacherClasses(user.id);

    return NextResponse.json({
      success: true,
      subjects, // Returns actual Subject.id
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
      subjectId, // NOW EXPECTS ACTUAL Subject.id
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

    // FIXED: Validate teacher has access to subject
    try {
      await validateTeacherSubjectAccess(user.id, subjectId);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 403 });
    }

    // FIXED: Use standardized mapping functions
    const validAssignmentType = mapTestTypeToAssignmentType(testType);
    const validStatus = mapStatusToAssignmentStatus(status);

    console.log('[Create Test] Mapped types:', {
      testType,
      validAssignmentType,
      status,
      validStatus
    });

    // Create the assignment/test
    const test = await prisma.assignment.create({
      data: {
        schoolId: user.schoolId,
        subjectId, // Actual Subject.id
        teacherId: user.id,
        title,
        description: description || '',
        instructions: instructions || '',
        assignmentType: validAssignmentType, // FIXED: Consistent mapping
        classes: classes || [],
        maxScore: totalMarks || 100,
        passingScore: passingMarks || 60,
        status: validStatus, // FIXED: Consistent mapping
        dueDate: new Date(scheduledDate),
        availableFrom: new Date(),
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
    if (validStatus === 'active' && classes && classes.length > 0) {
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

    console.log('[Create Test] Test created successfully:', {
      id: test.id,
      title: test.title,
      assignmentType: test.assignmentType,
      status: test.status
    });

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