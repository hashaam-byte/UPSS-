import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['student']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const studentProfile = await prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { className: true }
    });

    if (!studentProfile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const teachers = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true,
        OR: [
          { teacherProfile: { coordinatorClass: studentProfile.className } },
          { teacherProfile: { coordinatorClass: { not: null } } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        teacherProfile: {
          select: {
            coordinatorClass: true,
            department: true,
            teacherSubjects: {
              select: {
                subject: { select: { name: true, code: true } }
              }
            }
          }
        }
      }
    });

    interface TeacherSubject {
      subject: {
        name: string;
        code: string;
      };
    }

    interface TeacherProfile {
      coordinatorClass: string | null;
      department: string | null;
      teacherSubjects: TeacherSubject[];
    }

    interface Teacher {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      teacherProfile: TeacherProfile | null;
    }

    interface Message {
      id: string;
      fromUserId: string;
      toUserId: string;
      content: string;
      createdAt: Date;
      isRead: boolean;
      // add other fields as needed
    }

    interface ConversationWithMessages {
      id: string;
      participant: Teacher;
      lastMessage: Message | null;
      unreadCount: number;
    }

    const conversationsWithMessages: ConversationWithMessages[] = await Promise.all(
      teachers.map(async (teacher: Teacher): Promise<ConversationWithMessages> => {
        const lastMessage: Message | null = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: user.id, toUserId: teacher.id },
              { fromUserId: teacher.id, toUserId: user.id }
            ]
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount: number = await prisma.message.count({
          where: {
            fromUserId: teacher.id,
            toUserId: user.id,
            isRead: false
          }
        });

        return {
          id: teacher.id,
          participant: teacher,
          lastMessage,
          unreadCount
        };
      })
    );

    const sortedConversations = conversationsWithMessages.sort((a, b) => {
      const timeA = a.lastMessage?.createdAt?.getTime() || 0;
      const timeB = b.lastMessage?.createdAt?.getTime() || 0;
      return timeB - timeA;
    });

    return NextResponse.json({ 
      success: true, 
      conversations: sortedConversations,
      allTeachers: teachers 
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}
