import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth(request, ['headadmin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { subject, content, priority = 'normal' } = await request.json();

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content required' }, { status: 400 });
    }

    const schools = await prisma.school.findMany({
      where: { isActive: true },
      select: { id: true }
    });

    const messages = await Promise.all(
      schools.map(school =>
        prisma.message.create({
          data: {
            fromUserId: user.id,
            schoolId: school.id,
            subject,
            content: content.trim(),
            messageType: 'broadcast',
            priority,
            isBroadcast: true
          }
        })
      )
    );

    return NextResponse.json({ success: true, count: messages.length });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    return NextResponse.json({ error: 'Failed to send broadcast' }, { status: 500 });
  }
}
