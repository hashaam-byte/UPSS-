// /app/api/protected/teacher/class/calendar/route.js
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

// GET - Fetch calendar events
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType') || 'all';
    const search = searchParams.get('search') || '';

    if (!startDate || !endDate) {
      return NextResponse.json({
        error: 'Start date and end date are required'
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

    // Build where conditions for calendar events
    let whereConditions = {
      schoolId: classTeacher.schoolId,
      OR: [
        { createdBy: classTeacher.id }, // Events created by this teacher
        { 
          classes: {
            hasSome: classNames // Events for their assigned classes
          }
        },
        { 
          teacherIds: {
            has: classTeacher.id // Events where this teacher is involved
          }
        }
      ],
      startDate: {
        gte: new Date(startDate)
      },
      endDate: {
        lte: new Date(endDate)
      }
    };

    // Add event type filter
    if (eventType !== 'all') {
      whereConditions.eventType = eventType;
    }

    // Add search filter
    if (search) {
      whereConditions.AND = [
        {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { location: { contains: search, mode: 'insensitive' } }
          ]
        }
      ];
    }

    // Fetch calendar events
    const events = await prisma.calendarEvent.findMany({
      where: whereConditions,
      include: {
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        startDate: 'asc'
      }
    });

    // Format events data
    const formattedEvents = events.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      isAllDay: event.isAllDay,
      isRecurring: event.isRecurring,
      recurrenceRule: event.recurrenceRule,
      classes: event.classes,
      studentIds: event.studentIds,
      teacherIds: event.teacherIds,
      priority: event.priority,
      location: event.location,
      creator: event.creator ? `${event.creator.firstName} ${event.creator.lastName}` : 'System',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt
    }));

    // Get upcoming deadlines and important dates
    const upcomingDeadlines = await getUpcomingDeadlines(classTeacher.schoolId, classNames);
    
    // Get class schedule for the period
    const classSchedule = await getClassSchedule(classTeacher.schoolId, classNames, new Date(startDate), new Date(endDate));

    return NextResponse.json({
      success: true,
      data: {
        events: formattedEvents,
        upcomingDeadlines: upcomingDeadlines,
        classSchedule: classSchedule,
        summary: {
          totalEvents: formattedEvents.length,
          eventsByType: getEventTypeBreakdown(formattedEvents),
          dateRange: {
            start: startDate,
            end: endDate
          }
        },
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher calendar GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
      }
    }
 
// PUT - Update existing calendar event
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { eventId, ...updateData } = body;

    if (!eventId) {
      return NextResponse.json({
        error: 'Event ID is required'
      }, { status: 400 });
    }

    // Verify event belongs to this teacher
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id
      }
    });

    if (!event) {
      return NextResponse.json({
        error: 'Event not found or access denied'
      }, { status: 404 });
    }

    // Update the event
    const updatedEvent = await prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...updateData,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar event updated successfully',
      data: {
        eventId: eventId,
        updatedAt: updatedEvent.updatedAt
      }
    });

  } catch (error) {
    console.error('Update calendar event error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete calendar event
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('id');

    if (!eventId) {
      return NextResponse.json({
        error: 'Event ID is required'
      }, { status: 400 });
    }

    // Verify event belongs to this teacher
    const event = await prisma.calendarEvent.findFirst({
      where: {
        id: eventId,
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id
      }
    });

    if (!event) {
      return NextResponse.json({
        error: 'Event not found or access denied'
      }, { status: 404 });
    }

    // Delete the event
    await prisma.calendarEvent.delete({
      where: { id: eventId }
    });

    return NextResponse.json({
      success: true,
      message: 'Calendar event deleted successfully',
      data: {
        deletedEventId: eventId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete calendar event error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to get upcoming deadlines
async function getUpcomingDeadlines(schoolId, classNames) {
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  // Get assignment deadlines
  const assignments = await prisma.assignment.findMany({
    where: {
      schoolId: schoolId,
      classes: {
        hasSome: classNames
      },
      dueDate: {
        gte: new Date(),
        lte: thirtyDaysFromNow
      },
      status: 'active'
    },
    include: {
      subject: true
    },
    orderBy: {
      dueDate: 'asc'
    },
    take: 10
  });

  return assignments.map(assignment => ({
    id: assignment.id,
    title: `${assignment.title} Due`,
    type: 'assignment_deadline',
    dueDate: assignment.dueDate,
    subject: assignment.subject.name,
    classes: assignment.classes
  }));
}

// Helper function to get class schedule
async function getClassSchedule(schoolId, classNames, startDate, endDate) {
  const timetables = await prisma.timetable.findMany({
    where: {
      schoolId: schoolId,
      className: {
        in: classNames
      }
    },
    orderBy: [
      { dayOfWeek: 'asc' },
      { period: 'asc' }
    ]
  });

  // Convert timetables to calendar events for the date range
  const scheduleEvents = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    const dayTimetables = timetables.filter(tt => tt.dayOfWeek === dayName);
    
    dayTimetables.forEach(timetable => {
      const eventStart = new Date(currentDate);
      const eventEnd = new Date(currentDate);
      
      // Parse time strings (assuming format like "08:00")
      const [startHour, startMinute] = timetable.startTime.split(':').map(Number);
      const [endHour, endMinute] = timetable.endTime.split(':').map(Number);
      
      eventStart.setHours(startHour, startMinute, 0, 0);
      eventEnd.setHours(endHour, endMinute, 0, 0);
      
      scheduleEvents.push({
        id: `timetable_${timetable.id}_${currentDate.toISOString().split('T')[0]}`,
        title: `${timetable.subject} - ${timetable.className}`,
        type: 'class_schedule',
        startDate: eventStart,
        endDate: eventEnd,
        className: timetable.className,
        subject: timetable.subject,
        period: timetable.period
      });
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return scheduleEvents;
}

// Helper function to get event type breakdown
function getEventTypeBreakdown(events) {
  const breakdown = {};
  
  events.forEach(event => {
    if (!breakdown[event.eventType]) {
      breakdown[event.eventType] = 0;
    }
    breakdown[event.eventType]++;
  });
  
  return breakdown;
}
  
// POST - Create new calendar event
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const {
      title,
      description,
      eventType,
      startDate,
      endDate,
      isAllDay = false,
      isRecurring = false,
      recurrenceRule,
      classes = [],
      studentIds = [],
      teacherIds = [],
      priority = 'normal',
      location
    } = body;

    if (!title || !eventType || !startDate || !endDate) {
      return NextResponse.json({
        error: 'Title, event type, start date, and end date are required'
      }, { status: 400 });
    }

    // Validate dates
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);

    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      return NextResponse.json({
        error: 'Invalid date format'
      }, { status: 400 });
    }

    if (startDateTime >= endDateTime) {
      return NextResponse.json({
        error: 'End date must be after start date'
      }, { status: 400 });
    }

    // Validate event type
    const validEventTypes = ['class', 'exam', 'meeting', 'event', 'deadline', 'reminder', 'parent_meeting'];
    if (!validEventTypes.includes(eventType)) {
      return NextResponse.json({
        error: 'Invalid event type'
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json({
        error: 'Invalid priority level'
      }, { status: 400 });
    }

    // Get assigned classes for validation
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let assignedClasses = [];
    
    if (assignedClass) {
      assignedClasses = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      assignedClasses = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    // Validate that classes are from teacher's assigned classes
    if (classes.length > 0) {
      const invalidClasses = classes.filter(className => !assignedClasses.includes(className));
      if (invalidClasses.length > 0) {
        return NextResponse.json({
          error: `You are not assigned to classes: ${invalidClasses.join(', ')}`
        }, { status: 403 });
      }
    }

    // Create the calendar event
    const event = await prisma.calendarEvent.create({
      data: {
        schoolId: classTeacher.schoolId,
        createdBy: classTeacher.id,
        title: title,
        description: description || null,
        eventType: eventType,
        startDate: startDateTime,
        endDate: endDateTime,
        isAllDay: isAllDay,
        isRecurring: isRecurring,
        recurrenceRule: recurrenceRule || null,
        classes: classes,
        studentIds: studentIds,
        teacherIds: [...new Set([...teacherIds, classTeacher.id])], // Include creator
        priority: priority,
        location: location || null
      }
    });

    // Create notifications for relevant users
    if (eventType === 'parent_meeting' || priority === 'high' || priority === 'urgent') {
      // Get students in the affected classes
      if (classes.length > 0) {
        const students = await prisma.user.findMany({
          where: {
            schoolId: classTeacher.schoolId,
            role: 'student',
            isActive: true,
            studentProfile: {
              className: {
                in: classes
              }
            }
          }
        });

        // Create notifications for students
        const notifications = students.map(student => ({
          userId: student.id,
          schoolId: classTeacher.schoolId,
          title: `New ${eventType.replace('_', ' ')}: ${title}`,
          content: `${classTeacher.firstName} ${classTeacher.lastName} has scheduled: ${title}. Date: ${startDateTime.toLocaleDateString()}`,
          type: priority === 'urgent' ? 'warning' : 'info',
          priority: priority,
          isRead: false
        }));

        await prisma.notification.createMany({
          data: notifications
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      data: {
        eventId: event.id,
        title: title,
        eventType: eventType,
        startDate: startDateTime,
        endDate: endDateTime,
        createdAt: event.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create calendar event error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 }
    )}};