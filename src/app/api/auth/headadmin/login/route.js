
// /app/api/auth/headadmin/login/route.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find head admin user
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase(),
        role: 'headadmin',
        isActive: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Head admin not found or inactive' },
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
          lockUntil: user.loginAttempts >= 4 ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null
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

    // Generate JWT token
    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      {
        userId: user.id,
        role: 'headadmin',
        email: user.email,
        isHeadAdmin: true
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
        userAgent: request.headers.get('user-agent') || null,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        expiresAt: sessionExpiry,
        isActive: true
      }
    });

    // Set secure cookie
    const cookieStore = cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      message: 'Head admin login successful',
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: 'headadmin',
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified
      },
      redirectTo: '/protected/headadmin'
    });

  } catch (error) {
    console.error('Head admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
