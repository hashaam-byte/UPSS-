
// pages/api/auth/logout.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear the auth cookie
  res.setHeader('Set-Cookie', 'auth-token=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/');

  return res.status(200).json({ message: 'Logout successful' });
}
