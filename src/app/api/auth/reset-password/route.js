
// /app/api/auth/reset-password/route.js
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, type, schoolSlug } = body;

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    let user;
    
    if (type === 'headadmin') {
      user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          role: 'headadmin',
          isActive: true
        }
      });
    } else {
      // For school users, we need the school slug
      if (!schoolSlug) {
        return NextResponse.json(
          { error: 'School information is required' },
          { status: 400 }
        );
      }

      const school = await prisma.school.findFirst({
        where: { slug: schoolSlug, isActive: true }
      });
      
      if (!school) {
        return NextResponse.json(
          { error: 'School not found' },
          { status: 404 }
        );
      }

      user = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          schoolId: school.id,
          isActive: true
        },
        include: { school: true }
      });
    }

    if (!user) {
      // For security, don't reveal if user exists or not
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token to database
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt: resetTokenExpiry,
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null
      }
    });

    // Create reset URL
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password/confirm?token=${resetToken}&type=${type}`;

    // Send reset email
    const mailOptions = {
      from: `"U PLUS System" <${process.env.SMTP_FROM}>`,
      to: user.email,
      subject: 'Password Reset Request - U PLUS',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello ${user.firstName},</p>
          <p>You have requested a password reset for your U PLUS account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all; color: #6b7280;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            This is an automated message from U PLUS System. Please do not reply to this email.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
