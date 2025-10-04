// app/api/protected/headadmin/messages/broadcast/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['headadmin']);
    
    if (!authResult.authenticated || authResult.user?.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subject, content, priority = 'normal' } = body;

    // Validate required fields
    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      );
    }

    // Get all active schools
    const schools = await prisma.school.findMany({
      where: {
        isActive: true
      },
      include: {
        users: {
          where: {
            role: 'admin',
            isActive: true
          },
          select: {
            id: true,
            email: true
          }
        }
      }
    });

    if (schools.length === 0) {
      return NextResponse.json(
        { error: 'No active schools found' },
        { status: 404 }
      );
    }

    // Create broadcast messages and notifications for all schools
    const messagePromises = schools.map(async (school) => {
      // Create message for each school
      const message = await prisma.message.create({
        data: {
          fromUserId: null, // null = Head Admin
          toUserId: school.users[0]?.id || null,
          schoolId: school.id,
          subject: subject.trim(),
          content: content.trim(),
          messageType: 'broadcast',
          priority: priority,
          isRead: false,
          isBroadcast: true
        }
      });

      // Create notification for each school admin
      if (school.users[0]?.id) {
        await prisma.notification.create({
          data: {
            userId: school.users[0].id,
            schoolId: school.id,
            title: `Broadcast: ${subject.trim()}`,
            content: content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''),
            type: priority === 'urgent' ? 'warning' : 'info',
            priority: priority,
            isRead: false,
            isGlobal: false
          }
        });
      }

      return message;
    });

    const messages = await Promise.all(messagePromises);

    return NextResponse.json({
      success: true,
      broadcastCount: messages.length,
      schoolsNotified: schools.length,
      message: `Broadcast sent to ${schools.length} school(s)`
    });

  } catch (error) {
    console.error('Error sending broadcast:', error);
    return NextResponse.json(
      { error: 'Failed to send broadcast message' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}