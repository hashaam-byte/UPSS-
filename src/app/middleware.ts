// middleware.ts - Updated for Teacher Subdivisions Support
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect the entire /protected directory and API routes
  if (pathname.startsWith('/protected') || pathname.startsWith('/api/protected')) {
    try {
      // Get token from cookies
      const token = request.cookies.get('auth_token')?.value;

      if (!token) {
        console.log('No token found, redirecting to login');
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
          );
        }
        return NextResponse.redirect(new URL('/protected', request.url));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: string;
        schoolId?: string;
        email?: string;
        exp: number;
        isHeadAdmin?: boolean;
      };

      if (!decoded || !decoded.userId || !decoded.role) {
        console.log('Invalid token, redirecting to login');
        const response = pathname.startsWith('/api/')
          ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
          : NextResponse.redirect(new URL('/protected', request.url));
        response.cookies.delete('auth_token');
        return response;
      }

      // Role-based route protection with teacher subdivisions
      const userRole = decoded.role;
      const requestedPath = pathname; // Keep original case for exact matching

      // Define role permissions with exact path matching
      const rolePermissions: Record<string, string[]> = {
        headadmin: [
          '/protected/headadmin',
          '/protected/Headadmin', // Support both cases
          '/protected/admin',
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/students',
          '/api/protected/headadmin',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        admin: [
          '/protected/admin',
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/students',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        // Teacher role - includes all teacher subdivisions
        teacher: [
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/teacher', // Base teacher routes
          '/api/protected/teachers',
        ],
        // Teacher subdivisions - each has access to their specific area + base teacher routes
        director: [
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/teacher',
          '/protected/teacher/director',
          '/api/protected/teachers',
          '/api/protected/teacher/director',
        ],
        coordinator: [
          '/protected/teacher',
          '/protected/Teacher', // Support both cases
          '/protected/teacher',
          '/protected/teacher/coordinator',
          '/api/protected/teachers',
          '/api/protected/teacher/coordinator',
        ],
        class_teacher: [
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/teacher',
          '/protected/teacher/class',
          '/api/protected/teachers',
          '/api/protected/teacher/class',
        ],
        subject_teacher: [
          '/protected/teachers',
          '/protected/Teachers', // Support both cases
          '/protected/teacher',
          '/protected/teacher/subject',
          '/api/protected/teachers',
          '/api/protected/teacher/subject',
        ],
        student: [
          '/protected/students',
          '/api/protected/students'
        ],
      };

      const allowedPaths = rolePermissions[userRole] || [];
      
      // Check if user has permission - use startsWith for flexible matching
      const hasPermission = allowedPaths.some((allowedPath) =>
        requestedPath.startsWith(allowedPath)
      );

      if (!hasPermission) {
        console.log(`Role ${userRole} denied access to ${pathname}`);
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }
        return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
      }

      // Token expiry check
      const tokenExp = decoded.exp;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenExp - currentTime;

      // Add user info to headers
      const response = NextResponse.next();
      response.headers.set('X-User-Role', userRole);
      response.headers.set('X-User-ID', decoded.userId);
      response.headers.set('X-School-ID', decoded.schoolId || '');
      response.headers.set('X-User-Email', decoded.email || '');
      response.headers.set('X-Is-Head-Admin', decoded.isHeadAdmin ? 'true' : 'false');

      if (timeUntilExpiry < 900) {
        response.headers.set('X-Token-Refresh-Needed', 'true');
      }

      return response;
    } catch (error) {
      console.error('Auth middleware error:', error);

      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
        : NextResponse.redirect(new URL('/protected', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/protected/:path*', '/api/protected/:path*'],
};