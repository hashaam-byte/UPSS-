import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify coordinator access
async function verifyCoordinatorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'coordinator') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    const coordinator = await verifyCoordinatorAccess(token);
    const { searchParams } = new URL(request.url);

    const reportType = searchParams.get('type') || 'timetable_coverage';
    const classFilter = searchParams.get('class');
    const period = searchParams.get('period') || 'current_term';
    const format = searchParams.get('format') || 'json';

    // Get coordinator's assigned classes
    const coordinatorSubjects = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: { id: coordinator.id }
        }
      }
    });

    const coordinatorClasses = [...new Set(
      coordinatorSubjects.flatMap(ts => ts.classes)
    )];

    if (coordinatorClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          message: 'No classes assigned to this coordinator',
          reportType,
          coordinatorClasses: []
        }
      });
    }

    switch (reportType) {
      case 'timetable_coverage': {
        const timetableCoverage = await generateTimetableCoverageReport(
          coordinator.schoolId, 
          coordinatorClasses, 
          classFilter
        );
        
        return NextResponse.json({
          success: true,
          data: {
            reportType: 'Timetable Coverage Report',
            period,
            generatedAt: new Date(),
            generatedBy: `${coordinator.firstName} ${coordinator.lastName}`,
            coordinatorClasses,
            ...timetableCoverage
          }
        });
      }

      case 'teacher_allocation': {
        const teacherAllocation = await generateTeacherAllocationReport(
          coordinator.schoolId, 
          coordinatorClasses, 
          classFilter
        );
        
        return NextResponse.json({
          success: true,
          data: {
            reportType: 'Teacher Allocation Report',
            period,
            generatedAt: new Date(),
            generatedBy: `${coordinator.firstName} ${coordinator.lastName}`,
            coordinatorClasses,
            ...teacherAllocation
          }
        });
      }

      case 'class_distribution': {
        const classDistribution = await generateClassDistributionReport(
          coordinator.schoolId, 
          coordinatorClasses, 
          classFilter
        );
        
        return NextResponse.json({
          success: true,
          data: {
            reportType: 'Class Distribution Report',
            period,
            generatedAt: new Date(),
            generatedBy: `${coordinator.firstName} ${coordinator.lastName}`,
            coordinatorClasses,
            ...classDistribution
          }
        });
      }

      case 'conflicts': {
        const conflicts = await generateConflictReport(
          coordinator.schoolId, 
          coordinatorClasses
        );
        
        return NextResponse.json({
          success: true,
          data: {
            reportType: 'Timetable Conflicts Report',
            period,
            generatedAt: new Date(),
            generatedBy: `${coordinator.firstName} ${coordinator.lastName}`,
            coordinatorClasses,
            ...conflicts
          }
        });
      }

      case 'summary': {
        const summary = await generateSummaryReport(
          coordinator.schoolId, 
          coordinatorClasses
        );
        
        return NextResponse.json({
          success: true,
          data: {
            reportType: 'Coordinator Summary Report',
            period,
            generatedAt: new Date(),
            generatedBy: `${coordinator.firstName} ${coordinator.lastName}`,
            coordinatorClasses,
            ...summary
          }
        });
      }

      default:
        return NextResponse.json({
          error: 'Invalid report type. Available types: timetable_coverage, teacher_allocation, class_distribution, conflicts, summary'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Coordinator reports error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions for report generation
async function generateTimetableCoverageReport(schoolId, coordinatorClasses, classFilter) {
  const targetClasses = classFilter ? [classFilter] : coordinatorClasses;
  
  const maxSlotsPerClass = 30; // 6 periods × 5 days
  const coverage = {};
  
  for (const className of targetClasses) {
    const timetableEntries = await prisma.timetable.findMany({
      where: {
        schoolId,
        className
      },
      include: {
        teacher: {
          select: {
            firstName: true,
            lastName: true,
            teacherProfile: {
              select: { department: true }
            }
          }
        }
      }
    });

    const slotsUsed = timetableEntries.length;
    const completionRate = Math.round((slotsUsed / maxSlotsPerClass) * 100);
    
    // Analyze by day and period
    const dayAnalysis = {};
    const subjectAnalysis = {};
    const teacherAnalysis = {};

    timetableEntries.forEach(entry => {
      // Day analysis
      if (!dayAnalysis[entry.dayOfWeek]) {
        dayAnalysis[entry.dayOfWeek] = 0;
      }
      dayAnalysis[entry.dayOfWeek]++;

      // Subject analysis
      if (!subjectAnalysis[entry.subject]) {
        subjectAnalysis[entry.subject] = 0;
      }
      subjectAnalysis[entry.subject]++;

      // Teacher analysis
      const teacherName = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
      if (!teacherAnalysis[teacherName]) {
        teacherAnalysis[teacherName] = {
          count: 0,
          department: entry.teacher.teacherProfile?.department
        };
      }
      teacherAnalysis[teacherName].count++;
    });

    coverage[className] = {
      totalSlots: maxSlotsPerClass,
      usedSlots: slotsUsed,
      emptySlots: maxSlotsPerClass - slotsUsed,
      completionRate,
      dayAnalysis,
      subjectAnalysis,
      teacherAnalysis
    };
  }

  return {
    coverage,
    overallStats: {
      totalClasses: targetClasses.length,
      averageCompletion: Math.round(
        Object.values(coverage).reduce((sum, c) => sum + c.completionRate, 0) / targetClasses.length
      ),
      totalSlotsUsed: Object.values(coverage).reduce((sum, c) => sum + c.usedSlots, 0),
      totalPossibleSlots: targetClasses.length * maxSlotsPerClass
    }
  };
}

async function generateTeacherAllocationReport(schoolId, coordinatorClasses, classFilter) {
  const targetClasses = classFilter ? [classFilter] : coordinatorClasses;
  
  // Get all subject-teacher assignments for coordinator's classes
  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: {
      classes: {
        hasSome: targetClasses
      }
    },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              isActive: true
            }
          }
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          category: true
        }
      }
    }
  });

  // Get all subjects that should be covered in these classes
  const allSubjects = await prisma.subject.findMany({
    where: {
      schoolId,
      isActive: true,
      classes: {
        hasSome: targetClasses
      }
    }
  });

  const teacherAllocation = {};
  const subjectCoverage = {};
  const unassignedSubjects = [];

  // Analyze teacher allocations
  teacherSubjects.forEach(ts => {
    const teacherName = `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`;
    const relevantClasses = ts.classes.filter(cls => targetClasses.includes(cls));
    
    if (relevantClasses.length === 0) return;

    if (!teacherAllocation[teacherName]) {
      teacherAllocation[teacherName] = {
        teacherId: ts.teacher.user.id,
        email: ts.teacher.user.email,
        isActive: ts.teacher.user.isActive,
        subjects: [],
        totalClasses: 0
      };
    }

    teacherAllocation[teacherName].subjects.push({
      name: ts.subject.name,
      code: ts.subject.code,
      category: ts.subject.category,
      classes: relevantClasses
    });
    
    teacherAllocation[teacherName].totalClasses += relevantClasses.length;

    // Track subject coverage
    if (!subjectCoverage[ts.subject.name]) {
      subjectCoverage[ts.subject.name] = {
        subjectId: ts.subject.id,
        code: ts.subject.code,
        category: ts.subject.category,
        teachers: [],
        coveredClasses: []
      };
    }

    subjectCoverage[ts.subject.name].teachers.push({
      name: teacherName,
      classes: relevantClasses
    });
    
    subjectCoverage[ts.subject.name].coveredClasses = [
      ...new Set([...subjectCoverage[ts.subject.name].coveredClasses, ...relevantClasses])
    ];
  });

  // Find unassigned subjects
  allSubjects.forEach(subject => {
    const hasAssignment = teacherSubjects.some(ts => 
      ts.subject.id === subject.id && 
      ts.classes.some(cls => targetClasses.includes(cls))
    );
    
    if (!hasAssignment) {
      unassignedSubjects.push({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        affectedClasses: subject.classes.filter(cls => targetClasses.includes(cls))
      });
    }
  });

  return {
    teacherAllocation,
    subjectCoverage,
    unassignedSubjects,
    statistics: {
      totalTeachers: Object.keys(teacherAllocation).length,
      totalSubjects: allSubjects.length,
      assignedSubjects: Object.keys(subjectCoverage).length,
      unassignedSubjects: unassignedSubjects.length,
      coverageRate: Math.round((Object.keys(subjectCoverage).length / allSubjects.length) * 100)
    }
  };
}

