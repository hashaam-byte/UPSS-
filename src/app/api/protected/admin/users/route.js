// src/app/api/protected/admin/users/route.js - COMPLETE COMBINED VERSION
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
    // headadmin can see all schools or filter by specific school if needed

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
      classTeacherArms = []
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

    // Validate coordinator/class teacher requirements
    if (role === 'teacher') {
      if (teacherType === 'coordinator' && coordinatorClasses.length === 0) {
        return NextResponse.json(
          { error: 'Coordinators must be assigned to at least one class' },
          { status: 400 }
        );
      }
      if (teacherType === 'class_teacher' && classTeacherArms.length === 0) {
        return NextResponse.json(
          { error: 'Class teachers must be assigned to at least one class arm' },
          { status: 400 }
        );
      }
    }

    // Determine target school
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

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with transaction
    const newUser = await prisma.$transaction(async (tx) => {
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
        await tx.studentProfile.create({
          data: {
            userId: createdUser.id,
            studentId: `STU${Date.now()}`,
            admissionDate: new Date()
          }
        });
      } else if (role === 'teacher') {
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
          // Get or create coordination subject
          let coordinationSubject = await tx.subject.findFirst({
            where: {
              schoolId: targetSchoolId,
              code: 'COORD',
              name: 'Academic Coordination'
            }
          });

          if (!coordinationSubject) {
            coordinationSubject = await tx.subject.create({
              data: {
                name: 'Academic Coordination',
                code: 'COORD',
                category: 'CORE',
                classes: coordinatorClasses,
                schoolId: targetSchoolId,
                isActive: true
              }
            });
          } else {
            // Update to include new classes
            const updatedClasses = [...new Set([...coordinationSubject.classes, ...coordinatorClasses])];
            coordinationSubject = await tx.subject.update({
              where: { id: coordinationSubject.id },
              data: { classes: updatedClasses }
            });
          }

          // Create teacher-subject assignment
          await tx.teacherSubject.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: coordinationSubject.id,
              classes: coordinatorClasses
            }
          });
        }

        // Handle class teacher arms
        if (teacherType === 'class_teacher' && classTeacherArms.length > 0) {
          for (const arm of classTeacherArms) {
            // Find or create class management subject
            let subject = await tx.subject.findFirst({
              where: {
                schoolId: targetSchoolId,
                name: `${arm} Class Management`,
                category: 'CORE'
              }
            });

            if (!subject) {
              subject = await tx.subject.create({
                data: {
                  name: `${arm} Class Management`,
                  code: `CLASS_${arm.replace(/\s+/g, '_')}`,
                  category: 'CORE',
                  classes: [arm],
                  schoolId: targetSchoolId,
                  isActive: true
                }
              });
            }

            // Create teacher-subject assignment
            await tx.teacherSubject.create({
              data: {
                teacherId: teacherProfile.id,
                subjectId: subject.id,
                classes: [arm]
              }
            });
          }
        }
      } else if (role === 'admin') {
        await tx.adminProfile.create({
          data: {
            userId: createdUser.id,
            employeeId: `ADM${Date.now()}`
          }
        });
      }

      return createdUser;
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
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}