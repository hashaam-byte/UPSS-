// /app/api/protected/teacher/class/alerts/route.js - CASE-INSENSITIVE VERSION
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ✅ Helper function to normalize class names for comparison
function normalizeClassName(className) {
  if (!className) return '';
  return className.trim().toUpperCase().replace(/\s+/g, ' ');
}

// POST - Create new student alert
export async function POST(request) {
  try {
    const user = await requireAuth(['class_teacher']);
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

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    // ✅ FIX: Verify student belongs to teacher's class (case-insensitive)
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({
        error: 'Student not found'
      }, { status: 404 });
    }

    // Check if student's class matches teacher's assigned classes (case-insensitive)
    const studentClassName = student.studentProfile?.className;
    const normalizedStudentClass = normalizeClassName(studentClassName);
    
    if (!normalizedAssignedClasses.includes(normalizedStudentClass)) {
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
        schoolId: user.schoolId,
        createdBy: user.id,
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
        schoolId: user.schoolId,
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
          schoolId: user.schoolId,
          title: `Urgent Student Alert from Class Teacher`,
          content: `${user.firstName} ${user.lastName} has flagged ${student.firstName} ${student.lastName} for: ${title}. Priority: ${priority}`,
          type: 'warning',
          priority: priority,
          isRead: false,
          isGlobal: false
        }
      });
    }

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Fetch alerts for class teacher
export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const priority = searchParams.get('priority') || 'all';
    const alertType = searchParams.get('type') || 'all';
    const studentId = searchParams.get('studentId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
    const normalizedAssignedClasses = assignedClasses.map(cls => normalizeClassName(cls));

    if (assignedClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          alerts: [],
          summary: { total: 0, active: 0, resolved: 0, inProgress: 0 },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // ✅ FIX: Get ALL students from school, then filter case-insensitively
    const allStudentsInSchool = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            not: null
          }
        }
      },
      include: {
        studentProfile: true
      }
    });

    // Filter students by normalized class names (case-insensitive)
    const students = allStudentsInSchool.filter(student => {
      const studentClassName = student.studentProfile?.className;
      if (!studentClassName) return false;
      
      const normalizedStudentClass = normalizeClassName(studentClassName);
      return normalizedAssignedClasses.includes(normalizedStudentClass);
    });

    const studentIds = students.map(s => s.id);

    // Build where conditions for alerts
    let whereConditions = {
      schoolId: user.schoolId,
      createdBy: user.id,
      studentId: {
        in: studentIds
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
        schoolId: user.schoolId,
        createdBy: user.id,
        studentId: {
          in: studentIds
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
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          assignedClasses: assignedClasses
        }
      }
    });

  } catch (error) {
    console.error('Fetch alerts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing alert
export async function PUT(request) {
  try {
    const user = await requireAuth(['class_teacher']);
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
        schoolId: user.schoolId,
        createdBy: user.id
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
        updateData.resolvedBy = user.id;
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}