async function generateClassDistributionReport(schoolId, coordinatorClasses, classFilter) {
  const targetClasses = classFilter ? [classFilter] : coordinatorClasses;
  
  const classDistribution = {};

  for (const className of targetClasses) {
    const students = await prisma.user.findMany({
      where: {
        schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className
        }
      },
      include: {
        studentProfile: true
      }
    });

    // Analyze student distribution
    const genderDistribution = students.reduce((acc, student) => {
      const gender = student.gender || 'Not specified';
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    }, {});

    const ageDistribution = students.reduce((acc, student) => {
      if (student.dateOfBirth) {
        const age = Math.floor((new Date() - new Date(student.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000));
        const ageGroup = `${Math.floor(age / 5) * 5}-${Math.floor(age / 5) * 5 + 4}`;
        acc[ageGroup] = (acc[ageGroup] || 0) + 1;
      }
      return acc;
    }, {});

    classDistribution[className] = {
      totalStudents: students.length,
      genderDistribution,
      ageDistribution,
      recentEnrollments: students
        .filter(s => {
          const enrollmentDate = new Date(s.studentProfile?.admissionDate || s.createdAt);
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
          return enrollmentDate > thirtyDaysAgo;
        }).length,
      studentsWithParentContact: students.filter(s => 
        s.studentProfile?.parentPhone || s.studentProfile?.parentEmail
      ).length
    };
  }

  return {
    classDistribution,
    overallStats: {
      totalStudents: Object.values(classDistribution).reduce((sum, c) => sum + c.totalStudents, 0),
      averageClassSize: Math.round(
        Object.values(classDistribution).reduce((sum, c) => sum + c.totalStudents, 0) / targetClasses.length
      ),
      totalRecentEnrollments: Object.values(classDistribution).reduce((sum, c) => sum + c.recentEnrollments, 0)
    }
  };
}

