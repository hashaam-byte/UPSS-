// /api/public/pricing — no auth required, safe for the landing page.
import { NextResponse } from 'next/server';
import { getPublicPricing } from '@/lib/platform-settings';

export async function GET() {
  try {
    const pricing = await getPublicPricing();
    return NextResponse.json({ success: true, data: pricing });
  } catch (error) {
    console.error('Public pricing fetch error:', error);
    // Fail safe with the known default rather than breaking the landing page
    return NextResponse.json({ success: true, data: { landingMonthly: 300 } });
  }
}
