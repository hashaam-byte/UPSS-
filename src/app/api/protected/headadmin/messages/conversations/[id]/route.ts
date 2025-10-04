// app/api/protected/headadmin/messages/conversations/[conversationId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
     const user = await requireAuth(['headadmin']);
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract schoolId from conversationId (format: conv-{schoolId})
    const schoolId = params.id.replace('conv-', '');

    // Fetch all messages for this school
    const messages = await prisma.message.findMany({
      where: {
        schoolId: schoolId
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true
          }
        },
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      messages: messages,
      total: messages.length
    });

  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
