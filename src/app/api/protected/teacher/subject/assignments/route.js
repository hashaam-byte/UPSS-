// src/app/api/protected/teacher/subject/assignments/route.js - FIXED
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { validateTeacherSubjectAccess } from '@/lib/subject-helpers';

export async function GET(request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filterSubjectId = searchParams.get('subjectId'); // NOW EXPECTS ACTUAL Subject.id
    const status = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const search = searchParams.get('search');

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { 
        role: true,
        schoolId: true,
        teacherProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || user.role !== 'teacher' || !user.teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can access assignments' },
        { status: 403 }
      );
    }

    // Build where clause
    const where = {
      teacherId: currentUser.id,
      schoolId: user.schoolId
    };

    // FIXED: Now directly uses Subject.id (no conversion needed)
    if (filterSubjectId && filterSubjectId !== 'all') {
      where.subjectId = filterSubjectId;
    }

    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Define orderBy
    let orderBy;
    switch (sortBy) {
      case 'title':
        orderBy = { title: 'asc' };
        break;
      case 'createdAt':
        orderBy = { createdAt: 'desc' };
        break;
      case 'dueDate':
      default:
        orderBy = { dueDate: 'asc' };
        break;
    }

    // Fetch assignments with related data
    const assignments = await prisma.assignment.findMany({
      where,
      orderBy,
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    // For each assignment, calculate total students based on classes
    const assignmentsWithStats = await Promise.all(
      assignments.map(async (assignment) => {
        // Count students in the classes this assignment is for
        let totalStudents = 0;
        
        if (assignment.classes && assignment.classes.length > 0) {
          totalStudents = await prisma.user.count({
            where: {
              role: 'student',
              schoolId: user.schoolId,
              studentProfile: {
                className: {
                  in: assignment.classes
                }
              }
            }
          });
        }

        return {
          ...assignment,
          _count: {
            ...assignment._count,
            totalStudents
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      data: {
        assignments: assignmentsWithStats
      }
    });

  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assignments',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { 
        role: true,
        schoolId: true,
        teacherProfile: {
          select: { id: true }
        }
      }
    });

    if (!user || user.role !== 'teacher' || !user.teacherProfile) {
      return NextResponse.json(
        { success: false, error: 'Only teachers can create assignments' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      subjectId, // NOW EXPECTS ACTUAL Subject.id
      title,
      description,
      instructions,
      assignmentType,
      dueDate,
      availableFrom,
      maxScore,
      passingScore,
      classes,
      status,
      allowLateSubmission,
      lateSubmissionPenalty,
      attachments
    } = body;

    // Validate required fields
    if (!subjectId || !title || !dueDate || !classes || classes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // FIXED: Verify teacher teaches this subject using actual Subject.id
    try {
      await validateTeacherSubjectAccess(currentUser.id, subjectId);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 403 }
      );
    }

    // Create assignment
    const assignment = await prisma.assignment.create({
      data: {
        schoolId: user.schoolId,
        subjectId, // Actual Subject.id
        teacherId: currentUser.id,
        title,
        description,
        instructions,
        assignmentType: assignmentType || 'homework',
        dueDate: new Date(dueDate),
        availableFrom: availableFrom ? new Date(availableFrom) : null,
        maxScore: maxScore || 100,
        passingScore,
        classes,
        status: status || 'draft',
        allowLateSubmission: allowLateSubmission || false,
        lateSubmissionPenalty,
        attachments: attachments || []
      },
      include: {
        subject: {
          select: {
            name: true,
            code: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: { assignment }
    });

  } catch (error) {
    console.error('Create assignment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create assignment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}