// /app/api/protected/admin/messages/conversations/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin']);

    // Get conversations for the admin user
    const conversations = await prisma.$queryRaw`
      SELECT DISTINCT
        m.id as conversation_id,
        CASE 
          WHEN m.fromUserId = ${user.id} THEN m.toUserId
          ELSE m.fromUserId
        END as participant_id,
        u.firstName as participant_firstName,
        u.lastName as participant_lastName,
        u.email as participant_email,
        u.role as participant_role,
        latest.content as last_message_content,
        latest.createdAt as last_message_time,
        COALESCE(unread.count, 0) as unread_count
      FROM messages m
      INNER JOIN users u ON (
        CASE 
          WHEN m.fromUserId = ${user.id} THEN m.toUserId
          ELSE m.fromUserId
        END = u.id
      )
      INNER JOIN (
        SELECT 
          CASE 
            WHEN fromUserId = ${user.id} THEN toUserId
            ELSE fromUserId
          END as other_user,
          MAX(createdAt) as max_time
        FROM messages
        WHERE fromUserId = ${user.id} OR toUserId = ${user.id}
        GROUP BY other_user
      ) latest_time ON (
        CASE 
          WHEN m.fromUserId = ${user.id} THEN m.toUserId
          ELSE m.fromUserId
        END = latest_time.other_user
        AND m.createdAt = latest_time.max_time
      )
      INNER JOIN messages latest ON (
        latest.createdAt = latest_time.max_time
        AND (
          (latest.fromUserId = ${user.id} AND latest.toUserId = latest_time.other_user) OR
          (latest.toUserId = ${user.id} AND latest.fromUserId = latest_time.other_user)
        )
      )
      LEFT JOIN (
        SELECT 
          fromUserId,
          COUNT(*) as count
        FROM messages
        WHERE toUserId = ${user.id} AND isRead = false
        GROUP BY fromUserId
      ) unread ON unread.fromUserId = (
        CASE 
          WHEN m.fromUserId = ${user.id} THEN m.toUserId
          ELSE m.fromUserId
        END
      )
      WHERE m.fromUserId = ${user.id} OR m.toUserId = ${user.id}
      ORDER BY latest.createdAt DESC
    `;

    // Transform the raw query result
    const formattedConversations = conversations.map(conv => ({
      id: conv.conversation_id,
      participant: {
        id: conv.participant_id,
        firstName: conv.participant_firstName,
        lastName: conv.participant_lastName,
        email: conv.participant_email,
        role: conv.participant_role
      },
      lastMessage: {
        content: conv.last_message_content,
        createdAt: conv.last_message_time
      },
      unreadCount: Number(conv.unread_count)
    }));

    return NextResponse.json({
      success: true,
      conversations: formattedConversations
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    if (error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Get conversations error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
