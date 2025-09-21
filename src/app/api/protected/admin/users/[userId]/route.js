// /app/api/protected/admin/users/[userId]/route.js - UPDATED
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request, { params }) {
  try {
    const currentUser = await requireAuth(['admin', 'headadmin']);
    const { userId } = params;

    // Build where clause for access control
    const where = { id: userId };
    if (currentUser.role === 'admin') {
      where.schoolId = currentUser.school.id;
    }

    const user = await prisma.user.findFirst({
      where,
      include: {
        school: true,
        studentProfile: true,
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        },
        adminProfile: {
          include: {
            permissions: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Get individual user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const currentUser = await requireAuth(['admin', 'headadmin']);
    const { userId } = params;
    const body = await request.json();

    const {
      firstName,
      lastName,
      email,
      username,
      phone,
      dateOfBirth,
      address,
      gender,
      isActive,
      role,
      teacherType,
      coordinatorClasses = []
    } = body;

    // Verify user exists and admin has access
    const where = { id: userId };
    if (currentUser.role === 'admin') {
      where.schoolId = currentUser.school.id;
    }

    const existingUser = await prisma.user.findFirst({
      where,
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: true
          }
        }
      }
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate coordinator classes if it's a coordinator
    if (role === 'teacher' && teacherType === 'coordinator' && coordinatorClasses.length === 0) {
      return NextResponse.json(
        { error: 'Coordinators must be assigned to at least one class' },
        { status: 400 }
      );
    }

    // Check email conflicts
    if (email && email !== existingUser.email) {
      const emailConflict = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          schoolId: currentUser.role === 'admin' ? currentUser.school.id : existingUser.schoolId,
          NOT: { id: userId }
        }
      });

      if (emailConflict) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName: firstName || existingUser.firstName,
        lastName: lastName || existingUser.lastName,
        email: email ? email.toLowerCase() : existingUser.email,
        username: username ? username.toLowerCase() : existingUser.username,
        phone: phone !== undefined ? phone : existingUser.phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth,
        address: address !== undefined ? address : existingUser.address,
        gender: gender !== undefined ? gender : existingUser.gender,
        isActive: isActive !== undefined ? isActive : existingUser.isActive,
        role: role || existingUser.role
      }
    });

    // Handle role-specific profile updates
    if (role === 'student' && !existingUser.studentProfile) {
      await prisma.studentProfile.create({
        data: {
          userId: userId,
          studentId: `STU${Date.now()}`,
          admissionDate: new Date()
        }
      });
    } else if (role === 'admin' && !existingUser.adminProfile) {
      await prisma.adminProfile.create({
        data: {
          userId: userId,
          employeeId: `ADM${Date.now()}`
        }
      });
    }

    // Handle teacher profile updates
    if (role === 'teacher' || existingUser.role === 'teacher') {
      const teacherProfile = await prisma.teacherProfile.upsert({
        where: { userId: userId },
        update: {
          department: teacherType || 'subject_teacher'
        },
        create: {
          userId: userId,
          employeeId: `TCH${Date.now()}`,
          department: teacherType || 'subject_teacher',
          joiningDate: new Date()
        }
      });

      // Handle coordinator class assignments
      if (teacherType === 'coordinator' && coordinatorClasses.length > 0) {
        // Remove existing coordinator assignments
        await prisma.teacherSubject.deleteMany({
          where: { teacherId: teacherProfile.id }
        });

        // Get or create coordination subject
        let coordinationSubject = await prisma.subject.findFirst({
          where: {
            schoolId: currentUser.role === 'admin' ? currentUser.school.id : existingUser.schoolId,
            code: 'COORD',
            name: 'Academic Coordination'
          }
        });

        if (!coordinationSubject) {
          coordinationSubject = await prisma.subject.create({
            data: {
              name: 'Academic Coordination',
              code: 'COORD',
              category: 'CORE',
              classes: coordinatorClasses,
              schoolId: currentUser.role === 'admin' ? currentUser.school.id : existingUser.schoolId
            }
          });
        } else {
          // Update subject classes to include all coordinator classes
          const allClasses = [...new Set([...coordinationSubject.classes, ...coordinatorClasses])];
          await prisma.subject.update({
            where: { id: coordinationSubject.id },
            data: { classes: allClasses }
          });
        }

        // Create new assignment
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacherProfile.id,
            subjectId: coordinationSubject.id,
            classes: coordinatorClasses
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await requireAuth(['admin']);
    const { userId } = params;

    // Check if the user exists and belongs to the same school
    const targetUser = await prisma.user.findFirst({
      where: {
        id: userId,
        schoolId: currentUser.school.id
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deleting themselves
    if (targetUser.id === currentUser.id) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}
