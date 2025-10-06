// app/api/protected/teachers/director/timetable/generate/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

// Subject priority configuration
const SUBJECT_PRIORITIES = {
  CORE: { priority: 1, minPeriods: 2, maxPeriods: 4 },
  SCIENCE: { priority: 2, minPeriods: 2, maxPeriods: 3 },
  ARTS: { priority: 3, minPeriods: 2, maxPeriods: 3 },
  COMMERCIAL: { priority: 3, minPeriods: 2, maxPeriods: 3 },
  VOCATIONAL: { priority: 4, minPeriods: 1, maxPeriods: 2 }
};

// Recommended max periods per teacher per week
const MAX_RECOMMENDED_LOAD = 25;
const OPTIMAL_LOAD = 20;

export async function POST(req) {
  try {
    const user = await requireAuth(['director']);
    const body = await req.json();
    const { className, overwrite = false } = body;

    if (!className) {
      return NextResponse.json(
        { success: false, error: 'Class name is required' },
        { status: 400 }
      );
    }

    const schoolId = user.schoolId;
    const userId = user.id;

    // Get class stage for subject filtering
    const classStage = className.startsWith('JS') ? 'JS' : className.startsWith('SS') ? 'SS' : '';
    const classLevel = className.match(/^(JS|SS)([1-3])/)?.[0] || '';

    // Fetch subjects applicable to this class
    let subjects;
    try {
      subjects = await prisma.subject.findMany({
        where: {
          schoolId,
          isActive: true,
          OR: [
            { classes: { has: className } },
            { classes: { has: classLevel } },
            { classes: { has: classStage } },
            { classes: { isEmpty: true } }
          ]
        },
        include: {
          teachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      isActive: true
                    }
                  }
                }
              }
            }
          }
        }
      });
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      return NextResponse.json(
        { success: false, error: 'Failed to connect to the database. Please try again later.' },
        { status: 500 }
      );
    }

    if (subjects.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No subjects found for this class',
        recommendation: 'Please add subjects to the system first'
      }, { status: 400 });
    }

    // Get available periods from existing timetable structure
    const existingTimetable = await prisma.timetable.findFirst({
      where: { schoolId },
      select: { startTime: true, endTime: true }
    });

    // Define default periods if none exist
    const defaultPeriods = {
      '1': { start: '08:00', end: '09:05' },
      '2': { start: '09:05', end: '10:10' },
      '3': { start: '10:10', end: '11:20' },
      '4': { start: '11:35', end: '12:40' },
      '5': { start: '12:40', end: '13:45' },
      '6': { start: '13:45', end: '14:15' },
      '7': { start: '14:30', end: '15:35' },
      '8': { start: '15:35', end: '16:00' }
    };

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const periodsPerDay = Object.keys(defaultPeriods).length;
    const totalSlots = daysOfWeek.length * periodsPerDay;

    // Delete existing timetable if overwrite is true
    if (overwrite) {
      await prisma.timetable.deleteMany({
        where: { schoolId, className }
      });
    } else {
      // Check if timetable already exists
      const existing = await prisma.timetable.findFirst({
        where: { schoolId, className }
      });

      if (existing) {
        return NextResponse.json({
          success: false,
          error: 'Timetable already exists for this class',
          recommendation: 'Enable "overwrite" option to replace existing timetable'
        }, { status: 400 });
      }
    }

    // Prepare subjects with teachers and priority
    const subjectsWithTeachers = subjects.map(subject => {
      const priority = SUBJECT_PRIORITIES[subject.category] || SUBJECT_PRIORITIES.VOCATIONAL;
      const teachers = subject.teachers
        .filter(t => t.teacher.user.isActive)
        .map(t => ({
          id: t.teacher.user.id,
          name: `${t.teacher.user.firstName} ${t.teacher.user.lastName}`
        }));

      return {
        id: subject.id,
        name: subject.name,
        category: subject.category,
        priority: priority.priority,
        minPeriods: priority.minPeriods,
        maxPeriods: priority.maxPeriods,
        teachers: teachers,
        hasTeacher: teachers.length > 0
      };
    }).sort((a, b) => a.priority - b.priority);

    // Calculate total required periods
    const totalRequiredPeriods = subjectsWithTeachers.reduce(
      (sum, subject) => sum + subject.minPeriods,
      0
    );

    if (totalRequiredPeriods > totalSlots) {
      return NextResponse.json({
        success: false,
        error: 'Not enough time slots to fit all required subjects',
        recommendation: `Need ${totalRequiredPeriods} periods but only ${totalSlots} available. Consider reducing subject requirements or adding more periods.`
      }, { status: 400 });
    }

    // Distribute subjects across periods
    const schedule = {};
    const teacherLoad = {};

    // Initialize schedule structure
    daysOfWeek.forEach(day => {
      schedule[day] = {};
      Object.keys(defaultPeriods).forEach(period => {
        schedule[day][period] = null;
      });
    });

    // First pass: Allocate minimum required periods for each subject
    for (const subject of subjectsWithTeachers) {
      let allocated = 0;
      const targetPeriods = subject.minPeriods;

      for (const day of daysOfWeek) {
        if (allocated >= targetPeriods) break;

        for (const period of Object.keys(defaultPeriods)) {
          if (allocated >= targetPeriods) break;
          if (schedule[day][period] === null) {
            const teacher = subject.teachers.length > 0 
              ? getLeastLoadedTeacher(subject.teachers, teacherLoad)
              : null;

            schedule[day][period] = {
              subject: subject.name,
              subjectId: subject.id,
              teacher: teacher,
              category: subject.category,
              needsTeacher: !teacher
            };

            if (teacher) {
              teacherLoad[teacher.id] = (teacherLoad[teacher.id] || 0) + 1;
            }

            allocated++;
          }
        }
      }
    }

    // Second pass: Fill remaining slots with lower priority subjects or additional core periods
    const remainingSlots = [];
    daysOfWeek.forEach(day => {
      Object.keys(defaultPeriods).forEach(period => {
        if (schedule[day][period] === null) {
          remainingSlots.push({ day, period });
        }
      });
    });

    for (const slot of remainingSlots) {
      // Prioritize adding more periods to core subjects
      const coreSubjects = subjectsWithTeachers.filter(
        s => s.category === 'CORE' && countSubjectPeriods(schedule, s.name) < s.maxPeriods
      );

      if (coreSubjects.length > 0) {
        const subject = coreSubjects[0];
        const teacher = subject.teachers.length > 0 
          ? getLeastLoadedTeacher(subject.teachers, teacherLoad)
          : null;

        schedule[slot.day][slot.period] = {
          subject: subject.name,
          subjectId: subject.id,
          teacher: teacher,
          category: subject.category,
          needsTeacher: !teacher
        };

        if (teacher) {
          teacherLoad[teacher.id] = (teacherLoad[teacher.id] || 0) + 1;
        }
      }
    }

    // Create timetable entries in database
    const timetableEntries = [];
    for (const day of daysOfWeek) {
      for (const period of Object.keys(defaultPeriods)) {
        const entry = schedule[day][period];
        if (entry) {
          timetableEntries.push({
            schoolId,
            className,
            dayOfWeek: day,
            period: parseInt(period),
            subject: entry.subject,
            teacherId: entry.teacher?.id || userId, // Use creator as fallback
            startTime: defaultPeriods[period].start,
            endTime: defaultPeriods[period].end,
            createdById: userId
          });
        }
      }
    }

    // Insert all entries
    await prisma.timetable.createMany({
      data: timetableEntries
    });

    // Calculate statistics and recommendations
    const stats = calculateStatistics(schedule, teacherLoad, subjectsWithTeachers);

    return NextResponse.json({
      success: true,
      message: stats.warnings.length > 0 
        ? 'Timetable generated with recommendations'
        : 'Timetable generated successfully',
      data: {
        className,
        totalPeriods: timetableEntries.length,
        subjectsIncluded: subjectsWithTeachers.length,
        teachersInvolved: Object.keys(teacherLoad).length,
        utilizationRate: Math.round((timetableEntries.length / totalSlots) * 100),
        summary: {
          coreSubjects: countByCategory(schedule, 'CORE'),
          scienceSubjects: countByCategory(schedule, 'SCIENCE'),
          artsSubjects: countByCategory(schedule, 'ARTS'),
          otherSubjects: countByCategory(schedule, 'COMMERCIAL') + countByCategory(schedule, 'VOCATIONAL')
        },
        recommendations: stats,
        subjectsWithoutTeachers: subjectsWithTeachers
          .filter(s => !s.hasTeacher)
          .map(s => s.name)
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Timetable generation error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to generate timetable',
      details: error.message
    }, { status: 500 });
  }
}

