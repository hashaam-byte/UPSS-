// /app/api/protected/headadmin/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(request);
    
    if (decoded.role !== 'headadmin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all school admins for conversations
    const schoolAdmins = await prisma.user.findMany({
      where: {
        role: 'admin',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Get conversation data for each admin
    const conversations = await Promise.all(
      schoolAdmins.map(async (admin) => {
        const [lastMessage, unreadCount] = await Promise.all([
          prisma.message.findFirst({
            where: {
              schoolId: admin.schoolId,
              OR: [
                { fromUserId: null, toUserId: admin.id }, // From head admin
                { fromUserId: admin.id, toUserId: null }  // To head admin
              ]
            },
            orderBy: { createdAt: 'desc' },
            select: { id: true, content: true, createdAt: true, fromUserId: true }
          }),
          prisma.message.count({
            where: {
              schoolId: admin.schoolId,
              fromUserId: admin.id,
              toUserId: null,
              isRead: false
            }
          })
        ]);

        return {
          id: `${admin.schoolId}-${admin.id}`,
          schoolId: admin.schoolId,
          userId: admin.id,
          school: admin.school,
          user: {
            id: admin.id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email
          },
          lastMessage,
          unreadCount
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
