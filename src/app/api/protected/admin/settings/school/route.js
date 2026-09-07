import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['ADMIN']);
    const school = await prisma.school.findUnique({
      where: { id: user.school.id },
      select: {
        name: true,
        address: true,
        phone: true,
        email: true,
        website: true,
        logo: true,
        description: true,
        createdAt: true,
        principalName: true,
        vice_principalName: true,
        establishedYear: true,
        themeColor: true
      }
    });
    return NextResponse.json({ settings: school });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch school settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['ADMIN']);
    const data = await request.json();

    if (data.themeColor && !/^#[0-9A-Fa-f]{6}$/.test(data.themeColor)) {
      return NextResponse.json({ error: 'themeColor must be a 6-digit hex color, e.g. #10b981' }, { status: 400 });
    }

    const updated = await prisma.school.update({
      where: { id: user.school.id },
      data: {
        name: data.name,
        address: data.address,
        phone: data.phone,
        email: data.email,
        website: data.website,
        logo: data.logo,
        description: data.description,
        establishedYear: data.establishedYear,
        principalName: data.principalName,
        vice_principalName: data.vice_principalName,
        themeColor: data.themeColor,
      }
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update school settings' }, { status: 500 });
  }
}
