// /app/api/protected/admin/messages/conversations/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);
    const userId = user.id;

    // Find headadmin user
    const headAdmin = await prisma.user.findFirst({
      where: { role: 'headadmin' }
    });

    // For admin: show conversation with headadmin
    // For headadmin: show all admin conversations
    let conversations = [];

    if (user.role === 'admin' && headAdmin) {
      // Only one conversation: admin <-> headadmin
      const lastMessage = await prisma.message.findFirst({
        where: {
          OR: [
            { fromUserId: userId, toUserId: headAdmin.id },
            { fromUserId: headAdmin.id, toUserId: userId }
          ]
        },
        orderBy: { createdAt: 'desc' }
      });

      const unreadCount = await prisma.message.count({
        where: {
          fromUserId: headAdmin.id,
          toUserId: userId,
          isRead: false
        }
      });

      conversations = [{
        id: headAdmin.id,
        participant: {
          id: headAdmin.id,
          firstName: headAdmin.firstName,
          lastName: headAdmin.lastName,
          email: headAdmin.email,
          role: headAdmin.role
        },
        lastMessage: lastMessage
          ? { content: lastMessage.content, createdAt: lastMessage.createdAt }
          : null,
        unreadCount
      }];
    } else if (user.role === 'headadmin') {
      // Show all admins
      const admins = await prisma.user.findMany({
        where: { role: 'admin' }
      });

      conversations = await Promise.all(
        admins.map(async (admin) => {
          const lastMessage = await prisma.message.findFirst({
            where: {
              OR: [
                { fromUserId: userId, toUserId: admin.id },
                { fromUserId: admin.id, toUserId: userId }
              ]
            },
            orderBy: { createdAt: 'desc' }
          });

          const unreadCount = await prisma.message.count({
            where: {
              fromUserId: admin.id,
              toUserId: userId,
              isRead: false
            }
          });

          return {
            id: admin.id,
            participant: {
              id: admin.id,
              firstName: admin.firstName,
              lastName: admin.lastName,
              email: admin.email,
              role: admin.role
            },
            lastMessage: lastMessage
              ? { content: lastMessage.content, createdAt: lastMessage.createdAt }
              : null,
            unreadCount
          };
        })
      );
    }

    return NextResponse.json({
      success: true,
      conversations
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
