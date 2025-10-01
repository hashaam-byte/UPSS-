// /app/api/protected/headadmin/messages/broadcast/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export async function POST(request) {
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

    const { subject, content, priority = 'normal', messageType = 'broadcast' } = await request.json();

    if (!subject || !subject.trim() || !content || !content.trim()) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    // Get all school admins
    const schoolAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        schoolId: true
      }
    });

    if (schoolAdmins.length === 0) {
      return NextResponse.json(
        { error: 'No school admins found' },
        { status: 404 }
      );
    }

    // Create broadcast messages for all admins
    const messages = await prisma.message.createMany({
      data: schoolAdmins.map(admin => ({
        fromUserId: null, // null for head admin
        toUserId: admin.id,
        schoolId: admin.schoolId,
        subject: subject.trim(),
        content: content.trim(),
        messageType,
        priority,
        isBroadcast: true,
        isRead: false
      }))
    });

    return NextResponse.json({ 
      success: true,
      messagesSent: messages.count 
    });

  } catch (error) {
    console.error('Error sending broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast' },
      { status: 500 }
    );
  }
}