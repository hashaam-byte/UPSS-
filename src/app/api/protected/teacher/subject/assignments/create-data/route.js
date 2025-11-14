// app/api/protected/teacher/subject/assignments/create-data/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id }
    });

    if (!teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get teacher's assigned subjects
    const teacherSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacherId: teacherProfile.id
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true,
            classes: true
          }
        }
      }
    });

    // Format subjects with their classes - use same structure as subjects API
    const subjects = teacherSubjects.map(ts => ({
      id: ts.id, // TeacherSubject id
      subjectId: ts.subject.id, // Actual Subject id
      name: ts.subject.name,
      code: ts.subject.code,
      category: ts.subject.category,
      classes: ts.classes, // Classes this teacher teaches for this subject
      isActive: ts.subject.isActive
    }));

    // Get all unique classes from teacher's subjects
    const allClasses = [...new Set(teacherSubjects.flatMap(ts => ts.classes))];

    // Get assignment types enum
    const assignmentTypes = [
      { value: 'homework', label: 'Homework' },
      { value: 'project', label: 'Project' },
      { value: 'quiz', label: 'Quiz' },
      { value: 'exam', label: 'Exam' },
      { value: 'essay', label: 'Essay' },
      { value: 'lab_report', label: 'Lab Report' },
      { value: 'presentation', label: 'Presentation' },
      { value: 'research', label: 'Research' },
      { value: 'classwork', label: 'Classwork' }
    ];

    return NextResponse.json({
      success: true,
      data: {
        subjects,
        classes: allClasses,
        assignmentTypes
      }
    });

  } catch (error) {
    console.error('Fetch create data error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data', details: error.message },
      { status: 500 }
    );
  }
}