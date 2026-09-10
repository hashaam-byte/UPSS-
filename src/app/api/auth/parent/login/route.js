// /api/auth/parent/login
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
    const { phone, password, rememberMe } = body;

    const ip = getClientIp(request);
    const ipLimit = await checkRateLimit(`parent-login:ip:${ip}`, 15, 15 * 60);
    if (!ipLimit.allowed) {
      return NextResponse.json({ error: 'Too many login attempts. Please try again in 15 minutes.' }, { status: 429 });
    }
    if (phone) {
      const phoneLimit = await checkRateLimit(`parent-login:phone:${phone}`, 8, 15 * 60);
      if (!phoneLimit.allowed) {
        return NextResponse.json({ error: 'Too many attempts for this account. Please try again in 15 minutes.' }, { status: 429 });
      }
    }

    if (!phone || !password) {
      return NextResponse.json({ error: 'Phone number and password are required' }, { status: 400 });
    }

    const parentProfile = await prisma.parentProfile.findFirst({
      where: { phone: phone.trim() },
      include: { user: true }
    });

    if (!parentProfile || !parentProfile.user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (parentProfile.user.lockUntil && new Date(parentProfile.user.lockUntil) > new Date()) {
      return NextResponse.json({ error: 'Account temporarily locked due to too many failed attempts. Try again later.' }, { status: 423 });
    }

    const isValidPassword = await bcrypt.compare(password, parentProfile.user.passwordHash);

    if (!isValidPassword) {
      await prisma.user.update({
        where: { id: parentProfile.user.id },
        data: {
          loginAttempts: parentProfile.user.loginAttempts + 1,
          lockUntil: parentProfile.user.loginAttempts >= 4 ? new Date(Date.now() + 2 * 60 * 60 * 1000) : null
        }
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: parentProfile.user.id },
      data: { loginAttempts: 0, lockUntil: null, lastLogin: new Date() }
    });

    const tokenExpiry = rememberMe ? '30d' : '24h';
    const token = jwt.sign(
      {
        userId: parentProfile.user.id,
        role: 'PARENT',
        schoolId: parentProfile.schoolId,
        phone: parentProfile.phone
      },
      process.env.JWT_SECRET,
      { expiresIn: tokenExpiry }
    );

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const sessionExpiry = new Date(Date.now() + (rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

    await prisma.userSession.create({
      data: { userId: parentProfile.user.id, tokenHash, expiresAt: sessionExpiry }
    });

    const cookieStore = await cookies();
    cookieStore.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/'
    });

    return NextResponse.json({
      success: true,
      redirectTo: '/protected/parent/dashboard',
      user: {
        id: parentProfile.user.id,
        role: 'PARENT'
      }
    });

  } catch (error) {
    console.error('Parent login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
