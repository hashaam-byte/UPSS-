import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth( ['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.$queryRaw`
      WITH latest_messages AS (
        SELECT DISTINCT ON (
          CASE 
            WHEN m."fromUserId" = ${user.id} THEN m."toUserId"
            ELSE m."fromUserId"
          END
        )
          m.*,
          CASE 
            WHEN m."fromUserId" = ${user.id} THEN m."toUserId"
            ELSE m."fromUserId"
          END as participant_id
        FROM messages m
        WHERE 
          (m."fromUserId" = ${user.id} OR m."toUserId" = ${user.id})
          AND m.school_id = ${user.schoolId}
        ORDER BY 
          CASE 
            WHEN m."fromUserId" = ${user.id} THEN m."toUserId"
            ELSE m."fromUserId"
          END,
          m."createdAt" DESC
      )
      SELECT 
        lm.id as conversation_id,
        lm.participant_id,
        u."firstName",
        u."lastName",
        u.email,
        u.role,
        lm.content as last_message,
        lm."createdAt" as last_message_time,
        COUNT(*) FILTER (WHERE m."toUserId" = ${user.id} AND m."isRead" = false) as unread_count
      FROM latest_messages lm
      JOIN users u ON u.id = lm.participant_id
      LEFT JOIN messages m ON 
        ((m."fromUserId" = lm.participant_id AND m."toUserId" = ${user.id}) OR
         (m."fromUserId" = ${user.id} AND m."toUserId" = lm.participant_id))
      GROUP BY lm.id, lm.participant_id, u."firstName", u."lastName", u.email, u.role, lm.content, lm."createdAt"
      ORDER BY lm."createdAt" DESC
    `;

    return NextResponse.json({ success: true, conversations: conversations || [] });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
