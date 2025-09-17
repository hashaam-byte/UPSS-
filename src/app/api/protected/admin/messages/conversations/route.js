// /app/api/protected/admin/messages/conversations/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);
    const userId = user.id;

    // Use correct column names as per Prisma schema (snake_case)
    const conversations = await prisma.$queryRawUnsafe`
      SELECT DISTINCT
        m.id as conversation_id,
        CASE
          WHEN m."from_user_id" = ${userId} THEN m."to_user_id"
          ELSE m."from_user_id"
        END as participant_id,
        u."first_name" as participant_firstName,
        u."last_name" as participant_lastName,
        u.email as participant_email,
        u.role as participant_role,
        latest.content as last_message_content,
        latest."created_at" as last_message_time,
        COALESCE(unread.count, 0) as unread_count
      FROM messages m
      INNER JOIN users u ON (
        CASE
          WHEN m."from_user_id" = ${userId} THEN m."to_user_id"
          ELSE m."from_user_id"
        END = u.id
      )
      INNER JOIN (
        SELECT
          CASE
            WHEN "from_user_id" = ${userId} THEN "to_user_id"
            ELSE "from_user_id"
          END as other_user,
          MAX("created_at") as max_time
        FROM messages
        WHERE "from_user_id" = ${userId} OR "to_user_id" = ${userId}
        GROUP BY other_user
      ) latest_time ON (
        CASE
          WHEN m."from_user_id" = ${userId} THEN m."to_user_id"
          ELSE m."from_user_id"
        END = latest_time.other_user
        AND m."created_at" = latest_time.max_time
      )
      INNER JOIN messages latest ON (
        latest."created_at" = latest_time.max_time
        AND (
          (latest."from_user_id" = ${userId} AND latest."to_user_id" = latest_time.other_user) OR
          (latest."to_user_id" = ${userId} AND latest."from_user_id" = latest_time.other_user)
        )
      )
      LEFT JOIN (
        SELECT
          "from_user_id",
          COUNT(*) as count
        FROM messages
        WHERE "to_user_id" = ${userId} AND "is_read" = false
        GROUP BY "from_user_id"
      ) unread ON unread."from_user_id" = (
        CASE
          WHEN m."from_user_id" = ${userId} THEN m."to_user_id"
          ELSE m."from_user_id"
        END
      )
      WHERE m."from_user_id" = ${userId} OR m."to_user_id" = ${userId}
      ORDER BY latest."created_at" DESC
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
