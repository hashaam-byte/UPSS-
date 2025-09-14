// middleware.js (for Next.js 13+)
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function middleware(request) {
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
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
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

      // Define role permissions - hierarchical access
      const rolePermissions = {
        'headadmin': [
          '/protected/headadmin', 
          '/protected/admin', 
          '/protected/teachers', 
          '/protected/students',
          '/api/protected/headadmin',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students'
        ],
        'admin': [
          '/protected/admin', 
          '/protected/teachers', 
          '/protected/students',
          '/api/protected/admin',
          '/api/protected/teachers',
          '/api/protected/students'
        ],
        'teacher': [
          '/protected/teachers',
          '/api/protected/teachers'
        ],
        'student': [
          '/protected/students',
          '/api/protected/students'
        ]
      };

      // Check if user has permission to access this path
      const allowedPaths = rolePermissions[userRole] || [];
      const hasPermission = allowedPaths.some(allowedPath => 
        requestedPath.startsWith(allowedPath.toLowerCase())
      );

      if (!hasPermission) {
        console.log(`Role ${userRole} denied access to ${pathname}`);
        if (pathname.startsWith('/api/')) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
        return NextResponse.redirect(new URL('/auth/unauthorized', request.url));
      }

      // Check if token is close to expiry (less than 15 minutes)
      const tokenExp = decoded.exp;
      const currentTime = Math.floor(Date.now() / 1000);
      const timeUntilExpiry = tokenExp - currentTime;

      // Add user info to headers for the protected pages/APIs
      const response = NextResponse.next();
      response.headers.set('X-User-Role', userRole);
      response.headers.set('X-User-ID', decoded.userId);
      response.headers.set('X-School-ID', decoded.schoolId || '');
      response.headers.set('X-User-Email', decoded.email || '');
      
      // If token expires soon, add header to trigger refresh
      if (timeUntilExpiry < 900) { // 15 minutes
        response.headers.set('X-Token-Refresh-Needed', 'true');
      }
      
      return response;

    } catch (error) {
      console.error('Auth middleware error:', error);
      
      // Clear invalid token
      const response = pathname.startsWith('/api/') 
        ? NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
        : NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  // For non-protected routes, continue normally
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all paths under /protected
    '/protected/:path*',
    // Match protected API routes
    '/api/protected/:path*'
  ]
};
