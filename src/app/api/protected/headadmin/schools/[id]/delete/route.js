// /app/api/protected/headadmin/schools/[id]/delete/route.js
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

    // Get counts for audit logging before deletion
    const counts = await prisma.$transaction([
      prisma.user.count({ where: { schoolId } }),
      prisma.invoice.count({ where: { schoolId } }),
      prisma.assignment.count({ where: { schoolId } }),
      prisma.attendance.count({ where: { schoolId } }),
      prisma.grade.count({ where: { schoolId } }),
      prisma.resource.count({ where: { schoolId } }),
      prisma.timetable.count({ where: { schoolId } }),
      prisma.calendarEvent.count({ where: { schoolId } }),
      prisma.announcement.count({ where: { schoolId } }),
      prisma.message.count({ where: { schoolId } }),
      prisma.notification.count({ where: { schoolId } }),
      prisma.studentAlert.count({ where: { schoolId } }),
      prisma.payment.count({ where: { schoolId } }),
      prisma.fileUpload.count({ where: { schoolId } })
    ]);

    const [
      userCount, invoiceCount, assignmentCount, attendanceCount, 
      gradeCount, resourceCount, timetableCount, eventCount,
      announcementCount, messageCount, notificationCount, 
      alertCount, paymentCount, fileCount
    ] = counts;

    // Delete school and all related data
    await prisma.$transaction(async (tx) => {
      // Create audit log BEFORE deletion
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'DELETE_SCHOOL',
          resource: 'school',
          resourceId: schoolId,
          description: `Permanently deleted school: ${school.name} (${school.slug})`,
          metadata: {
            schoolName: school.name,
            schoolSlug: school.slug,
            wasActive: school.isActive,
            deletedCounts: {
              users: userCount,
              invoices: invoiceCount,
              assignments: assignmentCount,
              attendance: attendanceCount,
              grades: gradeCount,
              resources: resourceCount,
              timetables: timetableCount,
              events: eventCount,
              announcements: announcementCount,
              messages: messageCount,
              notifications: notificationCount,
              alerts: alertCount,
              payments: paymentCount,
              files: fileCount
            },
            totalRecordsDeleted: counts.reduce((sum, count) => sum + count, 1),
            deletedAt: new Date().toISOString(),
            deletedBy: user.email
          }
        }
      });

      // Delete the school - CASCADE will handle all related records
      await tx.school.delete({
        where: { id: schoolId }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'School permanently deleted successfully',
      deletedSchool: {
        id: schoolId,
        name: school.name,
        slug: school.slug
      },
      summary: {
        totalRecordsDeleted: counts.reduce((sum, count) => sum + count, 1),
        breakdown: {
          users: userCount,
          invoices: invoiceCount,
          assignments: assignmentCount,
          attendance: attendanceCount,
          grades: gradeCount,
          resources: resourceCount,
          timetables: timetableCount,
          events: eventCount,
          announcements: announcementCount,
          messages: messageCount,
          notifications: notificationCount,
          alerts: alertCount,
          payments: paymentCount,
          files: fileCount,
          school: 1
        }
      }
    });

  } catch (error) {
    console.error('Error deleting school:', error);
    
    // Create error audit log
    try {
      await prisma.auditLog.create({
        data: {
          userId: user?.id || null,
          action: 'DELETE_SCHOOL_FAILED',
          resource: 'school',
          resourceId: params.id,
          description: `Failed to delete school: ${error.message}`,
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
        error: 'Failed to delete school',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}