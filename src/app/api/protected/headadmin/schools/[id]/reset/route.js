// /app/api/protected/headadmin/schools/[id]/reset/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id: schoolId } = params;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get counts for audit logging before reset
    const counts = await prisma.$transaction([
      prisma.user.count({ where: { schoolId, role: { not: 'admin' } } }), // Don't count admin users
      prisma.assignment.count({ where: { schoolId } }),
      prisma.attendance.count({ where: { schoolId } }),
      prisma.grade.count({ where: { schoolId } }),
      prisma.resource.count({ where: { schoolId } }),
      prisma.timetable.count({ where: { schoolId } }),
      prisma.calendarEvent.count({ where: { schoolId } }),
      prisma.announcement.count({ where: { schoolId } }),
      prisma.studentAlert.count({ where: { schoolId } }),
      prisma.fileUpload.count({ where: { schoolId } })
    ]);

    const [
      nonAdminUserCount, assignmentCount, attendanceCount, 
      gradeCount, resourceCount, timetableCount, eventCount,
      announcementCount, alertCount, fileCount
    ] = counts;

    // Reset school data but preserve admin users and billing data
    await prisma.$transaction(async (tx) => {
      // Delete non-admin users (students and teachers)
      await tx.user.deleteMany({
        where: {
          schoolId: schoolId,
          role: { not: 'admin' }
        }
      });

      // Delete academic data
      await tx.assignment.deleteMany({ where: { schoolId } });
      await tx.attendance.deleteMany({ where: { schoolId } });
      await tx.grade.deleteMany({ where: { schoolId } });
      await tx.timetable.deleteMany({ where: { schoolId } });
      await tx.calendarEvent.deleteMany({ where: { schoolId } });
      await tx.studentAlert.deleteMany({ where: { schoolId } });
      
      // Delete resources and files
      await tx.resource.deleteMany({ where: { schoolId } });
      await tx.resourceFolder.deleteMany({ where: { schoolId } });
      await tx.fileUpload.deleteMany({ where: { schoolId } });
      
      // Delete announcements and messages (except system messages)
      await tx.announcement.deleteMany({ where: { schoolId } });
      await tx.message.deleteMany({ 
        where: { 
          schoolId,
          messageType: { not: 'system' }
        }
      });
      
      // Delete notifications (except system notifications)
      await tx.notification.deleteMany({ 
        where: { 
          schoolId,
          type: { not: 'system' }
        }
      });

      // Reset school settings to defaults
      await tx.school.update({
        where: { id: schoolId },
        data: {
          allowStudentRegistration: false,
          requireEmailVerification: true,
          // Keep subscription and limits as they are
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'RESET_SCHOOL_DATA',
          resource: 'school',
          resourceId: schoolId,
          description: `Reset all data for school: ${school.name} (${school.slug})`,
          metadata: {
            schoolName: school.name,
            schoolSlug: school.slug,
            resetCounts: {
              nonAdminUsers: nonAdminUserCount,
              assignments: assignmentCount,
              attendance: attendanceCount,
              grades: gradeCount,
              resources: resourceCount,
              timetables: timetableCount,
              events: eventCount,
              announcements: announcementCount,
              alerts: alertCount,
              files: fileCount
            },
            totalRecordsReset: counts.reduce((sum, count) => sum + count, 0),
            resetAt: new Date().toISOString(),
            resetBy: user.email,
            preservedData: ['admin_users', 'billing_data', 'subscription_info', 'school_settings']
          }
        }
      });

      // Notify school admins
      const schoolAdmins = await tx.user.findMany({
        where: {
          schoolId: schoolId,
          role: 'admin',
          isActive: true
        },
        select: { id: true }
      });

      const notificationPromises = schoolAdmins.map(admin =>
        tx.notification.create({
          data: {
            userId: admin.id,
            title: 'School Data Reset',
            content: `All school data has been reset by the head administrator. Students, teachers, assignments, grades, and other academic data have been cleared. Your admin account and billing information have been preserved.`,
            type: 'warning',
            priority: 'high'
          }
        })
      );

      await Promise.all(notificationPromises);
    });

    return NextResponse.json({
      success: true,
      message: 'School data reset successfully',
      school: {
        id: schoolId,
        name: school.name,
        slug: school.slug
      },
      summary: {
        totalRecordsReset: counts.reduce((sum, count) => sum + count, 0),
        breakdown: {
          nonAdminUsers: nonAdminUserCount,
          assignments: assignmentCount,
          attendance: attendanceCount,
          grades: gradeCount,
          resources: resourceCount,
          timetables: timetableCount,
          events: eventCount,
          announcements: announcementCount,
          alerts: alertCount,
          files: fileCount
        },
        preserved: [
          'Admin users',
          'Billing and invoice history', 
          'Subscription information',
          'School basic settings'
        ]
      }
    });

  } catch (error) {
    console.error('Error resetting school data:', error);
    
    // Create error audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: 'RESET_SCHOOL_DATA_FAILED',
          resource: 'school',
          resourceId: params.id,
          description: `Failed to reset school data: ${error.message}`,
          metadata: {
            error: error.message,
            timestamp: new Date().toISOString()
          }
        }
      });
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to reset school data',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}