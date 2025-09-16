
// pages/api/protected/headadmin/settings/security.js
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

    if (req.method === 'PUT') {
      // Update security settings
      const { sessionTimeout, maxLoginAttempts, passwordMinLength } = req.body;

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
          action: 'security_settings_updated',
          resource: 'system_setting',
          description: 'Updated security settings',
          metadata: {
            updatedSettings: settingsToUpdate.map(s => s.key)
          }
        }
      });

      return res.status(200).json({
        success: true,
        message: 'Security settings updated successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Security settings error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
