// app/api/protected/headadmin/messages/conversations/[id]/read/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;
    
    const authResult = await requireAuth(['headadmin']);
    
    if (!authResult.authenticated || authResult.user?.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract schoolId from conversationId (format: conv-{schoolId})
    const schoolId = id.replace('conv-', '');

    // Validate that we have a valid UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(schoolId)) {
      return NextResponse.json(
        { error: 'Invalid conversation ID format' },
        { status: 400 }
      );
    }

    // Mark all messages from this school as read
    const result = await prisma.message.updateMany({
      where: {
        schoolId: schoolId,
        fromUserId: { not: null }, // Only mark messages FROM school admin as read
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Messages marked as read',
      updatedCount: result.count
    });

  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark messages as read' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}