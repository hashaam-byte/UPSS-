import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const PERIODS = {
  "1": { start: "08:00", end: "09:05" },
  "2": { start: "09:05", end: "10:10" },
  "3": { start: "10:10", end: "11:15" }, 
  "BREAK": { start: "11:15", end: "11:35" },
  "4": { start: "11:35", end: "12:40" },
  "5": { start: "12:40", end: "13:45" },
  "LUNCH": { start: "13:45", end: "14:30" },
  "6": { start: "14:30", end: "15:35" }
};

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

// Helper function to verify director access
async function verifyDirectorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    
    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class');
    const dayOfWeek = searchParams.get('day');
    const teacherId = searchParams.get('teacher');
    const view = searchParams.get('view') || 'grid';

    // Build where clause
    const whereClause = {
      schoolId: user.schoolId,
      ...(className && { className }),
      ...(dayOfWeek && { dayOfWeek }),
      ...(teacherId && { teacherId })
    };

    // Get timetable entries with teacher details
    const timetable = await prisma.timetable.findMany({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            teacherProfile: {
              select: {
                department: true,
                qualification: true
              }
            }
          }
        },
        createdBy: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { period: 'asc' }
      ]
    });

    // Get available classes for filtering
    const availableClasses = await prisma.timetable.findMany({
      where: { schoolId: user.schoolId },
      select: { className: true },
      distinct: ['className']
    });

    // Get available teachers
    const availableTeachers = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        teacherProfile: {
          select: {
            department: true
          }
        }
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get subjects from the school
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        code: true,
        category: true
      },
      orderBy: { name: 'asc' }
    });

    // Transform data based on view type
    let transformedData;
    
    if (view === 'grid') {
      // Grid view - organize by day and period
      transformedData = {};
      DAYS_OF_WEEK.forEach(day => {
        transformedData[day] = {};
        Object.keys(PERIODS).forEach(periodNum => {
          if (periodNum !== 'BREAK' && periodNum !== 'LUNCH') {
            transformedData[day][periodNum] = [];
          }
        });
      });

      timetable.forEach(entry => {
        if (!transformedData[entry.dayOfWeek]) {
          transformedData[entry.dayOfWeek] = {};
        }
        if (!transformedData[entry.dayOfWeek][entry.period]) {
          transformedData[entry.dayOfWeek][entry.period] = [];
        }
        
        transformedData[entry.dayOfWeek][entry.period].push({
          id: entry.id,
          subject: entry.subject,
          teacher: {
            id: entry.teacher.id,
            name: `${entry.teacher.firstName} ${entry.teacher.lastName}`,
            department: entry.teacher.teacherProfile?.department
          },
          className: entry.className,
          startTime: entry.startTime,
          endTime: entry.endTime,
          createdBy: entry.createdBy ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : null
        });
      });
    } else if (view === 'teacher') {
      // Teacher view - organize by teacher
      transformedData = {};
      timetable.forEach(entry => {
        const teacherKey = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
        if (!transformedData[teacherKey]) {
          transformedData[teacherKey] = {
            teacher: {
              id: entry.teacher.id,
              name: teacherKey,
              email: entry.teacher.email,
              department: entry.teacher.teacherProfile?.department
            },
            schedule: {}
          };
          DAYS_OF_WEEK.forEach(day => {
            transformedData[teacherKey].schedule[day] = {};
          });
        }
        
        if (!transformedData[teacherKey].schedule[entry.dayOfWeek][entry.period]) {
          transformedData[teacherKey].schedule[entry.dayOfWeek][entry.period] = [];
        }
        
        transformedData[teacherKey].schedule[entry.dayOfWeek][entry.period].push({
          id: entry.id,
          subject: entry.subject,
          className: entry.className,
          startTime: entry.startTime,
          endTime: entry.endTime
        });
      });
    } else {
      // List view - simple list
      transformedData = timetable.map(entry => ({
        id: entry.id,
        dayOfWeek: entry.dayOfWeek,
        period: entry.period,
        subject: entry.subject,
        className: entry.className,
        teacher: {
          id: entry.teacher.id,
          name: `${entry.teacher.firstName} ${entry.teacher.lastName}`,
          email: entry.teacher.email,
          department: entry.teacher.teacherProfile?.department
        },
        startTime: entry.startTime,
        endTime: entry.endTime,
        createdAt: entry.createdAt,
        createdBy: entry.createdBy ? `${entry.createdBy.firstName} ${entry.createdBy.lastName}` : null
      }));
    }

    // Calculate statistics
    const stats = {
      totalSlots: timetable.length,
      uniqueTeachers: [...new Set(timetable.map(t => t.teacherId))].length,
      uniqueClasses: [...new Set(timetable.map(t => t.className))].length,
      uniqueSubjects: [...new Set(timetable.map(t => t.subject))].length,
      utilizationByDay: DAYS_OF_WEEK.map(day => ({
        day,
        slotsUsed: timetable.filter(t => t.dayOfWeek === day).length,
        totalPossibleSlots: Object.keys(PERIODS).filter(p => p !== 'BREAK' && p !== 'LUNCH').length
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        timetable: transformedData,
        periods: PERIODS,
        daysOfWeek: DAYS_OF_WEEK,
        availableClasses: availableClasses.map(c => c.className).sort(),
        availableTeachers: availableTeachers.map(t => ({
          id: t.id,
          name: `${t.firstName} ${t.lastName}`,
          department: t.teacherProfile?.department
        })),
        subjects: subjects,
        statistics: stats,
        filters: {
          view,
          className,
          dayOfWeek,
          teacherId
        }
      }
    });

  } catch (error) {
    console.error('Timetable GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { className, dayOfWeek, period, subject, teacherId, bulkEntries } = await request.json();

    // Handle bulk creation
    if (bulkEntries && Array.isArray(bulkEntries)) {
      const results = {
        successful: [],
        failed: [],
        conflicts: []
      };

      for (const entry of bulkEntries) {
        try {
          // Validate entry
          if (!entry.className || !entry.dayOfWeek || !entry.period || !entry.subject || !entry.teacherId) {
            results.failed.push({
              entry,
              error: 'Missing required fields'
            });
            continue;
          }

          // Check for conflicts - simplified conflict detection
          const existingEntry = await prisma.timetable.findFirst({
            where: {
              schoolId: user.schoolId,
              OR: [
                {
                  className: entry.className,
                  dayOfWeek: entry.dayOfWeek,
                  period: parseInt(entry.period)
                },
                {
                  teacherId: entry.teacherId,
                  dayOfWeek: entry.dayOfWeek,
                  period: parseInt(entry.period)
                }
              ]
            }
          });

          if (existingEntry) {
            results.conflicts.push({
              entry,
              conflicts: ['Time slot conflict detected']
            });
            continue;
          }

          // Create entry
          const periodTimes = PERIODS[entry.period];
          const timetableEntry = await prisma.timetable.create({
            data: {
              schoolId: user.schoolId,
              className: entry.className,
              dayOfWeek: entry.dayOfWeek,
              period: parseInt(entry.period),
              subject: entry.subject,
              teacherId: entry.teacherId,
              startTime: periodTimes.start,
              endTime: periodTimes.end,
              createdById: user.id
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

          results.successful.push(timetableEntry);

        } catch (error) {
          results.failed.push({
            entry,
            error: error.message
          });
        }
      }

      return NextResponse.json({
        success: true,
        message: `Bulk creation completed. ${results.successful.length} entries created successfully.`,
        data: results
      });
    }

    // Single entry creation
    if (!className || !dayOfWeek || !period || !subject || !teacherId) {
      return NextResponse.json({
        error: 'Missing required fields: className, dayOfWeek, period, subject, teacherId'
      }, { status: 400 });
    }

    // Validate day of week
    if (!DAYS_OF_WEEK.includes(dayOfWeek)) {
      return NextResponse.json({
        error: `Invalid day of week. Must be one of: ${DAYS_OF_WEEK.join(', ')}`
      }, { status: 400 });
    }

    // Validate period
    const periodNum = parseInt(period);
    if (!PERIODS[periodNum] || period === 'BREAK' || period === 'LUNCH') {
      return NextResponse.json({
        error: `Invalid period. Must be one of: ${Object.keys(PERIODS).filter(p => p !== 'BREAK' && p !== 'LUNCH').join(', ')}`
      }, { status: 400 });
    }

    // Check for existing class timetable entry (class conflict)
    const existingClass = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        className,
        dayOfWeek,
        period: periodNum
      }
    });

    if (existingClass) {
      return NextResponse.json({
        error: 'Time slot already occupied for this class'
      }, { status: 409 });
    }

    // Check for teacher availability (teacher conflict)
    const teacherConflict = await prisma.timetable.findFirst({
      where: {
        schoolId: user.schoolId,
        teacherId,
        dayOfWeek,
        period: periodNum
      }
    });

    if (teacherConflict) {
      return NextResponse.json({
        error: 'Teacher already has a class at this time'
      }, { status: 409 });
    }

    // Verify teacher exists and belongs to school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: user.schoolId,
        role: 'teacher',
        isActive: true
      }
    });

    if (!teacher) {
      return NextResponse.json({
        error: 'Teacher not found or invalid'
      }, { status: 400 });
    }

    // Create timetable entry
    const periodTimes = PERIODS[periodNum];
    const timetableEntry = await prisma.timetable.create({
      data: {
        schoolId: user.schoolId,
        className,
        dayOfWeek,
        period: periodNum,
        subject,
        teacherId,
        startTime: periodTimes.start,
        endTime: periodTimes.end,
        createdById: user.id
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable entry created successfully',
      data: {
        id: timetableEntry.id,
        className: timetableEntry.className,
        dayOfWeek: timetableEntry.dayOfWeek,
        period: timetableEntry.period,
        subject: timetableEntry.subject,
        teacher: {
          id: timetableEntry.teacherId,
          name: `${timetableEntry.teacher.firstName} ${timetableEntry.teacher.lastName}`,
          email: timetableEntry.teacher.email
        },
        startTime: timetableEntry.startTime,
        endTime: timetableEntry.endTime,
        createdAt: timetableEntry.createdAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Timetable POST error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');
    const { className, dayOfWeek, period, subject, teacherId } = await request.json();

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify entry exists and belongs to school
    const existingEntry = await prisma.timetable.findFirst({
      where: {
        id: entryId,
        schoolId: user.schoolId
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    // Build update data
    const updateData = {};
    if (className) updateData.className = className;
    if (dayOfWeek) updateData.dayOfWeek = dayOfWeek;
    if (subject) updateData.subject = subject;
    if (teacherId) updateData.teacherId = teacherId;
    
    if (period) {
      const periodNum = parseInt(period);
      updateData.period = periodNum;
      const periodTimes = PERIODS[periodNum];
      updateData.startTime = periodTimes.start;
      updateData.endTime = periodTimes.end;
    }

    // Check for conflicts if updating critical fields
    if (className || dayOfWeek || period || teacherId) {
      const checkData = {
        className: className || existingEntry.className,
        dayOfWeek: dayOfWeek || existingEntry.dayOfWeek,
        period: period ? parseInt(period) : existingEntry.period,
        teacherId: teacherId || existingEntry.teacherId
      };

      // Class conflict check (exclude current entry)
      const classConflict = await prisma.timetable.findFirst({
        where: {
          schoolId: user.schoolId,
          className: checkData.className,
          dayOfWeek: checkData.dayOfWeek,
          period: checkData.period,
          NOT: { id: entryId }
        }
      });

      if (classConflict) {
        return NextResponse.json({
          error: 'Time slot already occupied for this class'
        }, { status: 409 });
      }

      // Teacher conflict check (exclude current entry)
      const teacherConflict = await prisma.timetable.findFirst({
        where: {
          schoolId: user.schoolId,
          teacherId: checkData.teacherId,
          dayOfWeek: checkData.dayOfWeek,
          period: checkData.period,
          NOT: { id: entryId }
        }
      });

      if (teacherConflict) {
        return NextResponse.json({
          error: 'Teacher already has a class at this time'
        }, { status: 409 });
      }
    }

    // Update entry
    const updatedEntry = await prisma.timetable.update({
      where: { id: entryId },
      data: updateData,
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable entry updated successfully',
      data: updatedEntry
    });

  } catch (error) {
    console.error('Timetable PUT error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const entryId = searchParams.get('id');

    if (!entryId) {
      return NextResponse.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify entry exists and belongs to school
    const existingEntry = await prisma.timetable.findFirst({
      where: {
        id: entryId,
        schoolId: user.schoolId
      }
    });

    if (!existingEntry) {
      return NextResponse.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    // Delete entry
    await prisma.timetable.delete({
      where: { id: entryId }
    });

    return NextResponse.json({
      success: true,
      message: 'Timetable entry deleted successfully'
    });

  } catch (error) {
    console.error('Timetable DELETE error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}