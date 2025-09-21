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

// GET - Fetch calendar events and schedule
export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const view = searchParams.get('view') || 'month';
    const eventType = searchParams.get('type') || 'all';

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

    // Set date range based on view
    let start, end;
    const today = new Date();
    
    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (view) {
        case 'week':
          start = new Date(today);
          start.setDate(today.getDate() - today.getDay()); // Start of week
          end = new Date(start);
          end.setDate(start.getDate() + 6); // End of week
          break;
        case 'month':
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;
        case 'day':
          start = new Date(today);
          end = new Date(today);
          break;
        default:
          start = new Date(today.getFullYear(), today.getMonth(), 1);
          end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      }
    }

    // Get timetable for the period (if exists)
    const timetable = await prisma.timetable.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        className: {
          in: classNames
        }
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Generate calendar events (in production, this would come from actual events table)
    const calendarEvents = generateCalendarEvents(classTeacher, classNames, start, end, timetable);

    // Filter by event type if specified
    let filteredEvents = calendarEvents;
    if (eventType !== 'all') {
      filteredEvents = calendarEvents.filter(event => event.type === eventType);
    }

    // Get upcoming events (next 7 days)
    const upcomingEvents = calendarEvents
      .filter(event => {
        const eventDate = new Date(event.date);
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 7);
        return eventDate >= today && eventDate <= nextWeek;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        events: filteredEvents,
        upcomingEvents: upcomingEvents,
        timetable: timetable.map(entry => ({
          id: entry.id,
          dayOfWeek: entry.dayOfWeek,
          period: entry.period,
          subject: entry.subject,
          className: entry.className,
          teacher: `${entry.teacher.firstName} ${entry.teacher.lastName}`,
          startTime: entry.startTime,
          endTime: entry.endTime
        })),
        period: {
          startDate: start.toISOString().split('T')[0],
          endDate: end.toISOString().split('T')[0],
          view: view
        },
        assignedClasses: classNames,
        summary: {
          totalEvents: filteredEvents.length,
          upcomingCount: upcomingEvents.length,
          eventsByType: {
            class: filteredEvents.filter(e => e.type === 'class').length,
            assignment: filteredEvents.filter(e => e.type === 'assignment').length,
            meeting: filteredEvents.filter(e => e.type === 'meeting').length,
            exam: filteredEvents.filter(e => e.type === 'exam').length,
            reminder: filteredEvents.filter(e => e.type === 'reminder').length,
            school: filteredEvents.filter(e => e.type === 'school').length
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

// POST - Create new calendar event or reminder
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { title, description, date, time, type, duration, studentIds, recurrence, priority = 'normal' } = body;

    if (!title || !date || !type) {
      return NextResponse.json({
        error: 'Title, date, and type are required'
      }, { status: 400 });
    }

    const validTypes = ['class', 'assignment', 'meeting', 'exam', 'reminder', 'parent_meeting'];
    if (!validTypes.includes(type)) {
      return NextResponse.json({
        error: `Invalid event type. Must be one of: ${validTypes.join(', ')}`
      }, { status: 400 });
    }

    // TODO: In production, save to actual calendar/events table
    const eventData = {
      id: `event_${Date.now()}`,
      title: title,
      description: description || '',
      date: date,
      time: time || '09:00',
      type: type,
      duration: duration || 60, // minutes
      priority: priority,
      createdBy: classTeacher.id,
      createdAt: new Date(),
      recurrence: recurrence || null,
      studentIds: studentIds || [],
      status: 'scheduled'
    };

    // Create notifications for students if specified
    if (studentIds && studentIds.length > 0) {
      for (const studentId of studentIds) {
        await prisma.notification.create({
          data: {
            userId: studentId,
            schoolId: classTeacher.schoolId,
            title: `New Event: ${title}`,
            content: `You have a new ${type} scheduled for ${date} at ${time}. ${description}`,
            type: 'info',
            priority: priority,
            isRead: false
          }
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Calendar event created successfully',
      data: eventData
    }, { status: 201 });

  } catch (error) {
    console.error('Create calendar event error:', error);
    
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
    const { eventId, title, description, date, time, type, duration, studentIds, status } = body;

    if (!eventId) {
      return NextResponse.json({
        error: 'Event ID is required'
      }, { status: 400 });
    }

    // TODO: In production, update actual calendar/events table
    const updatedEvent = {
      id: eventId,
      title: title,
      description: description,
      date: date,
      time: time,
      type: type,
      duration: duration,
      studentIds: studentIds,
      status: status,
      updatedBy: classTeacher.id,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Calendar event updated successfully',
      data: updatedEvent
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

    // TODO: In production, delete from actual calendar/events table
    // Also handle cascading deletions (notifications, reminders, etc.)

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

// Helper function to generate calendar events
function generateCalendarEvents(teacher, classNames, startDate, endDate, timetable) {
  const events = [];
  const currentDate = new Date(startDate);
  
  // Generate regular timetable events
  while (currentDate <= endDate) {
    const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dayTimetable = timetable.filter(entry => entry.dayOfWeek === dayName);
      
      dayTimetable.forEach(entry => {
        events.push({
          id: `timetable_${entry.id}_${currentDate.toISOString().split('T')[0]}`,
          title: `${entry.subject} - ${entry.className}`,
          description: `Regular class session`,
          date: currentDate.toISOString().split('T')[0],
          time: entry.startTime,
          endTime: entry.endTime,
          type: 'class',
          className: entry.className,
          subject: entry.subject,
          isRecurring: true,
          status: 'scheduled',
          priority: 'normal'
        });
      });

      // Generate some random events for demonstration
      if (Math.random() > 0.8) {
        const eventTypes = [
          { type: 'assignment', title: 'Assignment Due', description: 'Mathematics homework due' },
          { type: 'exam', title: 'Quiz', description: 'Physics quiz scheduled' },
          { type: 'meeting', title: 'Parent Meeting', description: 'Meeting with student parent' },
          { type: 'reminder', title: 'Reminder', description: 'Follow up on student performance' }
        ];
        
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        events.push({
          id: `event_${currentDate.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          title: randomEvent.title,
          description: randomEvent.description,
          date: currentDate.toISOString().split('T')[0],
          time: '10:00',
          type: randomEvent.type,
          duration: 60,
          priority: Math.random() > 0.7 ? 'high' : 'normal',
          status: 'scheduled'
        });
      }
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));
}