// /lib/auth.js - Updated for Teacher Subdivisions Support
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify session is still active
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session) {
      return null;
    }

    // Special case: Head Admin doesn't need school relations
    if (decoded.role === 'headadmin') {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true,
          role: true,
          avatar: true,
          isEmailVerified: true,
          isActive: true
        }
      });

      if (!user || !user.isActive) {
        return null;
      }

      return user;
    }

    // Regular users (admin, teacher, student) - determine includes based on user role
    const includeOptions = {
      school: true,
      studentProfile: false,
      teacherProfile: false,
      adminProfile: false
    };

    // Determine what to include based on token role or fallback to user role
    const isTeacherRole = decoded.role === 'teacher' || 
                         ['director', 'coordinator', 'class_teacher', 'subject_teacher'].includes(decoded.role);
    
    if (decoded.role === 'student') {
      includeOptions.studentProfile = true;
    } else if (isTeacherRole) {
      includeOptions.teacherProfile = true;
    } else if (decoded.role === 'admin') {
      includeOptions.adminProfile = { include: { permissions: true } };
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: includeOptions
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      username: user.username,
      role: user.role,
      department: user.teacherProfile?.department || null, // Add department info
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      school: user.school,
      profile: user.studentProfile || user.teacherProfile || user.adminProfile
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function requireAuth(allowedRoles = []) {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  if (allowedRoles.length > 0) {
    // Check if user's role or department is in allowed roles
    const userIdentifiers = [user.role];
    if (user.department) {
      userIdentifiers.push(user.department);
    }
    
    const hasPermission = allowedRoles.some(role => 
      userIdentifiers.includes(role)
    );
    
    if (!hasPermission) {
      throw new Error('Access denied');
    }
  }

  return user;
}

export function generateSecureToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

export async function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function validatePassword(password) {
  const errors = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/(?=.*[@$!%*?&])/.test(password)) {
    errors.push('Password must contain at least one special character (@$!%*?&)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Rate limiting utilities
export class RateLimiter {
  constructor() {
    this.attempts = new Map();
  }

  isRateLimited(identifier, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
    const now = Date.now();

    if (!this.attempts.has(identifier)) {
      this.attempts.set(identifier, []);
    }

    const userAttempts = this.attempts.get(identifier);

    // Keep only attempts inside the time window
    const validAttempts = userAttempts.filter(ts => now - ts < windowMs);
    this.attempts.set(identifier, validAttempts);

    return validAttempts.length >= maxAttempts;
  }

  recordAttempt(identifier) {
    const now = Date.now();

    if (!this.attempts.has(identifier)) {
      this.attempts.set(identifier, []);
    }

    this.attempts.get(identifier).push(now);
  }

  reset(identifier) {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();