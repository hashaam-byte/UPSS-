import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const keys = [
  'passwordMinLength',
  'requireStrongPassword',
  'enableTwoFactor',
  'sessionTimeout',
  'allowMultipleSessions'
];

export async function GET() {
  try {
    await requireAuth(['admin']);
    const settings = await prisma.systemSetting.findMany({
      where: { key: { in: keys } }
    });
    const result = {
      passwordMinLength: Number(settings.find(s => s.key === 'passwordMinLength')?.value ?? 8),
      requireStrongPassword: settings.find(s => s.key === 'requireStrongPassword')?.value === 'true',
      enableTwoFactor: settings.find(s => s.key === 'enableTwoFactor')?.value === 'true',
      sessionTimeout: Number(settings.find(s => s.key === 'sessionTimeout')?.value ?? 24),
      allowMultipleSessions: settings.find(s => s.key === 'allowMultipleSessions')?.value !== 'false'
    };
    return NextResponse.json({ settings: result });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch security settings' }, { status: 500 });
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
    return NextResponse.json({ error: 'Failed to update security settings' }, { status: 500 });
  }
}
