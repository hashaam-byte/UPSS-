// src/app/api/auth/school/login/route.ts
import { NextResponse } from 'next/server';
import { authenticateSchoolUser, createJWT, getRoleRedirectURL } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { schoolSlug, email, password } = body;

    if (!schoolSlug || !email || !password) {
      return NextResponse.json(
        { error: 'School, email and password are required' },
        { status: 400 }
      );
    }

    const payload = await authenticateSchoolUser(schoolSlug, email, password);

    if (!payload) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Create JWT token and set cookie
    const token = createJWT(payload);
    const response = NextResponse.json({
      message: 'Login successful',
      redirectTo: getRoleRedirectURL(payload.role)
    });

    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school_id: payload.schoolId,
        action: 'USER_LOGIN',
        details: { email, role: payload.role },
        user_id: payload.sub,
        user_type: payload.role
      }
    });

    return response;
  } catch (error: any) {
    console.error('School login error:', error);

    if (error?.message === 'School is suspended') {
      return NextResponse.json(
        { error: 'School account is suspended', code: 'SCHOOL_SUSPENDED' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
