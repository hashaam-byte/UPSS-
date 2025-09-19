import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify director access
async function verifyDirectorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch individual student details
export async function GET(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const director = await verifyDirectorAccess(token);
    const { id: studentId } = params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Get student details - ensure they belong to the same school as director
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: director.schoolId, // Ensure same school
        role: 'student'
      },
      include: {
        studentProfile: true,
        school: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get available classes in the same school
    const availableClasses = await prisma.studentProfile.findMany({
      where: {
        user: {
          schoolId: director.schoolId,
          role: 'student',
          isActive: true
        },
        className: {
          not: null,
          notIn: ['', 'Not assigned']
        }
      },
      select: {
        className: true
      },
      distinct: ['className']
    });

    const classOptions = availableClasses
      .map(profile => profile.className)
      .filter(Boolean)
      .sort();

    // Add common class patterns if none exist
    if (classOptions.length === 0) {
      classOptions.push(
        'JS1 silver', 'JS1 diamond', 'JS1 mercury', 'JS1 platinum', 'JS1 copper','JS1 gold',
        'JS2 silver', 'JS2 diamond', 'JS2 mercury', 'JS2 platinum', 'JS2 copper','JS2 gold',
        'JS3 silver', 'JS3 diamond', 'JS3 mercury', 'JS3 platinum', 'JS3 copper','JS3 gold',
        'SS1 silver', 'SS1 diamond', 'SS1 mercury', 'SS1 platinum', 'SS1 copper','SS1 gold',
        'SS2 silver', 'SS2 diamond', 'SS2 mercury', 'SS2 platinum', 'SS2 copper',
        'SS3 silver', 'SS3 diamond', 'SS3 mercury', 'SS3 platinum', 'SS3 copper'
      );
    }

    // Transform student data
    const studentData = {
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      fullName: `${student.firstName} ${student.lastName}`,
      email: student.email,
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      avatar: student.avatar,
      isActive: student.isActive,
      lastLogin: student.lastLogin,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,

      // Student profile data
      studentId: student.studentProfile?.studentId,
      className: student.studentProfile?.className,
      section: student.studentProfile?.section,
      admissionDate: student.studentProfile?.admissionDate,
      parentName: student.studentProfile?.parentName,
      parentPhone: student.studentProfile?.parentPhone,
      parentEmail: student.studentProfile?.parentEmail,

      // School info
      school: student.school,

      // Derived data
      stage: student.studentProfile?.className?.substring(0, 2), // 'JS' or 'SS'
      level: student.studentProfile?.className?.substring(0, 3), // 'JS1', 'SS2', etc.
      arm: student.studentProfile?.className?.substring(3), // 'A', 'B', etc.
      
      // Status
      hasClassAssignment: Boolean(student.studentProfile?.className && 
                                  student.studentProfile?.className !== '' && 
                                  student.studentProfile?.className !== 'Not assigned'),
      needsClassAssignment: !student.studentProfile?.className || 
                           student.studentProfile?.className === '' || 
                           student.studentProfile?.className === 'Not assigned'
    };

    return NextResponse.json({
      success: true,
      data: {
        student: studentData,
        availableClasses: classOptions,
        schoolInfo: {
          id: director.schoolId,
          name: director.school.name
        }
      }
    });

  } catch (error) {
    console.error('Student GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// PUT - Update student details including class assignment
export async function PUT(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const director = await verifyDirectorAccess(token);
    const { id: studentId } = params;
    const updateData = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Verify student exists and belongs to the same school
    const existingStudent = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: director.schoolId, // Ensure same school
        role: 'student'
      },
      include: {
        studentProfile: true
      }
    });

    if (!existingStudent) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Prepare user update data
    const userUpdateData = {};
    if (updateData.firstName) userUpdateData.firstName = updateData.firstName.trim();
    if (updateData.lastName) userUpdateData.lastName = updateData.lastName.trim();
    if (updateData.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updateData.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }

      // Check for duplicate email in the same school
      const duplicateEmail = await prisma.user.findFirst({
        where: {
          email: updateData.email,
          schoolId: director.schoolId,
          NOT: { id: studentId }
        }
      });

      if (duplicateEmail) {
        return NextResponse.json({ error: 'Email already exists in this school' }, { status: 409 });
      }

      userUpdateData.email = updateData.email.trim().toLowerCase();
    }
    if (updateData.phone) userUpdateData.phone = updateData.phone.trim();
    if (updateData.address) userUpdateData.address = updateData.address.trim();
    if (updateData.dateOfBirth) {
      const dob = new Date(updateData.dateOfBirth);
      if (isNaN(dob.getTime())) {
        return NextResponse.json({ error: 'Invalid date of birth' }, { status: 400 });
      }
      userUpdateData.dateOfBirth = dob;
    }
    if (updateData.gender && ['male', 'female', 'other'].includes(updateData.gender.toLowerCase())) {
      userUpdateData.gender = updateData.gender.toLowerCase();
    }
    if (typeof updateData.isActive === 'boolean') {
      userUpdateData.isActive = updateData.isActive;
    }

    // Prepare student profile update data
    const profileUpdateData = {};
    if (updateData.studentId) profileUpdateData.studentId = updateData.studentId.trim();
    if (updateData.className) profileUpdateData.className = updateData.className.trim();
    if (updateData.section) profileUpdateData.section = updateData.section.trim();
    if (updateData.parentName) profileUpdateData.parentName = updateData.parentName.trim();
    if (updateData.parentPhone) profileUpdateData.parentPhone = updateData.parentPhone.trim();
    if (updateData.parentEmail) profileUpdateData.parentEmail = updateData.parentEmail.trim().toLowerCase();
    if (updateData.admissionDate) {
      const admissionDate = new Date(updateData.admissionDate);
      if (isNaN(admissionDate.getTime())) {
        return NextResponse.json({ error: 'Invalid admission date' }, { status: 400 });
      }
      profileUpdateData.admissionDate = admissionDate;
    }

    // Update user data if there are changes
    let updatedUser = existingStudent;
    if (Object.keys(userUpdateData).length > 0) {
      updatedUser = await prisma.user.update({
        where: { id: studentId },
        data: {
          ...userUpdateData,
          updatedAt: new Date()
        }
      });
    }

    // Update or create student profile if there are changes
    let updatedProfile = existingStudent.studentProfile;
    if (Object.keys(profileUpdateData).length > 0) {
      updatedProfile = await prisma.studentProfile.upsert({
        where: { userId: studentId },
        update: profileUpdateData,
        create: {
          userId: studentId,
          ...profileUpdateData,
          admissionDate: profileUpdateData.admissionDate || new Date()
        }
      });
    }

    // Return updated student data
    const updatedStudentData = {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: `${updatedUser.firstName} ${updatedUser.lastName}`,
      email: updatedUser.email,
      phone: updatedUser.phone,
      address: updatedUser.address,
      dateOfBirth: updatedUser.dateOfBirth,
      gender: updatedUser.gender,
      isActive: updatedUser.isActive,
      updatedAt: updatedUser.updatedAt,

      // Profile data
      studentId: updatedProfile?.studentId,
      className: updatedProfile?.className,
      section: updatedProfile?.section,
      admissionDate: updatedProfile?.admissionDate,
      parentName: updatedProfile?.parentName,
      parentPhone: updatedProfile?.parentPhone,
      parentEmail: updatedProfile?.parentEmail,

      // Status
      hasClassAssignment: Boolean(updatedProfile?.className && 
                                  updatedProfile?.className !== '' && 
                                  updatedProfile?.className !== 'Not assigned')
    };

    return NextResponse.json({
      success: true,
      message: 'Student updated successfully',
      data: {
        student: updatedStudentData
      }
    });

  } catch (error) {
    console.error('Student PUT error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}

// DELETE - Deactivate student (soft delete)
export async function DELETE(request, { params }) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const director = await verifyDirectorAccess(token);
    const { id: studentId } = params;

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    // Verify student exists and belongs to the same school
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: director.schoolId, // Ensure same school
        role: 'student'
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Soft delete - deactivate the student
    await prisma.user.update({
      where: { id: studentId },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Student deactivated successfully'
    });

  } catch (error) {
    console.error('Student DELETE error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}