import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['teacher']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      select: { coordinatorClass: true }
    });

    const isDirectorOrCoordinator = !!teacherProfile?.coordinatorClass;

    let contacts = [];

    if (isDirectorOrCoordinator) {
      contacts = await prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: { in: ['admin', 'teacher'] },
          isActive: true,
          id: { not: user.id }
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          teacherProfile: { select: { coordinatorClass: true } }
        }
      });
    } else {
      const teachers = await prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: { in: ['admin', 'teacher'] },
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          teacherProfile: { select: { coordinatorClass: true } }
        }
      });

      const students = await prisma.user.findMany({
        where: {
          schoolId: user.schoolId,
          role: 'student',
          isActive: true
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          studentProfile: { select: { className: true } }
        }
      });

      contacts = [...teachers, ...students];
    }

    interface ContactBase {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    }

    interface TeacherContact extends ContactBase {
      teacherProfile: {
        coordinatorClass: string | null;
      } | null;
    }

    interface StudentContact extends ContactBase {
      studentProfile: {
        className: string | null;
      } | null;
    }

    type Contact = TeacherContact | StudentContact;

    interface ConversationWithMessages {
      id: string;
      participant: Contact;
      lastMessage: {
        id: string;
        fromUserId: string;
        toUserId: string;
        content: string;
        createdAt: Date;
        isRead: boolean;
      } | null;
      unreadCount: number;
    }

    const conversationsWithMessages: ConversationWithMessages[] = await Promise.all(
      contacts.map(async (contact: Contact): Promise<ConversationWithMessages> => {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: user.id, toUserId: contact.id },
              { fromUserId: contact.id, toUserId: user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: contact.id,
            toUserId: user.id,
            isRead: false
          }
        });

        return {
          id: contact.id,
          participant: contact,
          lastMessage,
          unreadCount
        };
      })
    );

    const sortedConversations = conversationsWithMessages
      .filter(c => c.lastMessage !== null)
      .sort((a, b) => {
        const timeA = a.lastMessage?.createdAt?.getTime() || 0;
        const timeB = b.lastMessage?.createdAt?.getTime() || 0;
        return timeB - timeA;
      });

    return NextResponse.json({ 
      success: true, 
      conversations: sortedConversations,
      allContacts: contacts 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
