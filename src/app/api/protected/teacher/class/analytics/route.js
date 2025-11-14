// /app/api/protected/teacher/class/notifications/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch notifications for class teacher
export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const isRead = searchParams.get('read');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build where conditions
    let whereConditions = {
      userId: user.id,
      schoolId: user.schoolId
    };

    if (type !== 'all') {
      whereConditions.type = type;
    }

    if (isRead !== null) {
      whereConditions.isRead = isRead === 'true';
    }

    if (priority) {
      whereConditions.priority = priority;
    }

    // Get notifications
    const notifications = await prisma.notification.findMany({
      where: whereConditions,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    const totalNotifications = await prisma.notification.count({
      where: whereConditions
    });

    // Get unread counts by type
    const unreadCounts = await prisma.notification.groupBy({
      by: ['type'],
      where: {
        userId: user.id,
        schoolId: user.schoolId,
        isRead: false
      },
      _count: {
        _all: true
      }
    });

    const unreadCountsMap = unreadCounts.reduce((acc, item) => {
      acc[item.type] = item._count._all;
      return acc;
    }, {});

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    return NextResponse.json({
      success: true,
      data: {
        notifications: notifications.map(notification => ({
          id: notification.id,
          title: notification.title,
          content: notification.content,
          type: notification.type,
          priority: notification.priority,
          isRead: notification.isRead,
          readAt: notification.readAt,
          actionUrl: notification.actionUrl,
          actionText: notification.actionText,
          createdAt: notification.createdAt
        })),
        pagination: {
          total: totalNotifications,
          page: page,
          limit: limit,
          pages: Math.ceil(totalNotifications / limit)
        },
        summary: {
          totalNotifications,
          unreadTotal: Object.values(unreadCountsMap).reduce((sum, count) => sum + count, 0),
          unreadByType: {
            info: unreadCountsMap.info || 0,
            warning: unreadCountsMap.warning || 0,
            error: unreadCountsMap.error || 0,
            success: unreadCountsMap.success || 0,
            system: unreadCountsMap.system || 0
          },
          highPriorityUnread: await prisma.notification.count({
            where: {
              userId: user.id,
              schoolId: user.schoolId,
              isRead: false,
              priority: 'high'
            }
          })
        },
        assignedClasses: assignedClasses,
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`
        }
      }
    });

  } catch (error) {
    console.error('Class teacher notifications GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create notification (for student alerts, etc.)
export async function POST(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { targetUserId, title, content, type = 'info', priority = 'normal', actionUrl, actionText } = body;

    if (!targetUserId || !title || !content) {
      return NextResponse.json({
        error: 'Target user ID, title, and content are required'
      }, { status: 400 });
    }

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    // Verify target user (student) belongs to teacher's class
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        schoolId: user.schoolId,
        OR: [
          {
            role: 'student',
            studentProfile: {
              className: {
                in: assignedClasses
              }
            }
          },
          { role: 'admin' },
          { role: 'headadmin' }
        ]
      }
    });

    if (!targetUser) {
      return NextResponse.json({
        error: 'Target user not found or access denied'
      }, { status: 404 });
    }

    // Create notification
    const notification = await prisma.notification.create({
      data: {
        userId: targetUserId,
        schoolId: user.schoolId,
        title: title,
        content: content,
        type: type,
        priority: priority,
        actionUrl: actionUrl || null,
        actionText: actionText || null,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Notification created successfully',
      data: {
        notificationId: notification.id,
        targetUser: {
          id: targetUser.id,
          name: `${targetUser.firstName} ${targetUser.lastName}`,
          role: targetUser.role
        },
        createdAt: notification.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update notification (mark as read/unread)
export async function PATCH(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { notificationId, notificationIds, action } = body;

    if (!action) {
      return NextResponse.json({
        error: 'Action is required'
      }, { status: 400 });
    }

    let updateData = {};
    let whereCondition = {
      schoolId: user.schoolId,
      userId: user.id
    };

    // Handle bulk operations
    if (notificationIds && Array.isArray(notificationIds)) {
      whereCondition.id = { in: notificationIds };
    } else if (notificationId) {
      whereCondition.id = notificationId;
    } else {
      return NextResponse.json({
        error: 'Notification ID or IDs are required'
      }, { status: 400 });
    }

    switch (action) {
      case 'mark_read':
        updateData = {
          isRead: true,
          readAt: new Date()
        };
        break;
      case 'mark_unread':
        updateData = {
          isRead: false,
          readAt: null
        };
        break;
      case 'mark_all_read':
        whereCondition = {
          schoolId: user.schoolId,
          userId: user.id,
          isRead: false
        };
        updateData = {
          isRead: true,
          readAt: new Date()
        };
        break;
      default:
        return NextResponse.json({
          error: 'Invalid action. Use: mark_read, mark_unread, or mark_all_read'
        }, { status: 400 });
    }

    const result = await prisma.notification.updateMany({
      where: whereCondition,
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notification(s) updated successfully`,
      data: {
        updatedCount: result.count,
        action: action
      }
    });

  } catch (error) {
    console.error('Update notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete notifications
export async function DELETE(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const notificationId = searchParams.get('id');
    const deleteType = searchParams.get('type') || 'single';

    let whereCondition = {
      schoolId: user.schoolId,
      userId: user.id
    };

    if (deleteType === 'single' && notificationId) {
      whereCondition.id = notificationId;
    } else if (deleteType === 'read') {
      whereCondition.isRead = true;
    } else if (deleteType === 'all') {
      // Already has the base condition
    } else if (deleteType === 'single' && !notificationId) {
      return NextResponse.json({
        error: 'Notification ID is required for single deletion'
      }, { status: 400 });
    }

    const result = await prisma.notification.deleteMany({
      where: whereCondition
    });

    return NextResponse.json({
      success: true,
      message: `${result.count} notification(s) deleted successfully`,
      data: {
        deletedCount: result.count,
        deleteType: deleteType
      }
    });

  } catch (error) {
    console.error('Delete notifications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}