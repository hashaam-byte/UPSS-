
// /app/api/auth/create-headadmin/route.js
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, password, confirmPassword } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check password complexity
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' },
        { status: 400 }
      );
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Check if head admin already exists
    const existingHeadAdmin = await prisma.user.findFirst({
      where: { role: 'headadmin' }
    });
    
    if (existingHeadAdmin) {
      return NextResponse.json(
        { error: 'Head admin already exists. Only one head admin is allowed.' },
        { status: 409 }
      );
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email is already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create head admin user
    const newHeadAdmin = await prisma.user.create({
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: passwordHash,
        role: 'headadmin',
        isEmailVerified: true,
        isActive: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Head admin account created successfully',
      user: {
        id: newHeadAdmin.id,
        firstName: newHeadAdmin.firstName,
        lastName: newHeadAdmin.lastName,
        email: newHeadAdmin.email,
        role: newHeadAdmin.role
      }
    });

  } catch (error) {
    console.error('Create head admin error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}