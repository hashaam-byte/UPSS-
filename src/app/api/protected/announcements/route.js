// /api/protected/announcements
// Shared "my announcements" feed for any logged-in role (student, parent,
// teacher, admin). Filters to published, non-expired announcements that
// actually target this user's audience/class/role.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function roleToAudienceKey(role, department) {
  if (role === 'STUDENT') return 'students';
  if (role === 'TEACHER') return 'teachers';
  if (role === 'PARENT') return 'parents';
  if (role === 'ADMIN') return 'admins';
  return null;
}

export async function GET(request) {
  try {
    const user = await requireAuth([]); // any authenticated role
    const now = new Date();

    let className = null;
    if (user.role === 'STUDENT') {
      const profile = await prisma.studentProfile.findUnique({
        where: { userId: user.id },
        select: { className: true }
      });
      className = profile?.className || null;
    }

    const audienceKey = roleToAudienceKey(user.role, user.department);

    const announcements = await prisma.announcement.findMany({
      where: {
        status: 'published',
        AND: [
          { OR: [{ schoolId: user.schoolId }, { schoolId: null }] }, // school-specific or platform-wide
          { OR: [{ expiresAt: null }, { expiresAt: { gte: now } }] },
          { OR: [{ publishAt: null }, { publishAt: { lte: now } }] },
          {
            OR: [
              { targetAudience: { has: 'all' } },
              ...(audienceKey ? [{ targetAudience: { has: audienceKey } }] : []),
            ],
          },
        ],
      },
      orderBy: [{ isPinned: 'desc' }, { isUrgent: 'desc' }, { createdAt: 'desc' }],
      include: {
        creator: { select: { firstName: true, lastName: true } }
      },
      take: 50,
    });

    // Post-filter class targeting in JS (Prisma can't easily combine the
    // conditional array-contains check above without duplicating the OR block)
    const filtered = announcements.filter(a => {
      if (!className) return true; // non-students aren't class-restricted
      if (!a.targetClasses || a.targetClasses.length === 0) return true;
      return a.targetClasses.includes(className);
    });

    return NextResponse.json({
      success: true,
      data: filtered.map(a => ({
        id: a.id,
        title: a.title,
        content: a.content,
        summary: a.summary,
        isPinned: a.isPinned,
        isUrgent: a.isUrgent,
        createdAt: a.createdAt,
        author: a.creator ? `${a.creator.firstName} ${a.creator.lastName}` : 'School Admin',
      }))
    });

  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Announcements feed error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
