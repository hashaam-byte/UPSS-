// pages/api/protected/headadmin/messages/broadcast.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { subject, content, priority = 'normal' } = body;

    if (!subject || !subject.trim() || !content || !content.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    // Get all active school admins
    const schoolAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true,
        schoolId: { not: null }
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      }
    });

    const activeAdmins = schoolAdmins.filter(admin => admin.school?.isActive);

    if (activeAdmins.length === 0) {
      return NextResponse.json({ error: 'No active school administrators found' }, { status: 400 });
    }

    // Create broadcast messages
    const messages = await prisma.message.createMany({
      data: activeAdmins.map(admin => ({
        fromUserId: user.id,
        toUserId: admin.id,
        schoolId: admin.schoolId,
        subject: subject.trim(),
        content: content.trim(),
        messageType: 'broadcast',
        priority,
        isBroadcast: true
      }))
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'broadcast_sent',
        resource: 'message',
        description: `Sent broadcast message to ${activeAdmins.length} school administrators`,
        metadata: {
          subject: subject.trim(),
          recipientCount: activeAdmins.length,
          priority
        }
      }
    });

    return NextResponse.json({
      success: true,
      messagesSent: activeAdmins.length
    });

  } catch (error) {
    console.error('Failed to send broadcast:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}