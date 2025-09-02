
// pages/api/auth/forgot.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma, withTenant } from '@/lib/db';
import crypto from 'crypto';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, schoolSlug, userType } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (userType === 'head') {
      // Handle head admin password reset
      const admin = await prisma.headAdmin.findUnique({
        where: { email }
      });

      if (!admin) {
        // Don't reveal if email exists or not
        return res.status(200).json({ 
          message: 'If the email exists, a reset link has been sent' 
        });
      }

      // In a real app, store the reset token and send email
      // For now, just log it
      console.log('Head admin reset token:', resetToken);

    } else if (schoolSlug) {
      // Handle school user password reset
      const school = await prisma.school.findUnique({
        where: { slug: schoolSlug }
      });

      if (!school) {
        return res.status(404).json({ error: 'School not found' });
      }

      await withTenant(school.db_schema, async (client) => {
        const user = await client.$queryRaw<Array<{id: string}>>`
          SELECT id FROM users WHERE email = ${email} AND status = 'ACTIVE' LIMIT 1
        `;

        if (user.length === 0) {
          // Don't reveal if email exists or not
          return;
        }

        // In a real app, store the reset token and send email
        console.log('School user reset token:', resetToken);
      });
    }

    return res.status(200).json({ 
      message: 'If the email exists, a reset link has been sent' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
