// src/app/api/protected/admin/users/[userId]/route.js - COMBINED VERSION
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
      coordinatorClasses = [],
      classTeacherClass,  // Single class level (e.g., "SS1")
      classTeacherArm     // Single arm (e.g., "Silver")
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
            teacherSubjects: {
              include: {
                subject: true
              }
            }
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

    // Validate teacher-specific requirements
    if (role === 'teacher') {
      const validClasses = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
      
      // Validate coordinator requirements
      if (teacherType === 'coordinator') {
        if (coordinatorClasses.length === 0) {
          return NextResponse.json(
            { error: 'Coordinators must be assigned to at least one class' },
            { status: 400 }
          );
        }
        
        // Validate coordinator classes are valid
        const normalizedClasses = coordinatorClasses.map(c => c.toUpperCase());
        const invalidClasses = normalizedClasses.filter(cn => !validClasses.includes(cn));
        
        if (invalidClasses.length > 0) {
          return NextResponse.json(
            { error: `Invalid classes: ${invalidClasses.join(', ')}. Valid classes are: ${validClasses.join(', ')}` },
            { status: 400 }
          );
        }
      }
      
      // Validate class teacher requirements
      if (teacherType === 'class_teacher') {
        if (!classTeacherClass || !classTeacherArm) {
          return NextResponse.json(
            { error: 'Class teachers must be assigned to a specific class and arm' },
            { status: 400 }
          );
        }
        
        // Validate class level
        if (!validClasses.includes(classTeacherClass.toUpperCase())) {
          return NextResponse.json(
            { error: `Invalid class. Valid classes are: ${validClasses.join(', ')}` },
            { status: 400 }
          );
        }
      }
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

    // Check username conflicts (scoped to school)
    if (username && username !== existingUser.username) {
      const usernameConflict = await prisma.user.findFirst({
        where: {
          username: username.toLowerCase(),
          schoolId: currentUser.role === 'admin' ? currentUser.school.id : existingUser.schoolId,
          NOT: { id: userId }
        }
      });

      if (usernameConflict) {
        return NextResponse.json(
          { error: 'Username already exists in this school' },
          { status: 409 }
        );
      }
    }

    // Update user in transaction
    const updatedUser = await prisma.$transaction(async (tx) => {
      console.log('Transaction started - Updating user:', userId);
      
      // Update base user
      const user = await tx.user.update({
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
        console.log('Creating student profile for updated user:', userId);
        await tx.studentProfile.create({
          data: {
            userId: userId,
            studentId: `STU${Date.now()}`,
            admissionDate: new Date()
          }
        });
      } else if (role === 'admin' && !existingUser.adminProfile) {
        console.log('Creating admin profile for updated user:', userId);
        await tx.adminProfile.create({
          data: {
            userId: userId,
            employeeId: `ADM${Date.now()}`
          }
        });
      }

      // Handle teacher profile updates
      if (role === 'teacher' || existingUser.role === 'teacher') {
        console.log('Handling teacher profile updates for:', userId);
        
        const teacherProfile = await tx.teacherProfile.upsert({
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

        // Remove existing assignments (to avoid duplicates)
        console.log('Removing existing teacher-subject assignments');
        await tx.teacherSubject.deleteMany({
          where: { teacherId: teacherProfile.id }
        });

        const schoolId = currentUser.role === 'admin' ? currentUser.school.id : existingUser.schoolId;

        // Handle coordinator class assignments
        if (teacherType === 'coordinator' && coordinatorClasses.length > 0) {
          console.log('Setting up coordinator classes:', coordinatorClasses);
          
          // Remove duplicates and normalize to uppercase
          const uniqueClasses = [...new Set(coordinatorClasses.map(c => c.toUpperCase()))];
          const coordCode = `COORD_${schoolId.slice(-8)}`;

          // Try to find existing coordination subject
          let coordinationSubject = await tx.subject.findFirst({
            where: {
              code: coordCode,
              schoolId: schoolId
            }
          });

          if (!coordinationSubject) {
            // Create new coordination subject
            coordinationSubject = await tx.subject.create({
              data: {
                name: 'Academic Coordination',
                code: coordCode,
                category: 'CORE',
                classes: uniqueClasses,
                schoolId: schoolId,
                isActive: true
              }
            });
          } else {
            // Update existing subject with merged classes
            const existingClasses = coordinationSubject.classes || [];
            const mergedClasses = [...new Set([...existingClasses, ...uniqueClasses])];
            
            await tx.subject.update({
              where: { id: coordinationSubject.id },
              data: { classes: mergedClasses }
            });
          }

          // Create teacher-subject assignment
          await tx.teacherSubject.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: coordinationSubject.id,
              classes: uniqueClasses
            }
          });
        }

        // Handle class teacher assignment (IMPROVED LOGIC)
        if (teacherType === 'class_teacher' && classTeacherClass && classTeacherArm) {
          console.log('Setting up class teacher assignment:', classTeacherClass, classTeacherArm);
          
          const normalizedClass = classTeacherClass.toUpperCase();
          const normalizedArm = classTeacherArm.charAt(0).toUpperCase() + classTeacherArm.slice(1).toLowerCase();
          const fullClassName = `${normalizedClass} ${normalizedArm}`; // e.g., "SS1 Silver"
          
          // Create unique code for this specific class
          const subjectCode = `CLASS_${normalizedClass}_${normalizedArm.toUpperCase()}_${schoolId.slice(-8)}`;
          
          // Try to find existing class management subject
          let subject = await tx.subject.findFirst({
            where: {
              code: subjectCode,
              schoolId: schoolId
            }
          });

          if (!subject) {
            // Create new subject
            subject = await tx.subject.create({
              data: {
                name: `${fullClassName} Class Management`,
                code: subjectCode,
                category: 'CORE',
                classes: [fullClassName],
                schoolId: schoolId,
                isActive: true
              }
            });
          } else {
            // Update existing subject to include this class if not already included
            const existingClasses = subject.classes || [];
            if (!existingClasses.includes(fullClassName)) {
              subject = await tx.subject.update({
                where: { id: subject.id },
                data: { 
                  classes: [...existingClasses, fullClassName]
                }
              });
            }
          }

          // Create teacher-subject assignment (already deleted old ones above)
          await tx.teacherSubject.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: subject.id,
              classes: [fullClassName]
            }
          });
        }
      }

      console.log('Transaction completed successfully for:', userId);
      return user;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

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

    // Log detailed error for debugging
    console.error('Update user error:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });

    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return NextResponse.json({ 
        error: 'A user with this email or username already exists' 
      }, { status: 409 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'User or related record not found' 
      }, { status: 404 });
    }
    
    if (error.code === 'P2028') {
      return NextResponse.json({ 
        error: 'Transaction timeout. Please try again.' 
      }, { status: 408 });
    }

    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const currentUser = await requireAuth(['admin', 'headadmin']);
    const { userId } = params;

    // Build where clause for access control
    const where = { id: userId };
    if (currentUser.role === 'admin') {
      where.schoolId = currentUser.school.id;
    }

    // Check if the user exists and admin has access
    const targetUser = await prisma.user.findFirst({
      where
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
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to delete user',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}