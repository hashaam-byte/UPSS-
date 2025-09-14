
// /lib/auth.js - Server-side auth utilities
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      return null;
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
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        school: true,
        studentProfile: decoded.role === 'student',
        teacherProfile: decoded.role === 'teacher',
        adminProfile: decoded.role === 'admin' ? {
          include: {
            permissions: true
          }
        } : false
      }
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

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    throw new Error('Access denied');
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
    const key = identifier;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    const userAttempts = this.attempts.get(key);
    
    // Remove attempts outside the time window
    const validAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
    this.attempts.set(key, validAttempts);
    
    return validAttempts.length >= maxAttempts;
  }

  recordAttempt(identifier) {
    const now = Date.now();
    const key = identifier;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }
    
    this.attempts.get(key).push(now);
  }

  reset(identifier) {
    this.attempts.delete(identifier);
  }
}

// Global rate limiter instance
export const rateLimiter = new RateLimiter();
