
// /app/api/protected/teacher/coordinator/settings/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function GET(request) {
  try {
    const user = await requireAuth(['TEACHER']);
    
    // Verify user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      },
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: coordinator,
        settings: {
          notifications: {
            emailNotifications: true,
            timetableUpdates: true,
            studentAssignments: true,
            systemAlerts: true,
            weeklyReports: false,
            conflictAlerts: true
          }
        }
      }
    });

  } catch (error) {
    console.error('Coordinator settings GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const user = await requireAuth(['TEACHER']);
    const { type, data } = await request.json();

    // Verify user is a coordinator
    const coordinator = await prisma.user.findFirst({
      where: {
        id: user.id,
        teacherProfile: {
          department: 'coordinator'
        }
      }
    });

    if (!coordinator) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (type === 'profile') {
      const { firstName, lastName, phone, address, dateOfBirth } = data;

      // Note: email is intentionally not editable here — it's the login
      // identifier, kept stable on purpose.
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || coordinator.firstName,
          lastName: lastName || coordinator.lastName,
          phone: phone !== undefined ? phone : coordinator.phone,
          address: address !== undefined ? address : coordinator.address,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : coordinator.dateOfBirth
        }
      });
    } else if (type === 'password') {
      const { currentPassword, newPassword } = data;

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, coordinator.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 12);

      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Invalidate all other sessions
      const currentToken = request.headers.get('authorization')?.split(' ')[1];
      const currentTokenHash = currentToken ? crypto.createHash('sha256').update(currentToken).digest('hex') : null;
      
      await prisma.userSession.deleteMany({
        where: {
          userId: user.id,
          NOT: { tokenHash: currentTokenHash }
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully'
    });

  } catch (error) {
    console.error('Coordinator settings PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}