// proxy.ts — replaces middleware.ts as of Next.js 16 (network boundary/routing). Runs on the Node.js runtime (edge is not supported here).
// Renamed from middleware.ts during the Next 15 -> 16 upgrade; logic is unchanged.
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export default async function proxy(request: NextRequest) {
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
      // NOTE: decoded.role is uppercase for HEADADMIN/ADMIN/STUDENT (matches the UserRole enum)
      // but lowercase for teacher subdivisions (director/coordinator/class_teacher/subject_teacher,
      // set from TeacherProfile.department at login). Normalize before lookup or non-teacher
      // roles never match any permission entry.
      const userRole = decoded.role.toLowerCase();
      const requestedPath = pathname; // Keep original case for exact matching

      // Define role permissions with exact path matching
      const rolePermissions: Record<string, string[]> = {
        headadmin: [
          '/protected/headadmin',
          '/protected/admin',
          '/protected/teacher',
          '/protected/students',
          '/api/protected/headadmin',
          '/api/protected/admin',
          '/api/protected/teacher',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        admin: [
          '/protected/admin',
          '/protected/teacher',
          '/protected/students',
          '/api/protected/admin',
          '/api/protected/teacher',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        // Teacher role - includes all teacher subdivisions
        teacher: [
          '/protected/teacher',
          '/api/protected/teacher',
          '/api/protected/teachers',
        ],
        // Teacher subdivisions - each has access to their specific area + shared teacher routes
        // (messaging lives under the plural /api/protected/teachers/* prefix and is shared by all subdivisions)
        director: [
          '/protected/teacher',
          '/protected/teacher/director',
          '/api/protected/teacher',
          '/api/protected/teachers/director',
          '/api/protected/teachers/messages',
          '/api/protected/teachers/class/messages',
        ],
        coordinator: [
          '/protected/teacher',
          '/protected/teacher/coordinator',
          '/api/protected/teacher',
          '/api/protected/teachers/coordinator',
          '/api/protected/teachers/messages',
          '/api/protected/teachers/class/messages',
        ],
        class_teacher: [
          '/protected/teacher',
          '/protected/teacher/class',
          '/api/protected/teacher',
          '/api/protected/teachers/messages',
          '/api/protected/teachers/class/messages',
        ],
        subject_teacher: [
          '/protected/teacher',
          '/protected/teacher/subject',
          '/api/protected/teacher',
          '/api/protected/teachers/messages',
          '/api/protected/teachers/class/messages',
        ],
        student: [
          '/protected/students',
          '/api/protected/students'
        ],
        parent: [
          '/protected/parent',
          '/api/protected/parent',
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