// pages/api/protected/headadmin/settings/security.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionTimeout, maxLoginAttempts, passwordMinLength } = body;

    const settingsToUpdate = [
      { key: 'sessionTimeout', value: sessionTimeout?.toString(), dataType: 'number', category: 'security' },
      { key: 'maxLoginAttempts', value: maxLoginAttempts?.toString(), dataType: 'number', category: 'security' },
      { key: 'passwordMinLength', value: passwordMinLength?.toString(), dataType: 'number', category: 'security' }
    ].filter(setting => setting.value !== undefined);

    // Update settings
    await Promise.all(
      settingsToUpdate.map(setting =>
        prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: {
            value: setting.value,
            updatedBy: user.id
          },
          create: {
            key: setting.key,
            value: setting.value,
            dataType: setting.dataType,
            category: setting.category,
            updatedBy: user.id
          }
        })
      )
    );

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'security_settings_updated',
        resource: 'system_setting',
        description: 'Updated security settings',
        metadata: {
          updatedSettings: settingsToUpdate.map(s => s.key)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Security settings updated successfully'
    });

  } catch (error) {
    console.error('Security settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
