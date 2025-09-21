
// /app/api/protected/admin/users/route.js - UPDATED to support coordinator classes
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    // For admin users, only show users from their school
    if (user.role === 'admin') {
      where.schoolId = user.school.id;
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.user.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      users: users.map(user => ({
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
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        gender: user.gender,
        school: user.school,
        studentProfile: user.studentProfile,
        teacherProfile: user.teacherProfile,
        adminProfile: user.adminProfile
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
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

    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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
      teacherType, 
      coordinatorClasses = [],
      phone,
      dateOfBirth,
      address,
      gender
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate coordinator classes if it's a coordinator
    if (role === 'teacher' && teacherType === 'coordinator' && coordinatorClasses.length === 0) {
      return NextResponse.json(
        { error: 'Coordinators must be assigned to at least one class' },
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

    // For admin users, they can only create users in their school
    let targetSchoolId = schoolId;
    if (currentUser.role === 'admin') {
      targetSchoolId = currentUser.school.id;
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username?.toLowerCase(), schoolId: targetSchoolId }
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

    // Create user
    const newUser = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        username: username?.toLowerCase().trim(),
        passwordHash: passwordHash,
        role: role,
        schoolId: targetSchoolId,
        phone: phone || null,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        address: address || null,
        gender: gender || null,
        isActive: true,
        isEmailVerified: false
      },
      include: {
        school: true
      }
    });

    // Create role-specific profile
    if (role === 'student') {
      await prisma.studentProfile.create({
        data: {
          userId: newUser.id,
          studentId: `STU${Date.now()}`,
          admissionDate: new Date()
        }
      });
    } else if (role === 'teacher') {
      const teacherProfile = await prisma.teacherProfile.create({
        data: {
          userId: newUser.id,
          employeeId: `TCH${Date.now()}`,
          joiningDate: new Date(),
          department: teacherType || 'subject_teacher'
        }
      });

      // If coordinator, create subject assignments for the classes
      if (teacherType === 'coordinator' && coordinatorClasses.length > 0) {
        // Get or create coordination subject
        let coordinationSubject = await prisma.subject.findFirst({
          where: {
            schoolId: targetSchoolId,
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
              schoolId: targetSchoolId
            }
          });
        } else {
          // Update existing subject to include new classes
          const updatedClasses = [...new Set([...coordinationSubject.classes, ...coordinatorClasses])];
          coordinationSubject = await prisma.subject.update({
            where: { id: coordinationSubject.id },
            data: { classes: updatedClasses }
          });
        }

        // Create teacher-subject assignment
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacherProfile.id,
            subjectId: coordinationSubject.id,
            classes: coordinatorClasses
          }
        });
      }
    } else if (role === 'admin') {
      await prisma.adminProfile.create({
        data: {
          userId: newUser.id,
          employeeId: `ADM${Date.now()}`
        }
      });
    }

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

    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}
