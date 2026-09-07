// /api/protected/admin/announcements
// Admin creates/lists announcements for their school. HEADADMIN can also
// create platform-wide ones (schoolId: null) via the same route.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['ADMIN', 'HEADADMIN']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const announcements = await prisma.announcement.findMany({
      where: {
        ...(user.role === 'ADMIN' ? { schoolId: user.schoolId } : {}),
        ...(status && { status }),
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        creator: { select: { firstName: true, lastName: true } }
      }
    });

    return NextResponse.json({ success: true, data: announcements });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Announcements list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['ADMIN', 'HEADADMIN']);
    const body = await request.json();
    const {
      title, content, summary,
      targetAudience = ['all'],
      targetClasses = [],
      targetRoles = [],
      publishAt,
      expiresAt,
      isPinned = false,
      isUrgent = false,
      allowComments = false,
      sendNotification = true,
      status = 'published',
      schoolWide, // HEADADMIN only: true = platform-wide, false/undefined = their own school (N/A, headadmin has none)
    } = body;

    if (!title || !content) {
      return NextResponse.json({ error: 'title and content are required' }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        schoolId: user.role === 'HEADADMIN' ? (schoolWide ? null : user.schoolId) : user.schoolId,
        createdBy: user.id,
        title,
        content,
        summary: summary || content.slice(0, 200),
        targetAudience,
        targetClasses,
        targetRoles,
        publishAt: publishAt ? new Date(publishAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isPinned,
        isUrgent,
        allowComments,
        sendNotification,
        status,
      }
    });

    // Fire in-app notifications to the targeted audience, best-effort
    if (sendNotification && status === 'published') {
      const whereClause = {
        ...(announcement.schoolId ? { schoolId: announcement.schoolId } : {}),
        isActive: true,
        ...(targetRoles.length > 0 && !targetRoles.includes('all')
          ? { role: { in: targetRoles.map(r => r.toUpperCase()) } }
          : {}),
      };

      const recipients = await prisma.user.findMany({ where: whereClause, select: { id: true } });

      if (recipients.length > 0) {
        await prisma.notification.createMany({
          data: recipients.map(r => ({
            userId: r.id,
            schoolId: announcement.schoolId,
            title: isUrgent ? `URGENT: ${title}` : title,
            content: summary || content.slice(0, 200),
            type: isUrgent ? 'warning' : 'info',
            priority: isUrgent ? 'high' : 'normal',
          }))
        });
      }
    }

    return NextResponse.json({ success: true, data: announcement }, { status: 201 });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Announcement create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
