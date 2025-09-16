// pages/api/protected/headadmin/settings/profile.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../lib/authHelpers';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    if (req.method === 'GET') {
      // Get current profile
      const user = await prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      });

      return res.status(200).json({
        success: true,
        profile: user
      });

    } else if (req.method === 'PUT') {
      // Update profile
      const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;

      // Validate required fields
      if (!firstName || !lastName || !email) {
        return res.status(400).json({ 
          error: 'First name, last name, and email are required' 
        });
      }

      // Check if email is already taken by another user
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          id: { not: authResult.user.id }
        }
      });

      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }

      const updateData = {
        firstName,
        lastName,
        email,
        phone: phone || null
      };

      // Handle password change
      if (newPassword) {
        if (!currentPassword) {
          return res.status(400).json({ 
            error: 'Current password is required to change password' 
          });
        }

        // Verify current password
        const user = await prisma.user.findUnique({
          where: { id: authResult.user.id }
        });

        const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValidPassword) {
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        if (newPassword.length < 8) {
          return res.status(400).json({ 
            error: 'New password must be at least 8 characters long' 
          });
        }

        // Hash new password
        updateData.passwordHash = await bcrypt.hash(newPassword, 12);
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: authResult.user.id },
        data: updateData,
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true
        }
      });

      // Log audit trail
      await prisma.auditLog.create({
        data: {
          userId: authResult.user.id,
          action: 'profile_updated',
          resource: 'user',
          resourceId: authResult.user.id,
          description: `Updated profile information${newPassword ? ' and password' : ''}`,
          metadata: {
            updatedFields: Object.keys(updateData).filter(key => key !== 'passwordHash')
          }
        }
      });

      return res.status(200).json({
        success: true,
        profile: updatedUser
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Profile settings error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
