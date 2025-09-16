// pages/api/protected/headadmin/schools/[id]/user-count.js
import { PrismaClient } from '@prisma/client';
import { verifyHeadAdminAuth } from '../../../../../lib/authHelpers';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authResult = await verifyHeadAdminAuth(req);
    if (!authResult.success) {
      return res.status(401).json({ error: authResult.error });
    }

    const { id } = req.query;

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id }
    });

    if (!school) {
      return res.status(404).json({ error: 'School not found' });
    }

    // Get user counts by role
    const [studentCount, teacherCount, adminCount] = await Promise.all([
      prisma.user.count({
        where: { 
          schoolId: id, 
          role: 'student',
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: id, 
          role: 'teacher',
          isActive: true 
        }
      }),
      prisma.user.count({
        where: { 
          schoolId: id, 
          role: 'admin',
          isActive: true 
        }
      })
    ]);

    return res.status(200).json({
      success: true,
      studentCount,
      teacherCount,
      adminCount,
      totalUsers: studentCount + teacherCount + adminCount
    });

  } catch (error) {
    console.error('Failed to fetch user count:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    await prisma.$disconnect();
  }
}
