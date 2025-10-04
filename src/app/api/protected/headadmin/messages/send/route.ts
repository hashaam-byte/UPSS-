// app/api/protected/headadmin/messages/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import {requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(['headadmin']);

    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { toUserId, schoolId, content, messageType = 'direct' } = body;

    // Validate required fields
    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Verify the school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Create the message (fromUserId = null indicates it's from Head Admin)
    const message = await prisma.message.create({
      data: {
        fromUserId: null, // null indicates Head Admin
        toUserId: toUserId || null,
        schoolId: schoolId,
        content: content.trim(),
        messageType: messageType,
        priority: 'normal',
        isRead: false,
        isBroadcast: false
      },
      include: {
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Create a notification for the school admin
    if (toUserId) {
      await prisma.notification.create({
        data: {
          userId: toUserId,
          schoolId: schoolId,
          title: 'New message from Head Admin',
          content: content.trim().substring(0, 100) + (content.length > 100 ? '...' : ''),
          type: 'info',
          priority: 'normal',
          isRead: false,
          isGlobal: false
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: message,
      messageId: message.id
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}