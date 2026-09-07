// /api/cron/subscription-check
// Meant to be called once a day by an external scheduler (Vercel Cron —
// see vercel.json — or any cron service) with a bearer token matching
// CRON_SECRET. Vercel Cron invokes via GET by default and automatically
// attaches the Authorization header once CRON_SECRET is set as an env
// var in the project — see the README for setup. Not user-authenticated,
// since no logged-in user triggers this.
//
// For every school:
//   - 7 days or less until subscriptionExpiresAt, no warning sent yet   -> send 1-week warning
//   - 2 days or less until subscriptionExpiresAt, no final warning yet  -> send final warning
//     ("failure to pay will suspend your school and all accounts")
//   - subscriptionExpiresAt has passed and the school is still active  -> auto-suspend
//
// Warning flags reset to null whenever the subscription is renewed —
// see extend-trial and payment-schedule routes.
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';
import { sendSms } from '@/lib/sms';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(date) {
  return Math.ceil((new Date(date).getTime() - Date.now()) / MS_PER_DAY);
}

async function notifyAdmins(school, { title, message, isUrgent = false }) {
  const admins = await prisma.user.findMany({
    where: { schoolId: school.id, role: 'ADMIN', isActive: true },
    select: { id: true, email: true, phone: true, firstName: true },
  });

  if (admins.length === 0) return;

  await prisma.notification.createMany({
    data: admins.map(a => ({
      userId: a.id,
      schoolId: school.id,
      title,
      content: message,
      type: isUrgent ? 'warning' : 'info',
      priority: isUrgent ? 'high' : 'normal',
    })),
  });

  await Promise.all(admins.map(async (a) => {
    if (a.email) {
      await sendEmail({
        to: a.email,
        subject: title,
        html: `<p>Hi ${a.firstName},</p><p>${message}</p>`,
      }).catch(() => {}); // best-effort — don't let one failed email break the run
    }
    if (a.phone) {
      await sendSms(a.phone, `${title}: ${message}`).catch(() => {});
    }
  }));
}

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        subscriptionExpiresAt: true,
        oneWeekWarningSentAt: true,
        finalWarningSentAt: true,
      },
    });

    const results = { warned: 0, finalWarned: 0, suspended: 0, checked: schools.length };

    for (const school of schools) {
      const days = daysUntil(school.subscriptionExpiresAt);

      // Deadline has passed — suspend
      if (days <= 0) {
        await prisma.school.update({
          where: { id: school.id },
          data: { isActive: false, subscriptionIsActive: false },
        });
        await notifyAdmins(school, {
          title: `${school.name} has been suspended`,
          message: `Your subscription payment deadline has passed and your school account, including the "${school.slug}" login page, has now been suspended. All staff, student, and parent accounts are temporarily inaccessible. Please contact U-Plus to restore access.`,
          isUrgent: true,
        });
        results.suspended++;
        continue;
      }

      // 2 days or less — final warning (only once per cycle)
      if (days <= 2 && !school.finalWarningSentAt) {
        await notifyAdmins(school, {
          title: `Final notice: ${school.name}'s subscription expires in ${days} day(s)`,
          message: `This is a final warning: your subscription payment is due in ${days} day(s). If payment is not received by the deadline, your school account — including the "${school.slug}" login page — and all associated staff, student, and parent accounts will be suspended.`,
          isUrgent: true,
        });
        await prisma.school.update({
          where: { id: school.id },
          data: { finalWarningSentAt: new Date() },
        });
        results.finalWarned++;
        continue;
      }

      // 7 days or less — first warning (only once per cycle)
      if (days <= 7 && !school.oneWeekWarningSentAt) {
        await notifyAdmins(school, {
          title: `${school.name}'s subscription renews in ${days} day(s)`,
          message: `Your next subscription payment is due in ${days} day(s). Please make payment before the deadline to avoid any interruption to your school's access.`,
          isUrgent: false,
        });
        await prisma.school.update({
          where: { id: school.id },
          data: { oneWeekWarningSentAt: new Date() },
        });
        results.warned++;
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('Subscription check cron error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
