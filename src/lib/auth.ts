// lib/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma, withTenant } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  sub: string; // user id
  role: string;
  schoolId?: number;
  schoolSchema?: string;
  exp: number;
}

export interface AuthContext {
  user: JWTPayload;
  isHeadAdmin: boolean;
  schoolId?: number;
  schoolSchema?: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Create JWT token
export function createJWT(payload: Omit<JWTPayload, 'exp'>): string {
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    },
    JWT_SECRET
  );
}

// Verify JWT token
export function verifyJWT(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

// Extract auth from request
export function getAuthFromRequest(request: NextRequest): AuthContext | null {
  try {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) return null;

    const payload = verifyJWT(token);
    return {
      user: payload,
      isHeadAdmin: payload.role === 'HEAD_ADMIN',
      schoolId: payload.schoolId,
      schoolSchema: payload.schoolSchema
    };
  } catch {
    return null;
  }
}

// Create auth cookie response
export function createAuthResponse(payload: Omit<JWTPayload, 'exp'>, redirectTo: string): NextResponse {
  const token = createJWT(payload);
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL));
  
  response.cookies.set('auth-token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  });

  return response;
}

// Clear auth cookie
export function clearAuthResponse(redirectTo: string): NextResponse {
  const response = NextResponse.redirect(new URL(redirectTo, process.env.NEXTAUTH_URL));
  response.cookies.delete('auth-token');
  return response;
}

// Auth middleware for API routes
export function withAuth(
  handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const auth = getAuthFromRequest(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if school is suspended (except for head admin)
    if (!auth.isHeadAdmin && auth.schoolId) {
      const school = await prisma.school.findUnique({
        where: { id: auth.schoolId },
        select: { status: true }
      });

      if (school?.status === 'SUSPENDED') {
        return NextResponse.json(
          { error: 'School suspended', code: 'SCHOOL_SUSPENDED' },
          { status: 403 }
        );
      }
    }

    return handler(request, auth);
  };
}

// Role-based authorization
export function requireRole(...allowedRoles: string[]) {
  return (handler: (request: NextRequest, context: AuthContext) => Promise<NextResponse>) => {
    return withAuth(async (request: NextRequest, context: AuthContext) => {
      if (!allowedRoles.includes(context.user.role)) {
        return NextResponse.json(
          { error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
      return handler(request, context);
    });
  };
}

// Authenticate head admin
export async function authenticateHeadAdmin(email: string, password: string): Promise<JWTPayload | null> {
  const admin = await prisma.headAdmin.findUnique({
    where: { email }
  });

  if (!admin || !(await verifyPassword(password, admin.password_hash))) {
    return null;
  }

  return {
    sub: admin.id.toString(),
    role: 'HEAD_ADMIN',
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
  };
}

// Authenticate school user
export async function authenticateSchoolUser(
  schoolSlug: string, 
  email: string, 
  password: string
): Promise<JWTPayload | null> {
  const school = await prisma.school.findUnique({
    where: { slug: schoolSlug },
    select: { id: true, db_schema: true, status: true }
  });

  if (!school) return null;

  // Check if school is suspended
  if (school.status === 'SUSPENDED') {
    throw new Error('School is suspended');
  }

  return await withTenant(school.db_schema, async (client) => {
    const user = await client.$queryRaw<Array<{
      id: string;
      password_hash: string;
      role: string;
      status: string;
    }>>`
      SELECT id, password_hash, role, status 
      FROM users 
      WHERE email = ${email} AND status = 'ACTIVE'
      LIMIT 1
    `;

    if (user.length === 0 || !(await verifyPassword(password, user[0].password_hash))) {
      return null;
    }

    return {
      sub: user[0].id,
      role: user[0].role,
      schoolId: school.id,
      schoolSchema: school.db_schema,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
  });
}

// Get role redirect URL
export function getRoleRedirectURL(role: string): string {
  const roleRoutes = {
    'HEAD_ADMIN': '/head/dashboard',
    'SCHOOL_ADMIN': '/admin/dashboard',
    'DIRECTOR': '/director/dashboard',
    'COORDINATOR': '/coordinator/dashboard',
    'TEACHER_SUBJECT': '/teacher/dashboard',
    'TEACHER_CLASS': '/teacher/dashboard',
    'STUDENT': '/student/dashboard'
  };

  return roleRoutes[role as keyof typeof roleRoutes] || '/';
}