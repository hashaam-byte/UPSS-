import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request, ['headadmin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schoolId = params.id;

    const messages = await prisma.message.findMany({
      where: {
        schoolId,
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id }
        ]
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        content: true,
        fromUserId: true,
        toUserId: true,
        createdAt: true,
        isRead: true
      }
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}
