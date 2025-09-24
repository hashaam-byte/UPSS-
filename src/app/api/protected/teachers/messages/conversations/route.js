// /app/api/protected/teachers/messages/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyJWT } from '@/lib/auth';

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true }
    });

    // Get all conversations this teacher is part of
    const conversations = await prisma.message.groupBy({
      by: ['fromUserId', 'toUserId'],
      where: {
        OR: [
          { fromUserId: userId },
          { toUserId: userId }
        ],
        schoolId: userSchool.schoolId
      },
      _max: {
        createdAt: true,
        id: true
      }
    });

    // Get unique participant IDs
    const participantIds = new Set();
    conversations.forEach(conv => {
      if (conv.fromUserId && conv.fromUserId !== userId) participantIds.add(conv.fromUserId);
      if (conv.toUserId && conv.toUserId !== userId) participantIds.add(conv.toUserId);
    });

    const enrichedConversations = [];

    // Process each participant
    for (const participantId of participantIds) {
      let participant;
      
      if (participantId === null) {
        // Head admin conversation
        participant = {
          id: 'headadmin',
          firstName: 'Head',
          lastName: 'Administrator',
          role: 'headadmin'
        };
      } else {
        participant = await prisma.user.findUnique({
          where: { id: participantId },
          select: { id: true, firstName: true, lastName: true, role: true, email: true }
        });
      }

      if (participant) {
        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { fromUserId: userId, toUserId: participantId },
              { fromUserId: participantId, toUserId: userId }
            ],
            schoolId: userSchool.schoolId
          },
          orderBy: { createdAt: 'desc' }
        });

        const unreadCount = await prisma.message.count({
          where: {
            fromUserId: participantId,
            toUserId: userId,
            isRead: false,
            schoolId: userSchool.schoolId
          }
        });

        enrichedConversations.push({
          id: participantId || 'headadmin',
          participant,
          lastMessage,
          unreadCount
        });
      }
    }

    return NextResponse.json({ conversations: enrichedConversations });
  } catch (error) {
    console.error('Error fetching teacher conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/teachers/messages/[conversationId]/route.js
export async function GET(request, { params }) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const userId = decoded.userId;
    const conversationId = params.conversationId;

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let otherUserId = conversationId === 'headadmin' ? null : conversationId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: userId, toUserId: otherUserId },
          { fromUserId: otherUserId, toUserId: userId }
        ],
        schoolId: userSchool.schoolId
      },
      orderBy: { createdAt: 'asc' },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    // Add fromCurrentUser flag
    const processedMessages = messages.map(message => ({
      ...message,
      fromCurrentUser: message.fromUserId === userId
    }));

    return NextResponse.json({ messages: processedMessages });
  } catch (error) {
    console.error('Error fetching teacher messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/teachers/messages/send/route.js
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { conversationId, content, messageType = 'direct' } = await request.json();
    const userId = decoded.userId;

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });

    let toUserId = conversationId === 'headadmin' ? null : conversationId;

    const message = await prisma.message.create({
      data: {
        fromUserId: userId,
        toUserId,
        schoolId: userSchool.schoolId,
        content: content.trim(),
        messageType,
        priority: 'normal'
      },
      include: {
        fromUser: {
          select: { id: true, firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ message, success: true });
  } catch (error) {
    console.error('Error sending teacher message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/teachers/class/messages/route.js - For Class Teacher specific functionality
export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    if (decoded.role !== 'class_teacher') {
      return NextResponse.json({ error: 'Unauthorized - Class teacher only' }, { status: 403 });
    }

    const userId = decoded.userId;
    const userInfo = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true },
      include: {
        teacherProfile: {
          select: { coordinatorClass: true }
        }
      }
    });

    if (!userInfo.teacherProfile?.coordinatorClass) {
      return NextResponse.json({ error: 'No assigned class found' }, { status: 400 });
    }

    // Get all students in the class teacher's assigned class
    const classStudents = await prisma.user.findMany({
      where: {
        schoolId: userInfo.schoolId,
        role: 'student',
        studentProfile: {
          className: userInfo.teacherProfile.coordinatorClass
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        studentProfile: {
          select: { className: true, section: true }
        }
      }
    });

    // Get recent messages with these students
    const recentMessages = await prisma.message.findMany({
      where: {
        schoolId: userInfo.schoolId,
        OR: [
          { fromUserId: userId, toUserId: { in: classStudents.map(s => s.id) } },
          { fromUserId: { in: classStudents.map(s => s.id) }, toUserId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        fromUser: {
          select: { firstName: true, lastName: true }
        },
        toUser: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    return NextResponse.json({ 
      messages: recentMessages,
      classStudents,
      assignedClass: userInfo.teacherProfile.coordinatorClass
    });
  } catch (error) {
    console.error('Error fetching class teacher messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// /app/api/protected/teachers/broadcast/route.js - Teacher broadcast to students
export async function POST(request) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    const decoded = await verifyJWT(token);
    
    const teacherRoles = ['teacher', 'director', 'coordinator', 'class_teacher', 'subject_teacher'];
    if (!teacherRoles.includes(decoded.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { subject, content, targetStudents, targetClasses, priority = 'normal' } = await request.json();
    const userId = decoded.userId;

    if (!subject?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 });
    }

    const userSchool = await prisma.user.findUnique({
      where: { id: userId },
      select: { schoolId: true, role: true }
    });

    let targetUsers = [];

    if (targetStudents && targetStudents.length > 0) {
      // Specific students
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: userSchool.schoolId,
          role: 'student',
          id: { in: targetStudents }
        },
        select: { id: true }
      });
    } else if (targetClasses && targetClasses.length > 0) {
      // Students in specific classes
      targetUsers = await prisma.user.findMany({
        where: {
          schoolId: userSchool.schoolId,
          role: 'student',
          studentProfile: {
            className: { in: targetClasses }
          }
        },
        select: { id: true }
      });
    } else {
      return NextResponse.json({ error: 'Must specify target students or classes' }, { status: 400 });
    }

    // Create broadcast messages
    const messages = await Promise.all(
      targetUsers.map(user =>
        prisma.message.create({
          data: {
            fromUserId: userId,
            toUserId: user.id,
            schoolId: userSchool.schoolId,
            subject,
            content: content.trim(),
            messageType: 'broadcast',
            priority,
            isBroadcast: true
          }
        })
      )
    );

    return NextResponse.json({ messages, count: messages.length, success: true });
  } catch (error) {
    console.error('Error sending teacher broadcast:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}