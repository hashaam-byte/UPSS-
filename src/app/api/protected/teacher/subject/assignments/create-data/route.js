// src/app/api/protected/teacher/subject/assignments/create-data/route.js - FIXED
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getTeacherSubjects, getTeacherClasses } from '@/lib/subject-helpers';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // FIXED: Use helper to get subjects with actual Subject.id
    const subjects = await getTeacherSubjects(user.id, user.schoolId);
    
    // Get all unique classes from teacher's subjects
    const allClasses = await getTeacherClasses(user.id);

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
        subjects, // Now returns actual Subject.id
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