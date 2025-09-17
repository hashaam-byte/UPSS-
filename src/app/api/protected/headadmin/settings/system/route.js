// pages/api/protected/headadmin/settings/system.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get system settings
    const settings = await prisma.systemSetting.findMany({
      where: {
        category: { in: ['general', 'pricing', 'system'] }
      }
    });

    // Convert to object format
    const settingsObj = {};
    settings.forEach(setting => {
      let value = setting.value;
      
      // Convert based on data type
      if (setting.dataType === 'number') {
        value = parseFloat(value);
      } else if (setting.dataType === 'boolean') {
        value = value === 'true';
      } else if (setting.dataType === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = setting.value;
        }
      }
      
      settingsObj[setting.key] = value;
    });

    // Set defaults if not found
    const defaultSettings = {
      siteName: 'School Management System',
      trialPeriodDays: 30,
      pricePerUser: 250,
      flatRateThreshold: 600,
      flatRatePrice: 200000,
      maintenanceMode: false,
      allowSchoolRegistration: true,
      requireEmailVerification: true,
      sessionTimeout: 24,
      maxLoginAttempts: 5,
      passwordMinLength: 8
    };

    const finalSettings = { ...defaultSettings, ...settingsObj };

    return NextResponse.json({
      success: true,
      settings: finalSettings
    });

  } catch (error) {
    console.error('System settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const updateData = await request.json();

    const settingsToUpdate = [
      { key: 'siteName', value: updateData.siteName, dataType: 'string', category: 'general' },
      { key: 'trialPeriodDays', value: updateData.trialPeriodDays?.toString(), dataType: 'number', category: 'general' },
      { key: 'pricePerUser', value: updateData.pricePerUser?.toString(), dataType: 'number', category: 'pricing' },
      { key: 'flatRateThreshold', value: updateData.flatRateThreshold?.toString(), dataType: 'number', category: 'pricing' },
      { key: 'flatRatePrice', value: updateData.flatRatePrice?.toString(), dataType: 'number', category: 'pricing' },
      { key: 'maintenanceMode', value: updateData.maintenanceMode?.toString(), dataType: 'boolean', category: 'system' },
      { key: 'allowSchoolRegistration', value: updateData.allowSchoolRegistration?.toString(), dataType: 'boolean', category: 'system' },
      { key: 'requireEmailVerification', value: updateData.requireEmailVerification?.toString(), dataType: 'boolean', category: 'system' },
      { key: 'sessionTimeout', value: updateData.sessionTimeout?.toString(), dataType: 'number', category: 'system' },
      { key: 'maxLoginAttempts', value: updateData.maxLoginAttempts?.toString(), dataType: 'number', category: 'system' },
      { key: 'passwordMinLength', value: updateData.passwordMinLength?.toString(), dataType: 'number', category: 'system' }
    ].filter(setting => setting.value !== undefined);

    // Update or create settings
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
        action: 'system_settings_updated',
        resource: 'system_setting',
        description: 'Updated system settings',
        metadata: {
          updatedSettings: settingsToUpdate.map(s => s.key)
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'System settings updated successfully'
    });

  } catch (error) {
    console.error('System settings error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
