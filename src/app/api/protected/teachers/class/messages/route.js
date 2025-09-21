// /app/api/protected/teacher/class/messages/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify class teacher access
async function verifyClassTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch messages for class teacher
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all'; // 'all', 'sent', 'received', 'parents', 'students'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    // Get students in assigned classes (for parent contacts)
    const students = await prisma.user.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: classNames
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    // Build message query conditions
    let whereConditions = {
      schoolId: classTeacher.schoolId,
      OR: [
        { fromUserId: classTeacher.id },
        { toUserId: classTeacher.id }
      ]
    };

    // Filter by type
    switch (type) {
      case 'sent':
        whereConditions = {
          schoolId: classTeacher.schoolId,
          fromUserId: classTeacher.id
        };
        break;
      case 'received':
        whereConditions = {
          schoolId: classTeacher.schoolId,
          toUserId: classTeacher.id
        };
        break;
      case 'students':
        const studentIds = students.map(s => s.id);
        whereConditions = {
          schoolId: classTeacher.schoolId,
          OR: [
            { fromUserId: classTeacher.id, toUserId: { in: studentIds } },
            { fromUserId: { in: studentIds }, toUserId: classTeacher.id }
          ]
        };
        break;
      case 'admin':
        whereConditions = {
          schoolId: classTeacher.schoolId,
          OR: [
            { 
              fromUserId: classTeacher.id,
              toUser: { role: { in: ['admin', 'headadmin'] } }
            },
            { 
              toUserId: classTeacher.id,
              fromUser: { role: { in: ['admin', 'headadmin'] } }
            }
          ]
        };
        break;
    }

    // Add search filter
    if (search) {
      whereConditions.OR = [
        ...(whereConditions.OR || []),
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Get total count
    const totalMessages = await prisma.message.count({
      where: whereConditions
    });

    // Get paginated messages
    const messages = await prisma.message.findMany({
      where: whereConditions,
      include: {
        fromUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            studentProfile: {
              select: {
                studentId: true,
                className: true
              }
            }
          }
        },
        toUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
            role: true,
            studentProfile: {
              select: {
                studentId: true,
                className: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip: (page - 1) * limit,
      take: limit
    });

    // Format messages
    const formattedMessages = messages.map(message => ({
      id: message.id,
      subject: message.subject,
      content: message.content,
      messageType: message.messageType,
      priority: message.priority,
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      isSent: message.fromUserId === classTeacher.id,
      from: message.fromUser ? {
        id: message.fromUser.id,
        name: `${message.fromUser.firstName} ${message.fromUser.lastName}`,
        email: message.fromUser.email,
        avatar: message.fromUser.avatar,
        role: message.fromUser.role,
        studentInfo: message.fromUser.studentProfile
      } : null,
      to: message.toUser ? {
        id: message.toUser.id,
        name: `${message.toUser.firstName} ${message.toUser.lastName}`,
        email: message.toUser.email,
        avatar: message.toUser.avatar,
        role: message.toUser.role,
        studentInfo: message.toUser.studentProfile
      } : null
    }));

    // Get contact lists for compose functionality
    const contacts = {
      students: students.map(student => ({
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        avatar: student.avatar,
        role: 'student',
        className: student.studentProfile?.className,
        studentId: student.studentProfile?.studentId,
        parentName: student.studentProfile?.parentName,
        parentPhone: student.studentProfile?.parentPhone,
        parentEmail: student.studentProfile?.parentEmail
      })),
      admins: [] // TODO: Get school admins if needed
    };

    return NextResponse.json({
      success: true,
      data: {
        messages: formattedMessages,
        contacts: contacts,
        pagination: {
          total: totalMessages,
          page: page,
          limit: limit,
          pages: Math.ceil(totalMessages / limit)
        },
        assignedClasses: classNames,
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher messages error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Send new message
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { recipientId, subject, content, messageType = 'direct', priority = 'normal', isParentMessage = false } = body;

    if (!recipientId || !content) {
      return NextResponse.json({
        error: 'Recipient ID and content are required'
      }, { status: 400 });
    }

    // Get assigned classes for validation
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    // Verify recipient exists and is accessible
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      include: {
        studentProfile: true
      }
    });

    if (!recipient) {
      return NextResponse.json({
        error: 'Recipient not found'
      }, { status: 404 });
    }

    // Validate access to recipient
    if (recipient.role === 'student') {
      const studentClass = recipient.studentProfile?.className;
      if (assignedClass && studentClass !== assignedClass) {
        return NextResponse.json({
          error: 'You can only message students in your assigned class'
        }, { status: 403 });
      }
    } else if (recipient.role === 'teacher') {
      // Allow messaging other teachers in the same school
      if (recipient.schoolId !== classTeacher.schoolId) {
        return NextResponse.json({
          error: 'You can only message users in your school'
        }, { status: 403 });
      }
    } else if (recipient.role === 'admin') {
      // Allow messaging school admins
      if (recipient.schoolId !== classTeacher.schoolId) {
        return NextResponse.json({
          error: 'You can only message admins in your school'
        }, { status: 403 });
      }
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        fromUserId: classTeacher.id,
        toUserId: recipientId,
        schoolId: classTeacher.schoolId,
        subject: subject || 'Message from Class Teacher',
        content: content,
        messageType: messageType,
        priority: priority,
        isRead: false
      }
    });

    // Create notification for recipient
    await prisma.notification.create({
      data: {
        userId: recipientId,
        schoolId: classTeacher.schoolId,
        title: `New message from ${classTeacher.firstName} ${classTeacher.lastName}`,
        content: subject || 'You have received a new message',
        type: 'info',
        priority: priority,
        isRead: false
      }
    });

    // TODO: If parent message, you might want to send SMS/Email notification
    // if (isParentMessage && recipient.studentProfile?.parentEmail) {
    //   await sendParentNotification(recipient.studentProfile.parentEmail, content);
    // }

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: {
        messageId: message.id,
        sentAt: message.createdAt
      }
    });

  } catch (error) {
    console.error('Send message error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Mark message as read
export async function PATCH(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { messageId, action } = body;

    if (!messageId || !action) {
      return NextResponse.json({
        error: 'Message ID and action are required'
      }, { status: 400 });
    }

    // Verify the message belongs to this teacher
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        schoolId: classTeacher.schoolId,
        OR: [
          { fromUserId: classTeacher.id },
          { toUserId: classTeacher.id }
        ]
      }
    });

    if (!message) {
      return NextResponse.json({
        error: 'Message not found'
      }, { status: 404 });
    }

    let updateData = {};

    switch (action) {
      case 'mark_read':
        if (message.toUserId === classTeacher.id) {
          updateData = {
            isRead: true,
            readAt: new Date()
          };
        }
        break;
      case 'mark_unread':
        if (message.toUserId === classTeacher.id) {
          updateData = {
            isRead: false,
            readAt: null
          };
        }
        break;
      case 'archive':
        updateData = {
          isArchived: true
        };
        break;
      default:
        return NextResponse.json({
          error: 'Invalid action'
        }, { status: 400 });
    }

    if (Object.keys(updateData).length > 0) {
      await prisma.message.update({
        where: { id: messageId },
        data: updateData
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Message updated successfully'
    });

  } catch (error) {
    console.error('Update message error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}