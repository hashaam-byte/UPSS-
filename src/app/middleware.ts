// middleware.ts (for Next.js 13+)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server'; // ✅ Import the type
import jwt from 'jsonwebtoken';

export async function middleware(request: NextRequest) { // ✅ Add type
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
        return NextResponse.redirect(new URL('/auth/login', request.url));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
        userId: string;
        role: string;
        schoolId?: string;
        email?: string;
        exp: number;
      };

      if (!decoded || !decoded.userId || !decoded.role) {
        console.log('Invalid token, redirecting to login');
        const response = pathname.startsWith('/api/')
          ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
          : NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('auth_token');
        return response;
      }

      // Role-based route protection
      const userRole = decoded.role;
      const requestedPath = pathname.toLowerCase();

      const rolePermissions: Record<string, string[]> = {
        headadmin: [
          '/protected/headadmin',
          '/protected/admin',
          '/protected/teachers',
          '/protected/students',
          '/api/protected/headadmin',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        admin: [
          '/protected/admin',
          '/protected/teachers',
          '/protected/students',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students',
        ],
        teacher: ['/protected/teachers', '/api/protected/teachers'],
        student: ['/protected/students', '/api/protected/students'],
      };

      const allowedPaths = rolePermissions[userRole] || [];
      const hasPermission = allowedPaths.some((allowedPath) =>
        requestedPath.startsWith(allowedPath.toLowerCase())
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

      if (timeUntilExpiry < 900) {
        response.headers.set('X-Token-Refresh-Needed', 'true');
      }

      return response;
    } catch (error) {
      console.error('Auth middleware error:', error);

      const response = pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
        : NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/protected/:path*', '/api/protected/:path*'],
};
