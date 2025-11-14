// src/app/api/protected/admin/users/route.js - COMBINED VERSION
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') || 'all';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    // For admin users, only show users from their school
    if (user.role === 'admin') {
      where.schoolId = user.schoolId;
    }

    // Filter by role - only if not 'all'
    if (role && role !== 'all') {
      where.role = role;
    }

    // Add search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch users with role-specific profiles
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
      }),
      prisma.user.count({ where })
    ]);

    // Format response with all user details
    const formattedUsers = users.map(user => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      isEmailVerified: user.isEmailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      phone: user.phone,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      gender: user.gender,
      profilePicture: user.profilePicture,
      school: user.school,
      studentProfile: user.studentProfile,
      teacherProfile: user.teacherProfile,
      adminProfile: user.adminProfile
    }));

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    console.error('Get users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const currentUser = await requireAuth(['admin', 'headadmin']);
    const body = await request.json();
    
    const {
      firstName,
      lastName,
      email,
      username,
      password,
      role,
      schoolId,
      phone,
      dateOfBirth,
      address,
      gender,
      teacherType,
      coordinatorClasses = [],
      classTeacherClass,  // Single class level (e.g., "SS1")
      classTeacherArm     // Single arm (e.g., "Silver")
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['student', 'teacher', 'admin'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Determine target school FIRST
    let targetSchoolId = schoolId;
    if (currentUser.role === 'admin') {
      targetSchoolId = currentUser.schoolId;
    }

    if (!targetSchoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
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

    // Check if email or username already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase().trim() },
          { 
            username: username?.toLowerCase().trim(), 
            schoolId: targetSchoolId 
          }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already exists' },
        { status: 409 }
      );
    }

    // Hash password BEFORE transaction
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with transaction
    const newUser = await prisma.$transaction(async (tx) => {
      console.log('Transaction started - Creating user:', email);
      
      // Create base user
      const createdUser = await tx.user.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          username: username?.toLowerCase().trim() || email.split('@')[0],
          passwordHash,
          role,
          phone: phone || null,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          address: address || null,
          gender: gender || null,
          schoolId: targetSchoolId,
          isActive: true,
          isEmailVerified: false
        },
        include: {
          school: true
        }
      });

      // Create role-specific profile
      if (role === 'student') {
        console.log('Creating student profile for:', createdUser.id);
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            studentId: `STU${Date.now()}`,
            admissionDate: new Date()
          }
        });
      } else if (role === 'teacher') {
        console.log('Creating teacher profile for:', createdUser.id);
        const teacherProfile = await tx.teacherProfile.create({
          data: {
            userId: createdUser.id,
            employeeId: `TCH${Date.now()}`,
            joiningDate: new Date(),
            department: teacherType || 'subject_teacher'
          }
        });

        // Handle coordinator classes
        if (teacherType === 'coordinator' && coordinatorClasses.length > 0) {
          console.log('Setting up coordinator classes:', coordinatorClasses);
          // Remove duplicates and normalize to uppercase
          const uniqueClasses = [...new Set(coordinatorClasses.map(c => c.toUpperCase()))];

          // Create unique code with school prefix to avoid conflicts
          const coordCode = `COORD_${targetSchoolId.slice(-8)}`;

          // Try to find existing coordination subject first (by code AND schoolId)
          let coordinationSubject = await tx.subject.findFirst({
            where: { 
              code: coordCode,
              schoolId: targetSchoolId
            }
          });

          if (coordinationSubject) {
            // Update existing subject with merged classes
            const existingClasses = coordinationSubject.classes || [];
            const mergedClasses = [...new Set([...existingClasses, ...uniqueClasses])];
            
            coordinationSubject = await tx.subject.update({
              where: { id: coordinationSubject.id },
              data: { classes: mergedClasses }
            });
          } else {
            // Create new coordination subject with unique code
            coordinationSubject = await tx.subject.create({
              data: {
                name: 'Academic Coordination',
                code: coordCode,
                category: 'CORE',
                classes: uniqueClasses,
                schoolId: targetSchoolId,
                isActive: true
              }
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

        // Handle class teacher assignment (NEW IMPROVED LOGIC)
        if (teacherType === 'class_teacher' && classTeacherClass && classTeacherArm) {
          console.log('Setting up class teacher assignment:', classTeacherClass, classTeacherArm);
          
          const normalizedClass = classTeacherClass.toUpperCase();
          const normalizedArm = classTeacherArm.charAt(0).toUpperCase() + classTeacherArm.slice(1).toLowerCase();
          const fullClassName = `${normalizedClass} ${normalizedArm}`; // e.g., "SS1 Silver"
          
          // Create unique code for this specific class
          const subjectCode = `CLASS_${normalizedClass}_${normalizedArm.toUpperCase()}_${targetSchoolId.slice(-8)}`;
          
          // Try to find existing class management subject
          let subject = await tx.subject.findFirst({
            where: {
              code: subjectCode,
              schoolId: targetSchoolId
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
                schoolId: targetSchoolId,
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

          // Check if teacher-subject assignment already exists
          const existingAssignment = await tx.teacherSubject.findFirst({
            where: {
              teacherId: teacherProfile.id,
              subjectId: subject.id
            }
          });

          if (!existingAssignment) {
            // Create teacher-subject assignment
            await tx.teacherSubject.create({
              data: {
                teacherId: teacherProfile.id,
                subjectId: subject.id,
                classes: [fullClassName]
              }
            });
          }
        }
      } else if (role === 'admin') {
        console.log('Creating admin profile for:', createdUser.id);
        await tx.adminProfile.create({
          data: {
            userId: createdUser.id,
            employeeId: `ADM${Date.now()}`
          }
        });
      }

      console.log('Transaction completed successfully for:', createdUser.email);
      return createdUser;
    }, {
      maxWait: 10000,
      timeout: 30000,
    });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        isActive: newUser.isActive,
        school: newUser.school
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    // Log detailed error for debugging
    console.error('Create user error:', {
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
    
    if (error.code === 'P2023') {
      return NextResponse.json({ 
        error: 'Invalid data format. Please ensure all IDs are valid UUIDs and class names exist.' 
      }, { status: 400 });
    }
    
    if (error.code === 'P2028') {
      return NextResponse.json({ 
        error: 'Transaction timeout. Please try again.' 
      }, { status: 408 });
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json({ 
        error: 'Required record not found. Please ensure all referenced data exists.' 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}