async function generateConflictReport(schoolId, coordinatorClasses) {
  // Find teacher conflicts in timetables
  const allTimetableEntries = await prisma.timetable.findMany({
    where: {
      schoolId
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

  const conflicts = [];
  const teacherSchedules = {};

  // Build teacher schedules
  allTimetableEntries.forEach(entry => {
    const teacherKey = `${entry.teacher.firstName} ${entry.teacher.lastName}`;
    const timeKey = `${entry.dayOfWeek}-${entry.period}`;

    if (!teacherSchedules[teacherKey]) {
      teacherSchedules[teacherKey] = {};
    }

    if (!teacherSchedules[teacherKey][timeKey]) {
      teacherSchedules[teacherKey][timeKey] = [];
    }

    teacherSchedules[teacherKey][timeKey].push({
      id: entry.id,
      className: entry.className,
      subject: entry.subject,
      teacherId: entry.teacherId
    });
  });

  // Find conflicts
  Object.entries(teacherSchedules).forEach(([teacherName, schedule]) => {
    Object.entries(schedule).forEach(([timeKey, entries]) => {
      if (entries.length > 1) {
        // Teacher has multiple classes at the same time
        const [dayOfWeek, period] = timeKey.split('-');
        const coordinatorClassesInvolved = entries.filter(entry => 
          coordinatorClasses.includes(entry.className)
        );

        if (coordinatorClassesInvolved.length > 0) {
          conflicts.push({
            type: 'teacher_double_booking',
            teacher: teacherName,
            dayOfWeek,
            period: parseInt(period),
            conflictingEntries: entries,
            affectsCoordinatorClasses: coordinatorClassesInvolved.length > 0,
            coordinatorClassesInvolved: coordinatorClassesInvolved.map(e => e.className)
          });
        }
      }
    });
  });

  return {
    conflicts,
    conflictsSummary: {
      totalConflicts: conflicts.length,
      teacherConflicts: conflicts.filter(c => c.type === 'teacher_double_booking').length,
      affectingCoordinatorClasses: conflicts.filter(c => c.affectsCoordinatorClasses).length
    }
  };
}

async function generateSummaryReport(schoolId, coordinatorClasses) {
  const [
    totalStudents,
    totalTeachers,
    totalTimetableSlots,
    totalSubjects
  ] = await Promise.all([
    prisma.user.count({
      where: {
        schoolId,
        role: 'student',
        isActive: true,
        studentProfile: {
          className: {
            in: coordinatorClasses
          }
        }
      }
    }),
    
    prisma.user.count({
      where: {
        schoolId,
        role: 'teacher',
        isActive: true,
        teacherProfile: {
          teacherSubjects: {
            some: {
              classes: {
                hasSome: coordinatorClasses
              }
            }
          }
        }
      }
    }),
    
    prisma.timetable.count({
      where: {
        schoolId,
        className: {
          in: coordinatorClasses
        }
      }
    }),
    
    prisma.subject.count({
      where: {
        schoolId,
        isActive: true,
        classes: {
          hasSome: coordinatorClasses
        }
      }
    })
  ]);

  const maxPossibleSlots = coordinatorClasses.length * 30; // 30 slots per class
  const timetableCompletion = Math.round((totalTimetableSlots / maxPossibleSlots) * 100);

  return {
    summary: {
      coordinatorClasses,
      totalStudents,
      totalTeachers,
      totalSubjects,
      totalTimetableSlots,
      maxPossibleSlots,
      timetableCompletion,
      classCount: coordinatorClasses.length,
      averageStudentsPerClass: Math.round(totalStudents / coordinatorClasses.length)
    }
  };
}