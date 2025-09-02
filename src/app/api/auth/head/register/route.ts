import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if head admin already exists
    const existingAdmin = await prisma.headAdmin.findFirst();
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Head admin already exists' },
        { status: 403 }
      );
    }

    const { name, email, password } = await request.json();

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'Name, email and password are required' },
        { status: 400 }
      );
    }

    // Check if email is already used
    const existingEmail = await prisma.headAdmin.findUnique({
      where: { email }
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Email already in use' },
        { status: 400 }
      );
    }

    // Hash password and create admin
    const password_hash = await hashPassword(password);

    const headAdmin = await prisma.headAdmin.create({
      data: {
        name,
        email,
        password_hash
      }
    });

    return NextResponse.json({
      message: 'Head admin created successfully',
      id: headAdmin.id
    });

  } catch (error) {
    console.error('Head admin registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await prisma.headAdmin.findFirst();
    return NextResponse.json({ exists: !!admin });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
