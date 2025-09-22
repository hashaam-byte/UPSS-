// /app/api/protected/teacher/class/alerts/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify class teacher access
async function verifyClassTeacherAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      teacherProfile: {
        include: {
          teacherSubjects: {
            include: {
              subject: true
            }
          }
        }
      }, 
      school: true 
    }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

// POST - Create new student alert
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { 
      studentId, 
      alertType, 
      title, 
      description, 
      priority = 'normal',
      parentNotified = false,
      followUpDate = null 
    } = body;

    if (!studentId || !alertType || !title || !description) {
      return NextResponse.json({
        error: 'Student ID, alert type, title, and description are required'
      }, { status: 400 });
    }

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    // Verify student belongs to teacher's class
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: classTeacher.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: classNames
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found in your assigned class'
      }, { status: 404 });
    }

    // Validate alert type
    const validAlertTypes = [
      'performance_concern',
      'attendance_issue',
      'behavioral_issue',
      'parent_meeting_required',
      'academic_support_needed',
      'commendation',
      'disciplinary_action'
    ];

    if (!validAlertTypes.includes(alertType)) {
      return NextResponse.json({
        error: 'Invalid alert type'
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({
        error: 'Invalid priority level'
      }, { status: 400 });
    }

    // Parse follow-up date if provided
    let followUpDateObj = null;
    if (followUpDate) {
      followUpDateObj = new Date(followUpDate);
      if (isNaN(followUpDateObj.getTime())) {
        return NextResponse.json({
          error: 'Invalid follow-up date'
        }, { status: 400 });
      }
    }

    // Create the student alert
    const alert = await prisma.studentAlert.create({
      data: {
        studentId: studentId,
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id,
        alertType: alertType,
        priority: priority,
        title: title,
        description: description,
        status: 'active',
        parentNotified: parentNotified,
        followUpDate: followUpDateObj
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: studentId,
        schoolId: classTeacher.schoolId,
        title: `Class Teacher Alert: ${title}`,
        content: description,
        type: priority === 'high' || priority === 'urgent' ? 'warning' : 'info',
        priority: priority,
        isRead: false
      }
    });

    // Create notification for admin if high priority
    if (priority === 'high' || priority === 'urgent') {
      await prisma.notification.create({
        data: {
          schoolId: classTeacher.schoolId,
          title: `Urgent Student Alert from Class Teacher`,
          content: `${classTeacher.firstName} ${classTeacher.lastName} has flagged ${student.firstName} ${student.lastName} for: ${title}. Priority: ${priority}`,
          type: 'warning',
          priority: priority,
          isRead: false,
          isGlobal: false
        }
      });
    }

    // TODO: In production, you might also:
    // - Send email/SMS to parent if parentNotified is true
    // - Create calendar event if followUpDate is set
    // - Log in audit trail

    return NextResponse.json({
      success: true,
      message: 'Student alert created successfully',
      data: {
        alertId: alert.id,
        studentId: studentId,
        studentName: `${student.firstName} ${student.lastName}`,
        alertType: alertType,
        title: title,
        priority: priority,
        createdAt: alert.createdAt,
        followUpDate: followUpDateObj
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create student alert error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch alerts for class teacher
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const alertType = searchParams.get('type') || 'all';
    const studentId = searchParams.get('studentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          alerts: [],
          summary: { total: 0, active: 0, resolved: 0, inProgress: 0 },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // Build where conditions
    let whereConditions = {
      schoolId: classTeacher.schoolId,
      createdBy: classTeacher.id,
      student: {
        studentProfile: {
          className: {
            in: classNames
          }
        }
      }
    };

    // Add filters
    if (status !== 'all') {
      whereConditions.status = status;
    }

    if (priority !== 'all') {
      whereConditions.priority = priority;
    }

    if (alertType !== 'all') {
      whereConditions.alertType = alertType;
    }

    if (studentId) {
      whereConditions.studentId = studentId;
    }

    // Get total count
    const totalAlerts = await prisma.studentAlert.count({
      where: whereConditions
    });

    // Get alerts with pagination
    const alerts = await prisma.studentAlert.findMany({
      where: whereConditions,
      include: {
        student: {
          include: {
            studentProfile: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        resolver: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      skip: (page - 1) * limit,
      take: limit
    });

    // Format alerts data
    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.alertType,
      title: alert.title,
      description: alert.description,
      priority: alert.priority,
      status: alert.status,
      createdAt: alert.createdAt,
      resolvedAt: alert.resolvedAt,
      followUpDate: alert.followUpDate,
      parentNotified: alert.parentNotified,
      resolution: alert.resolution,
      student: {
        id: alert.student.id,
        firstName: alert.student.firstName,
        lastName: alert.student.lastName,
        profile: alert.student.studentProfile ? {
          studentId: alert.student.studentProfile.studentId,
          className: alert.student.studentProfile.className
        } : null
      },
      creator: `${alert.creator.firstName} ${alert.creator.lastName}`,
      resolver: alert.resolver ? `${alert.resolver.firstName} ${alert.resolver.lastName}` : null
    }));

    // Calculate summary statistics
    const allAlerts = await prisma.studentAlert.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id,
        student: {
          studentProfile: {
            className: {
              in: classNames
            }
          }
        }
      }
    });

    const summary = {
      total: allAlerts.length,
      active: allAlerts.filter(a => a.status === 'active').length,
      inProgress: allAlerts.filter(a => a.status === 'in_progress').length,
      resolved: allAlerts.filter(a => a.status === 'resolved').length,
      escalated: allAlerts.filter(a => a.status === 'escalated').length,
      highPriority: allAlerts.filter(a => a.priority === 'high' || a.priority === 'urgent').length
    };

    return NextResponse.json({
      success: true,
      data: {
        alerts: formattedAlerts,
        summary: summary,
        pagination: {
          total: totalAlerts,
          page: page,
          limit: limit,
          pages: Math.ceil(totalAlerts / limit)
        },
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Fetch alerts error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing alert
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { 
      alertId, 
      status, 
      resolution, 
      followUpDate,
      parentNotified 
    } = body;

    if (!alertId) {
      return NextResponse.json({
        error: 'Alert ID is required'
      }, { status: 400 });
    }

    // Verify alert belongs to this teacher
    const alert = await prisma.studentAlert.findFirst({
      where: {
        id: alertId,
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id
      }
    });

    if (!alert) {
      return NextResponse.json({
        error: 'Alert not found or access denied'
      }, { status: 404 });
    }

    // Prepare update data
    const updateData = {};
    
    if (status) {
      const validStatuses = ['active', 'in_progress', 'resolved', 'escalated'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json({
          error: 'Invalid status'
        }, { status: 400 });
      }
      updateData.status = status;
      
      if (status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedBy = classTeacher.id;
      }
    }

    if (resolution) {
      updateData.resolution = resolution;
    }

    if (followUpDate) {
      const followUpDateObj = new Date(followUpDate);
      if (!isNaN(followUpDateObj.getTime())) {
        updateData.followUpDate = followUpDateObj;
      }
    }

    if (typeof parentNotified === 'boolean') {
      updateData.parentNotified = parentNotified;
    }

    // Update the alert
    const updatedAlert = await prisma.studentAlert.update({
      where: { id: alertId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Alert updated successfully',
      data: {
        alertId: alertId,
        updatedFields: Object.keys(updateData),
        updatedAt: updatedAlert.updatedAt
      }
    });

  } catch (error) {
    console.error('Update alert error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}