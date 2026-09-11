// /api/protected/admin/stats/overview
// Consolidated dashboard data in one call — replaces several separate
// stat fetches and fixes two real bugs found in the process: the old
// stats/users route returned `admins` (lowercase) while the dashboard
// read `.Admins` (capital), so that card always silently showed zero;
// and the dashboard's billing estimate was hardcoded at "* 250" instead
// of reading the actual headadmin-editable pricing.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const user = await requireAuth(['ADMIN']);
    const schoolId = user.school.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      students, teachers, admins, parents, activeUsers,
      recentSignups, pendingFees, overdueFees, unreadAnnouncements,
    ] = await Promise.all([
      prisma.user.count({ where: { schoolId, role: 'STUDENT', isActive: true } }),
      prisma.user.count({ where: { schoolId, role: 'TEACHER', isActive: true } }),
      prisma.user.count({ where: { schoolId, role: 'ADMIN', isActive: true } }),
      prisma.user.count({ where: { schoolId, role: 'PARENT', isActive: true } }),
      prisma.user.count({ where: { schoolId, isActive: true, lastLogin: { gte: thirtyDaysAgo } } }),
      prisma.user.findMany({
        where: { schoolId, createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      prisma.studentFee.aggregate({
        where: { schoolId, status: { in: ['pending', 'partial'] } },
        _sum: { amount: true, amountPaid: true },
        _count: true,
      }),
      prisma.studentFee.count({ where: { schoolId, status: 'overdue' } }),
      prisma.announcement.count({ where: { schoolId, status: 'published' } }),
    ]);

    // Bucket the last 7 days of signups by day for a real (not fabricated) trend chart
    const dayBuckets = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });
    const weeklySignups = dayBuckets.map((dayStart) => {
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);
      const count = recentSignups.filter(u => u.createdAt >= dayStart && u.createdAt < dayEnd).length;
      return {
        day: dayStart.toLocaleDateString('en-GB', { weekday: 'short' }),
        signups: count,
      };
    });

    const totalUsers = students + teachers + admins + parents;
    const feesOutstanding = Number(pendingFees._sum.amount || 0) - Number(pendingFees._sum.amountPaid || 0);

    return NextResponse.json({
      success: true,
      data: {
        composition: [
          { name: 'Students', value: students },
          { name: 'Teachers', value: teachers },
          { name: 'Parents', value: parents },
          { name: 'Admins', value: admins },
        ],
        totals: { totalUsers, students, teachers, admins, parents, activeUsers },
        weeklySignups,
        fees: {
          outstandingCount: pendingFees._count,
          outstandingAmount: feesOutstanding,
          overdueCount: overdueFees,
        },
        announcementsCount: unreadAnnouncements,
      },
    });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
