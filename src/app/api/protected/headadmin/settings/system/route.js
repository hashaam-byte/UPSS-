
// pages/api/protected/headadmin/settings/system.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    if (req.method === 'GET') {
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

      return res.status(200).json({
        success: true,
        settings: finalSettings
      });

    } else if (req.method === 'PUT') {
      // Update system settings
      const updateData = req.body;

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
              updatedBy: authResult.user.id
            },
            create: {
              key: setting.key,
              value: setting.value,
              dataType: setting.dataType,
              category: setting.category,
              updatedBy: authResult.user.id
            }
          })
        )
      );

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          userId: authResult.user.id,
          action: 'system_settings_updated',
          resource: 'system_setting',
          description: 'Updated system settings',
          metadata: {
            updatedSettings: settingsToUpdate.map(s => s.key)
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'System settings updated successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('System settings error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
