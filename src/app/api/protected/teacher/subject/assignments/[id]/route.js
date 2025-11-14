// app/api/protected/teacher/subject/assignments/[id]/route.js
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Fetch assignment with all details
    const assignment = await prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            category: true
          }
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        submissions: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                studentProfile: {
                  select: {
                    studentId: true,
                    className: true
                  }
                }
              }
            }
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!assignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    // Verify user is the teacher who created this assignment
    if (assignment.teacherId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to view this assignment' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { assignment }
    });

  } catch (error) {
    console.error('Get assignment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch assignment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Verify assignment exists and user owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { 
        teacherId: true,
        status: true
      }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.teacherId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to update this assignment' },
        { status: 403 }
      );
    }

    // Build update data
    const updateData = {};
    
    // Fields that can be updated
    const allowedFields = [
      'title',
      'description',
      'instructions',
      'assignmentType',
      'dueDate',
      'availableFrom',
      'closedAt',
      'maxScore',
      'passingScore',
      'classes',
      'status',
      'allowLateSubmission',
      'lateSubmissionPenalty',
      'attachments'
    ];

    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        if (field === 'dueDate' || field === 'availableFrom' || field === 'closedAt') {
          updateData[field] = body[field] ? new Date(body[field]) : null;
        } else {
          updateData[field] = body[field];
        }
      }
    });

    // Update assignment
    const updatedAssignment = await prisma.assignment.update({
      where: { id },
      data: updateData,
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
      data: { assignment: updatedAssignment }
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update assignment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verify assignment exists and user owns it
    const existingAssignment = await prisma.assignment.findUnique({
      where: { id },
      select: { 
        teacherId: true,
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Assignment not found' },
        { status: 404 }
      );
    }

    if (existingAssignment.teacherId !== currentUser.id) {
      return NextResponse.json(
        { success: false, error: 'You do not have permission to delete this assignment' },
        { status: 403 }
      );
    }

    // Check if there are submissions
    if (existingAssignment._count.submissions > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete assignment with existing submissions. Consider closing it instead.' 
        },
        { status: 400 }
      );
    }

    // Delete assignment
    await prisma.assignment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully'
    });

  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to delete assignment',
        details: error.message 
      },
      { status: 500 }
    );
  }
}