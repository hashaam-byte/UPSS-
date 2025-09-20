import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  try {
    // Verify authentication and admin role
    const user = await requireAuth(['admin', 'headadmin']);

    if (user.role !== 'admin' && user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // For non-head admins, ensure they can only access users from their school
    const whereClause = {
      id: userId,
      ...(user.role !== 'headadmin' && { schoolId: user.school.id })
    };

    const targetUser = await prisma.user.findFirst({
      where: whereClause,
      include: {
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
        adminProfile: true
      }
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Format the response to include teacher-specific data in a flattened structure
    const responseUser = {
      ...targetUser,
      teacherProfile: targetUser.teacherProfile ? {
        ...targetUser.teacherProfile,
        teacherType: getTeacherType(targetUser.teacherProfile),
        directorClasses: getDirectorClasses(targetUser.teacherProfile),
        teacherSubjects: targetUser.teacherProfile.teacherSubjects?.map(ts => ({
          id: ts.id,
          subjectId: ts.subjectId,
          subjectName: ts.subject.name,
          subjectCode: ts.subject.code,
          classes: ts.classes
        })) || []
      } : null
    };

    return NextResponse.json({
      success: true,
      user: responseUser
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    // Verify authentication and admin role
    const user = await requireAuth(['admin', 'headadmin']);

    if (user.role !== 'admin' && user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const userId = params.id;
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
      teacherType,
      coordinatorClass,
      directorClasses,
      teacherSubjects
    } = body;

    // For non-head admins, ensure they can only update users from their school
    const whereClause = {
      id: userId,
      ...(user.role !== 'headadmin' && { schoolId: user.school.id })
    };

    const existingUser = await prisma.user.findFirst({
      where: whereClause,
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

    // Check for duplicate email (excluding current user)
    if (email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: email,
          id: { not: userId },
          schoolId: existingUser.schoolId
        }
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Email already exists for another user' },
          { status: 400 }
        );
      }
    }

    // Check for duplicate username (excluding current user)
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findFirst({
        where: {
          username: username,
          id: { not: userId },
          schoolId: existingUser.schoolId
        }
      });

      if (usernameExists) {
        return NextResponse.json(
          { error: 'Username already exists for another user' },
          { status: 400 }
        );
      }
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update basic user information
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          email,
          username: username || null,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          gender: gender || null,
          isActive
        }
      });

      // Handle teacher profile updates
      if (existingUser.role === 'teacher' && teacherType) {
        // Get or create teacher profile
        let teacherProfile = existingUser.teacherProfile;
        
        if (!teacherProfile) {
          teacherProfile = await tx.teacherProfile.create({
            data: {
              userId: userId
            }
          });
        }

        // Update teacher profile based on type
        if (teacherType === 'coordinator') {
          await tx.teacherProfile.update({
            where: { id: teacherProfile.id },
            data: {
              coordinatorClass: coordinatorClass || null
            }
          });
        } else if (teacherType === 'director' && Array.isArray(directorClasses)) {
          // Store director classes as JSON string in coordinatorClass field
          await tx.teacherProfile.update({
            where: { id: teacherProfile.id },
            data: {
              coordinatorClass: JSON.stringify(directorClasses)
            }
          });
        } else {
          // Clear coordinatorClass for other teacher types
          await tx.teacherProfile.update({
            where: { id: teacherProfile.id },
            data: {
              coordinatorClass: null
            }
          });
        }

        // Handle teacher subjects for subject teachers
        if (teacherType === 'subject_teacher' && Array.isArray(teacherSubjects)) {
          // Delete existing teacher subjects
          await tx.teacherSubject.deleteMany({
            where: { teacherId: teacherProfile.id }
          });

          // Create new teacher subjects
          const teacherSubjectData = teacherSubjects
            .filter(ts => ts.subjectId && ts.classes && ts.classes.length > 0)
            .map(ts => ({
              teacherId: teacherProfile.id,
              subjectId: ts.subjectId,
              classes: ts.classes
            }));

          if (teacherSubjectData.length > 0) {
            await tx.teacherSubject.createMany({
              data: teacherSubjectData
            });
          }
        } else {
          // Clear teacher subjects for non-subject teachers
          await tx.teacherSubject.deleteMany({
            where: { teacherId: teacherProfile.id }
          });
        }
      }

      return updatedUser;
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: result
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    // Verify authentication and admin role
    const user = await requireAuth(['admin', 'headadmin']);

    if (user.role !== 'admin' && user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    const userId = params.id;

    // For non-head admins, ensure they can only delete users from their school
    const whereClause = {
      id: userId,
      ...(user.role !== 'headadmin' && { schoolId: user.school.id })
    };

    const existingUser = await prisma.user.findFirst({
      where: whereClause
    });

    if (!existingUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent deletion of the last admin in a school (for non-head admins)
    if (existingUser.role === 'admin' && user.role !== 'headadmin') {
      const adminCount = await prisma.user.count({
        where: {
          schoolId: existingUser.schoolId,
          role: 'admin',
          isActive: true
        }
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last admin in the school' },
          { status: 400 }
        );
      }
    }

    // Delete the user (cascading deletes will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function getTeacherType(teacherProfile) {
  if (teacherProfile.coordinatorClass) {
    try {
      // Check if coordinatorClass contains JSON (director classes)
      const parsed = JSON.parse(teacherProfile.coordinatorClass);
      if (Array.isArray(parsed)) {
        return 'director';
      }
    } catch (e) {
      // If parsing fails, it's a single class (coordinator)
      return 'coordinator';
    }
    return 'coordinator';
  }
  
  // Check if has teacher subjects
  if (teacherProfile.teacherSubjects && teacherProfile.teacherSubjects.length > 0) {
    return 'subject_teacher';
  }
  
  return 'class_teacher'; // default
}

function getDirectorClasses(teacherProfile) {
  if (teacherProfile.coordinatorClass) {
    try {
      const parsed = JSON.parse(teacherProfile.coordinatorClass);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // Not JSON, return empty array
    }
  }
  return [];
}

export { GET, PUT, DELETE };

// Optional: handle unsupported methods with a 405 response
export function handler(request) {
  return new Response('Method Not Allowed', { status: 405 });
}