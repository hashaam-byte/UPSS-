// /app/api/auth/verify/route.js - Updated for Teacher Subdivisions
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'No authentication token' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if session exists and is active
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Determine what to include based on decoded role
    const includeOptions = {
      school: decoded.role !== 'headadmin',
      studentProfile: decoded.role === 'student',
      teacherProfile: decoded.role === 'teacher' || 
                    ['director', 'coordinator', 'class_teacher', 'subject_teacher'].includes(decoded.role),
      adminProfile: decoded.role === 'admin' ? {
        include: { permissions: true }
      } : false
    };

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: includeOptions
    });
    
    if (!user || !user.isActive) {
      // Invalidate session if user not found or inactive
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
      
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 401 }
      );
    }

    // For head admin, skip school checks
    if (decoded.role === 'headadmin') {
      return NextResponse.json({
        authenticated: true,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          username: user.username,
          role: user.role,
          avatar: user.avatar,
          isEmailVerified: user.isEmailVerified
        },
        redirectTo: '/protected/headadmin'
      });
    }

    // Check if school is still active (for non-head admins)
    if (!user.school?.isActive) {
      await prisma.userSession.update({
        where: { id: session.id },
        data: { isActive: false }
      });
      
      return NextResponse.json(
        { error: 'School is inactive' },
        { status: 401 }
      );
    }

    // Determine redirect URL based on actual user role and subdivisions
    let redirectTo = '/protected/dashboard';
    
    if (user.role === 'student') {
      redirectTo = '/protected/students';
    } else if (user.role === 'admin') {
      redirectTo = '/protected/admin';
    } else if (user.role === 'teacher') {
      // Handle teacher subdivisions based on their department
      const teacherProfile = user.teacherProfile;
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
            redirectTo = '/protected/teachers';
        }
      } else {
        redirectTo = '/protected/teachers';
      }
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
        role: user.role,
        department: user.teacherProfile?.department || null, // Add department info
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        // Include profile data based on role
        ...(user.studentProfile && { studentProfile: user.studentProfile }),
        ...(user.teacherProfile && { teacherProfile: user.teacherProfile }),
        ...(user.adminProfile && { 
          adminProfile: {
            ...user.adminProfile,
            permissions: user.adminProfile.permissions
          }
        })
      },
      school: {
        id: user.school.id,
        name: user.school.name,
        slug: user.school.slug,
        logo: user.school.logo,
        subscriptionPlan: user.school.subscriptionPlan,
        subscriptionIsActive: user.school.subscriptionIsActive
      },
      redirectTo: redirectTo
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }
    
    if (error.name === 'TokenExpiredError') {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 401 }
      );
    }
    
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}