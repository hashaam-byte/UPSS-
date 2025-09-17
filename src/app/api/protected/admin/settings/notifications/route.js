import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const keys = [
  'emailNotifications',
  'newUserRegistration',
  'paymentAlerts',
  'systemUpdates',
  'weeklyReports'
];

export async function GET() {
  try {
    await requireAuth(['admin']);
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    });
    const result = {};
    keys.forEach(key => {
      result[key] = settings.find(s => s.key === key)?.value === 'true';
    });
    return NextResponse.json({ settings: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch notification settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['admin']);
    const data = await request.json();
    await Promise.all(keys.map(key =>
      prisma.systemSetting.upsert({
        where: { key },
        update: { value: String(data[key]) },
        create: { key, value: String(data[key]), updatedBy: user.id }
      })
    ));
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update notification settings' }, { status: 500 });
  }
}
