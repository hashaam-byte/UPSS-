// /api/protected/headadmin/platform-settings
// Headadmin views/edits pricing and the contact number shown to school
// admins. Single source of truth — the landing page and the subscription
// pricing calculation both read from this same table.
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { getPlatformSettings, setPlatformSettings } from '@/lib/platform-settings';

export async function GET() {
  try {
    await requireAuth(['HEADADMIN']);
    const settings = await getPlatformSettings();
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Platform settings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const user = await requireAuth(['HEADADMIN']);
    const body = await request.json();

    const updated = await setPlatformSettings(body, user.id);
    return NextResponse.json({ success: true, message: 'Settings updated', data: updated });
  } catch (error) {
    if (error.message === 'Authentication required') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'Access denied') return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    console.error('Platform settings update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
