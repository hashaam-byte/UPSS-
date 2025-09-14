
// /app/api/auth/logout/route.js
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        
        // Invalidate session in database
        await prisma.userSession.updateMany({
          where: {
            userId: decoded.userId,
            tokenHash: tokenHash
          },
          data: {
            isActive: false
          }
        });
      } catch (error) {
        // Token might be invalid, but we still want to clear the cookie
        console.log('Token verification failed during logout:', error.message);
      }
    }
    
    // Clear the auth cookie
    cookieStore.delete('auth_token');
    
    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
