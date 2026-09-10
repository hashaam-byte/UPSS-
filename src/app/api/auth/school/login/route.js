// /app/api/auth/school/login/route.js - Updated for Teacher Subdivisions
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request) {
  try {
    const body = await request.json();
    const { identifier, password, role, schoolSlug, rememberMe } = body;

    // Rate limit by IP (stops spraying many usernames from one source) AND
    // by identifier (stops targeting one account from many IPs) — both
    // limits apply independently.
    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(`login:ip:${ip}`, 20, 15 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many login attempts from this location. Please try again in 15 minutes.' }, { status: 429 });
    }
    if (identifier) {
      const identifierLimit = await checkRateLimit(`login:id:${identifier.toLowerCase()}:${schoolSlug || ''}`, 8, 15 * 60);
      if (!identifierLimit.allowed) {
        return NextResponse.json({ error: 'Too many attempts for this account. Please try again in 15 minutes.' }, { status: 429 });
      }
    }

    // Validate required fields
    if (!identifier || !password || !role || !schoolSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['STUDENT', 'TEACHER', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role specified' },
        { status: 400 }
      );
    }

    // Find the school first
    const school = await prisma.school.findFirst({
      where: { 
        slug: schoolSlug,
        isActive: true
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found or inactive' },
        { status: 404 }
      );
    }

    // Find user by email or username within the school
    const user = await prisma.user.findFirst({
      where: {
        AND: [
          { schoolId: school.id },
          { role: role },
          { isActive: true },
          {
            OR: [
              { email: identifier.toLowerCase() },
              { username: identifier.toLowerCase() }
            ]
          }
        ]
      },
      include: {
        school: true,
        studentProfile: role === 'STUDENT',
        teacherProfile: role === 'TEACHER', 
        adminProfile: role === 'ADMIN' ? {
          include: {
            permissions: true
          }
        } : false
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > new Date()) {
      const lockTimeRemaining = Math.ceil((user.lockUntil - new Date()) / (1000 * 60));
      return NextResponse.json(
        { error: `Account is locked. Try again in ${lockTimeRemaining} minutes.` },
        { status: 423 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      // Increment login attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: user.loginAttempts + 1,
          lockUntil: user.loginAttempts >= 4 ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null // Lock for 2 hours after 5 attempts
        }
      });

      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Reset login attempts and update last login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockUntil: null,
        lastLogin: new Date()
      }
    });

    // Determine actual user role for JWT - important for teachers!
    let jwtRole = user.role;
    if (user.role === 'TEACHER' && user.teacherProfile?.department) {
      // Use the specific teacher department as the role in JWT
      jwtRole = user.teacherProfile.department;
    }

    // Generate JWT token with CORRECT role information
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      {
        userId: user.id,
        role: jwtRole, // Use the determined role (could be director, coordinator, etc.)
        schoolId: school.id,
        schoolSlug: school.slug,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    // Create session hash for tracking
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessionExpiry = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    // Store session in database
    await prisma.userSession.create({
      data: {
        userId: user.id,
        tokenHash: tokenHash,
        expiresAt: sessionExpiry
      }
    });

    // Set secure cookie
    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/'
    });

    // Determine redirect URL based on role
    let redirectTo = '/protected/dashboard';

    if (user.role === 'STUDENT') {
      redirectTo = '/protected/students/dashboard';
    } else if (user.role === 'ADMIN') {
      redirectTo = '/protected/admin';
    } else if (user.role === 'TEACHER') {
      // Always check the latest teacherProfile from DB for department
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId: user.id }
      });
      if (teacherProfile?.department) {
        switch (teacherProfile.department) {
          case 'director':
            redirectTo = '/protected/teacher/director/dashboard';
            break;
          case 'coordinator':
            redirectTo = '/protected/teacher/coordinator/dashboard';
            break;
          case 'class_teacher':
            redirectTo = '/protected/teacher/class/dashboard';
            break;
          case 'subject_teacher':
            redirectTo = '/protected/teacher/subject/dashboard';
            break;
          default:
            redirectTo = '/protected/teacher';
        }
      } else {
        redirectTo = '/protected/teacher';
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role, // Keep original role for client
        department: user.teacherProfile?.department || null, // Add department info
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      },
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        logo: school.logo
      },
      redirectTo: redirectTo
    });

  } catch (error) {
    console.error('School login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}