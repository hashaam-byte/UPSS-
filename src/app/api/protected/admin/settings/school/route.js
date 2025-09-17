import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(['admin']);
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
        establishedYear: true
      }
    });
    return NextResponse.json({ settings: school });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch school settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['admin']);
    const data = await request.json();
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
        vice_principalName: data.vice_principalName
      }
    });
    return NextResponse.json({ success: true, settings: updated });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update school settings' }, { status: 500 });
  }
}
