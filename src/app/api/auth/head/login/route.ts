// app/api/auth/head/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateHeadAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const payload = await authenticateHeadAdmin(email, password);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    await prisma.auditLog.create({
      data: {
        action: 'HEAD_ADMIN_LOGIN',
        details: { email },
        user_id: payload.sub,
        user_type: 'HEAD_ADMIN'
      }
    });

    return NextResponse.json({
      message: 'Login successful',
      redirectTo: '/head/dashboard'
    });

  } catch (error) {
    console.error('Head admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