// Helper functions
function getLeastLoadedTeacher(teachers, teacherLoad) {
  if (teachers.length === 0) return null;
  
  return teachers.reduce((least, current) => {
    const currentLoad = teacherLoad[current.id] || 0;
    const leastLoad = teacherLoad[least.id] || 0;
    return currentLoad < leastLoad ? current : least;
  }, teachers[0]);
}

function countSubjectPeriods(schedule, subjectName) {
  let count = 0;
  Object.values(schedule).forEach(day => {
    Object.values(day).forEach(entry => {
      if (entry && entry.subject === subjectName) count++;
    });
  });
  return count;
}

function countByCategory(schedule, category) {
  let count = 0;
  Object.values(schedule).forEach(day => {
    Object.values(day).forEach(entry => {
      if (entry && entry.category === category) count++;
    });
  });
  return count;
}

function calculateStatistics(schedule, teacherLoad, subjects) {
  const totalTeachers = Object.keys(teacherLoad).length;
  const totalPeriods = Object.values(schedule).reduce((sum, day) => {
    return sum + Object.values(day).filter(e => e !== null).length;
  }, 0);

  const averageLoad = totalTeachers > 0 ? totalPeriods / totalTeachers : 0;
  const recommendedTeachers = Math.ceil(totalPeriods / OPTIMAL_LOAD);
  
  const overloadedTeachers = Object.entries(teacherLoad)
    .filter(([_, load]) => load > MAX_RECOMMENDED_LOAD)
    .map(([id, load]) => {
      const teacher = subjects
        .flatMap(s => s.teachers)
        .find(t => t.id === id);
      return {
        id,
        name: teacher?.name || 'Unknown',
        currentLoad: load,
        recommended: MAX_RECOMMENDED_LOAD
      };
    });

  return {
    currentTeachers: totalTeachers,
    recommendedTeachers,
    averageLoadPerTeacher: Math.round(averageLoad),
    maxRecommendedLoad: MAX_RECOMMENDED_LOAD,
    needMoreTeachers: totalTeachers < recommendedTeachers,
    overloadedTeachers,
    warnings: overloadedTeachers.length > 0 
      ? ['Some teachers exceed recommended workload']
      : []
  };
}