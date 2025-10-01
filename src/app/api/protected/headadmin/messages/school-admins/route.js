// /app/api/protected/headadmin/messages/school-admins/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const session = await prisma.userSession.findFirst({
      where: {
        tokenHash,
        isActive: true,
        expiresAt: { gt: new Date() }
      }
    });

    if (!session || decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all school admins
    const admins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
        school: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      },
      orderBy: {
        firstName: 'asc'
      }
    });

    return NextResponse.json({ admins });

  } catch (error) {
    console.error('Error fetching school admins:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school admins' },
      { status: 500 }
    );
  }
}