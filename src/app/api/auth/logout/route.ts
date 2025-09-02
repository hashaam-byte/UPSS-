// src/app/api/auth/logout/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  // Clear the auth cookie
  const response = NextResponse.json({ message: 'Logout successful' });

  response.cookies.set({
    name: 'auth-token',
    value: '',
    maxAge: 0,
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/'
  });

  return response;
}
