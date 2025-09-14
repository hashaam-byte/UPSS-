// /app/api/auth/refresh/route.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verify session is still active
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash: tokenHash,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    // Generate new token
    const newToken = jwt.sign(
      {
        userId: decoded.userId,
        role: decoded.role,
        schoolId: decoded.schoolId,
        schoolSlug: decoded.schoolSlug,
        email: decoded.email,
        username: decoded.username
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update session with new token hash
    const newTokenHash = crypto.createHash('sha256').update(newToken).digest('hex');
    const newSessionExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.userSession.update({
      where: { id: session.id },
      data: {
        tokenHash: newTokenHash,
        expiresAt: newSessionExpiry
      }
    });

    // Set new cookie
    cookieStore.set('auth_token', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60,
      path: '/'
    });

    // Redirect back to original destination
    const redirectUrls = {
      headadmin: '/protected/headadmin',
      admin: '/protected/admin',
      teacher: '/protected/teachers',
      student: '/protected/students'
    };

    return NextResponse.redirect(new URL(redirectUrls[decoded.role], request.url));

  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }
}
