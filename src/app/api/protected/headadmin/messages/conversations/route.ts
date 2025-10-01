import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['headadmin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT ON (m.school_id)
        m.school_id,
        s.name as school_name,
        s.id as school_id,
        u.id as user_id,
        u."firstName" as user_first_name,
        u."lastName" as user_last_name,
        u.email as user_email,
        m.content as last_message_content,
        m."createdAt" as last_message_time,
        m."isRead" as is_read,
        COUNT(*) FILTER (WHERE m."toUserId" = ${user.id} AND m."isRead" = false) as unread_count
      FROM messages m
      JOIN schools s ON m.school_id = s.id
      LEFT JOIN users u ON u.school_id = s.id AND u.role = 'admin'
      WHERE m."fromUserId" = ${user.id} OR m."toUserId" = ${user.id}
      GROUP BY m.school_id, s.name, s.id, u.id, u."firstName", u."lastName", u.email, m.content, m."createdAt", m."isRead"
      ORDER BY m.school_id, m."createdAt" DESC
    `;

    return NextResponse.json({ 
      success: true, 
      conversations: conversations || [] 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
