
// pages/api/auth/school/login.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { authenticateSchoolUser, createJWT, getRoleRedirectURL } from '@/lib/auth';
import { prisma } from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { schoolSlug, email, password } = req.body;

    if (!schoolSlug || !email || !password) {
      return res.status(400).json({ error: 'School, email and password are required' });
    }

    const payload = await authenticateSchoolUser(schoolSlug, email, password);
    
    if (!payload) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create JWT token and set cookie
    const token = createJWT(payload);
    res.setHeader('Set-Cookie', `auth-token=${token}; HttpOnly; Secure=${process.env.NODE_ENV === 'production'}; SameSite=Lax; Max-Age=${24 * 60 * 60}; Path=/`);

    // Create audit log
    await prisma.auditLog.create({
      data: {
        school_id: payload.schoolId,
        action: 'USER_LOGIN',
        details: { email, role: payload.role },
        user_id: payload.sub,
        user_type: payload.role
      }
    });

    return res.status(200).json({
      message: 'Login successful',
      redirectTo: getRoleRedirectURL(payload.role)
    });

  } catch (error) {
    console.error('School login error:', error);
    
    if (error.message === 'School is suspended') {
      return res.status(403).json({ 
        error: 'School account is suspended', 
        code: 'SCHOOL_SUSPENDED' 
      });
    }

    return res.status(500).json({ error: 'Internal server error' });
  }
}
