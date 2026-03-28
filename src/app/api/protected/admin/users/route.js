// src/app/api/protected/admin/users/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await requireAuth(['ADMIN', 'HEADADMIN']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const roleFilter = searchParams.get('role') || 'all';
    const search = searchParams.get('search') || '';
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {};

    // Admins can only see users from their own school
    if (user.role === 'ADMIN') {
      where.schoolId = user.schoolId;
    }

    // Role filter — accepts both lowercase (from frontend tabs) and UPPERCASE
    if (roleFilter && roleFilter !== 'all') {
      where.role = roleFilter.toUpperCase();
    }

    // Search filter
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName:  { contains: search, mode: 'insensitive' } },
        { email:     { contains: search, mode: 'insensitive' } },
        { username:  { contains: search, mode: 'insensitive' } }
      ];
    }

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

    const formattedUsers = users.map(u => ({
      id:              u.id,
      firstName:       u.firstName,
      lastName:        u.lastName,
      email:           u.email,
      username:        u.username,
      role:            u.role,
      isActive:        u.isActive,
      isEmailVerified: u.isEmailVerified,
      lastLogin:       u.lastLogin,
      createdAt:       u.createdAt,
      updatedAt:       u.updatedAt,
      phone:           u.phone,
      dateOfBirth:     u.dateOfBirth,
      address:         u.address,
      gender:          u.gender,
      avatar:          u.avatar,
      school:          u.school,
      studentProfile:  u.studentProfile,
      teacherProfile:  u.teacherProfile,
      adminProfile:    u.adminProfile
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
    const currentUser = await requireAuth(['ADMIN', 'HEADADMIN']);
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
      classTeacherClass,
      classTeacherArm
    } = body;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Normalise role to UPPERCASE to match Prisma enum
    const normalisedRole = role.toUpperCase();
    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
    if (!validRoles.includes(normalisedRole)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // ── Determine target school ───────────────────────────────────────────────
    let targetSchoolId = schoolId;
    if (currentUser.role === 'ADMIN') {
      targetSchoolId = currentUser.schoolId;
    }

    if (!targetSchoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // ── Teacher-specific validation ───────────────────────────────────────────
    if (normalisedRole === 'TEACHER') {
      const validClasses = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

      if (teacherType === 'coordinator') {
        if (!coordinatorClasses.length) {
          return NextResponse.json(
            { error: 'Coordinators must be assigned to at least one class' },
            { status: 400 }
          );
        }
        const normalised = coordinatorClasses.map(c => c.toUpperCase());
        const invalid = normalised.filter(c => !validClasses.includes(c));
        if (invalid.length) {
          return NextResponse.json(
            { error: `Invalid classes: ${invalid.join(', ')}. Valid classes are: ${validClasses.join(', ')}` },
            { status: 400 }
          );
        }
      }

      if (teacherType === 'class_teacher') {
        if (!classTeacherClass || !classTeacherArm) {
          return NextResponse.json(
            { error: 'Class teachers must be assigned to a specific class and arm' },
            { status: 400 }
          );
        }
        if (!validClasses.includes(classTeacherClass.toUpperCase())) {
          return NextResponse.json(
            { error: `Invalid class. Valid classes are: ${validClasses.join(', ')}` },
            { status: 400 }
          );
        }
      }
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
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

    // Hash password outside transaction
    const passwordHash = await bcrypt.hash(password, 12);

    // ── Transaction ───────────────────────────────────────────────────────────
    const newUser = await prisma.$transaction(async (tx) => {
      console.log('Transaction started — creating user:', email);

      const createdUser = await tx.user.create({
        data: {
          firstName:       firstName.trim(),
          lastName:        lastName.trim(),
          email:           email.toLowerCase().trim(),
          username:        username?.toLowerCase().trim() || email.split('@')[0],
          passwordHash,
          role:            normalisedRole,
          phone:           phone   || null,
          dateOfBirth:     dateOfBirth ? new Date(dateOfBirth) : null,
          address:         address || null,
          gender:          gender  || null,
          schoolId:        targetSchoolId,
          isActive:        true,
          isEmailVerified: false
        },
        include: { school: true }
      });

      // ── STUDENT ─────────────────────────────────────────────────────────────
      if (normalisedRole === 'STUDENT') {
        console.log('Creating student profile for:', createdUser.id);
        await tx.studentProfile.create({
          data: {
            userId:        createdUser.id,
            studentId:     `STU${Date.now()}`,
            admissionDate: new Date()
          }
        });
      }

      // ── TEACHER ─────────────────────────────────────────────────────────────
      else if (normalisedRole === 'TEACHER') {
        console.log('Creating teacher profile for:', createdUser.id);
        const teacherProfile = await tx.teacherProfile.create({
          data: {
            userId:     createdUser.id,
            employeeId: `TCH${Date.now()}`,
            joiningDate: new Date(),
            department:  teacherType || 'subject_teacher'
          }
        });

        // Coordinator setup
        if (teacherType === 'coordinator' && coordinatorClasses.length > 0) {
          console.log('Setting up coordinator classes:', coordinatorClasses);
          const uniqueClasses = [...new Set(coordinatorClasses.map(c => c.toUpperCase()))];
          const coordCode = `COORD_${targetSchoolId.slice(-8)}`;

          let coordinationSubject = await tx.subject.findFirst({
            where: { code: coordCode, schoolId: targetSchoolId }
          });

          if (coordinationSubject) {
            const merged = [...new Set([...(coordinationSubject.classLevel || []), ...uniqueClasses])];
            coordinationSubject = await tx.subject.update({
              where: { id: coordinationSubject.id },
              data:  { classLevel: merged }
            });
          } else {
            coordinationSubject = await tx.subject.create({
              data: {
                name:       'Academic Coordination',
                code:       coordCode,
                category:   'CORE',
                classLevel: uniqueClasses,
                schoolId:   targetSchoolId,
                isActive:   true
              }
            });
          }

          await tx.teacherSubject.create({
            data: {
              teacherId: teacherProfile.id,
              subjectId: coordinationSubject.id,
              classes:   uniqueClasses
            }
          });
        }

        // Class teacher setup
        if (teacherType === 'class_teacher' && classTeacherClass && classTeacherArm) {
          console.log('Setting up class teacher assignment:', classTeacherClass, classTeacherArm);
          const normClass = classTeacherClass.toUpperCase();
          const normArm   = classTeacherArm.charAt(0).toUpperCase() + classTeacherArm.slice(1).toLowerCase();
          const fullName  = `${normClass} ${normArm}`;
          const subjectCode = `CLASS_${normClass}_${normArm.toUpperCase()}_${targetSchoolId.slice(-8)}`;

          let subject = await tx.subject.findFirst({
            where: { code: subjectCode, schoolId: targetSchoolId }
          });

          if (!subject) {
            subject = await tx.subject.create({
              data: {
                name:       `${fullName} Class Management`,
                code:       subjectCode,
                category:   'CORE',
                classLevel: [fullName],
                schoolId:   targetSchoolId,
                isActive:   true
              }
            });
          } else {
            const existing = subject.classLevel || [];
            if (!existing.includes(fullName)) {
              subject = await tx.subject.update({
                where: { id: subject.id },
                data:  { classLevel: [...existing, fullName] }
              });
            }
          }

          const existingAssignment = await tx.teacherSubject.findFirst({
            where: { teacherId: teacherProfile.id, subjectId: subject.id }
          });

          if (!existingAssignment) {
            await tx.teacherSubject.create({
              data: {
                teacherId: teacherProfile.id,
                subjectId: subject.id,
                classes:   [fullName]
              }
            });
          }
        }
      }

      // ── ADMIN ────────────────────────────────────────────────────────────────
      else if (normalisedRole === 'ADMIN') {
        console.log('Creating admin profile for:', createdUser.id);
        await tx.adminProfile.create({
          data: {
            userId:     createdUser.id,
            employeeId: `ADM${Date.now()}`
          }
        });
      }

      console.log('Transaction completed for:', createdUser.email);
      return createdUser;

    }, { maxWait: 10000, timeout: 30000 });

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id:        newUser.id,
        firstName: newUser.firstName,
        lastName:  newUser.lastName,
        email:     newUser.email,
        username:  newUser.username,
        role:      newUser.role,
        isActive:  newUser.isActive,
        school:    newUser.school
      }
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.error('Create user error:', {
      message: error.message,
      code:    error.code,
      meta:    error.meta,
      stack:   error.stack
    });

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email or username already exists' },
        { status: 409 }
      );
    }
    if (error.code === 'P2023') {
      return NextResponse.json(
        { error: 'Invalid data format. Please ensure all IDs are valid UUIDs and class names exist.' },
        { status: 400 }
      );
    }
    if (error.code === 'P2028') {
      return NextResponse.json(
        { error: 'Transaction timeout. Please try again.' },
        { status: 408 }
      );
    }
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Required record not found. Please ensure all referenced data exists.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      error:   'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}