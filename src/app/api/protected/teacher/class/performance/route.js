// /app/api/protected/teacher/class/performance/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper function to determine current term
function getCurrentTerm(date) {
  const month = date.getMonth() + 1;
  
  if (month >= 9 && month <= 12) {
    return 'First Term';
  } else if (month >= 1 && month <= 4) {
    return 'Second Term';
  } else {
    return 'Third Term';
  }
}

export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const performance = searchParams.get('performance');
    const sortBy = searchParams.get('sortBy') || 'overall';
    const search = searchParams.get('search') || '';

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    if (assignedClasses.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          students: [],
          overview: {
            classAverage: 0,
            studentsAbove70: 0,
            atRiskStudents: 0,
            averageAttendance: 0
          },
          message: 'No class assigned to this class teacher'
        }
      });
    }

    // Build where conditions for students
    let whereConditions = {
      schoolId: user.schoolId,
      role: 'student',
      isActive: true,
      studentProfile: {
        className: {
          in: assignedClasses
        }
      }
    };

    // Add search filter
    if (search) {
      whereConditions.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { 
          studentProfile: {
            studentId: { contains: search, mode: 'insensitive' }
          }
        }
      ];
    }

    // Get students with their profiles
    const students = await prisma.user.findMany({
      where: whereConditions,
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get current academic year and term
    const currentDate = new Date();
    const academicYear = currentDate.getFullYear().toString();
    const currentTerm = getCurrentTerm(currentDate);

    // Calculate performance data for each student
    const studentsWithPerformance = await Promise.all(
      students.map(async (student) => {
        // Get grades for current term
        const grades = await prisma.grade.findMany({
          where: {
            studentId: student.id,
            schoolId: user.schoolId,
            termName: currentTerm,
            academicYear: academicYear
          },
          include: {
            subject: true
          }
        });

        // Calculate overall average
        const overallAverage = grades.length > 0 
          ? grades.reduce((sum, grade) => sum + Number(grade.percentage), 0) / grades.length
          : 0;

        // Get attendance data for current term (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const attendanceRecords = await prisma.attendance.findMany({
          where: {
            studentId: student.id,
            schoolId: user.schoolId,
            date: {
              gte: thirtyDaysAgo
            }
          }
        });

        const presentDays = attendanceRecords.filter(record => 
          record.status === 'present' || record.status === 'late'
        ).length;
        const totalDays = attendanceRecords.length;
        const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        // Get assignment completion data
        const assignments = await prisma.assignment.findMany({
          where: {
            schoolId: user.schoolId,
            classes: {
              hasSome: [student.studentProfile?.className].filter(Boolean)
            },
            status: 'active',
            createdAt: {
              gte: thirtyDaysAgo
            }
          }
        });

        const submissions = await prisma.assignmentSubmission.findMany({
          where: {
            studentId: student.id,
            assignment: {
              id: {
                in: assignments.map(a => a.id)
              }
            }
          }
        });

        const assignmentCompletion = assignments.length > 0 
          ? (submissions.length / assignments.length) * 100
          : 0;

        // Get subject breakdown
        const subjectBreakdown = [];
        if (subject === 'all' || !subject) {
          const subjectGrades = {};
          grades.forEach(grade => {
            const subjectName = grade.subject.name;
            if (!subjectGrades[subjectName]) {
              subjectGrades[subjectName] = [];
            }
            subjectGrades[subjectName].push(Number(grade.percentage));
          });

          Object.entries(subjectGrades).forEach(([subjectName, scores]) => {
            const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
            subjectBreakdown.push({
              name: subjectName,
              average: average,
              gradeCount: scores.length
            });
          });
        }

        // Get active alerts
        const alerts = await prisma.studentAlert.findMany({
          where: {
            studentId: student.id,
            schoolId: user.schoolId,
            status: 'active'
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        });

        // Determine performance trend
        const trend = overallAverage >= 70 ? 'stable' : 
                     overallAverage >= 50 ? 'stable' : 'declining';

        return {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          email: student.email,
          avatar: student.avatar,
          profile: student.studentProfile ? {
            studentId: student.studentProfile.studentId,
            className: student.studentProfile.className,
            section: student.studentProfile.section,
            department: student.studentProfile.department,
            parentName: student.studentProfile.parentName,
            parentPhone: student.studentProfile.parentPhone,
            parentEmail: student.studentProfile.parentEmail
          } : null,
          performance: {
            overallAverage: Number(overallAverage.toFixed(1)),
            trend: trend,
            subjectBreakdown: subjectBreakdown,
            assignmentCompletion: Number(assignmentCompletion.toFixed(1)),
            lastUpdated: currentDate
          },
          attendance: {
            rate: Number(attendanceRate.toFixed(1)),
            presentDays: presentDays,
            totalDays: totalDays,
            period: '30 days'
          },
          alerts: alerts.map(alert => ({
            id: alert.id,
            type: alert.alertType,
            title: alert.title,
            priority: alert.priority,
            createdAt: alert.createdAt
          }))
        };
      })
    );

    // Apply performance filter
    let filteredStudents = studentsWithPerformance;
    if (performance && performance !== 'all') {
      filteredStudents = studentsWithPerformance.filter(student => {
        const avg = student.performance.overallAverage;
        const attendance = student.attendance.rate;
        
        switch (performance) {
          case 'excellent': return avg >= 80;
          case 'good': return avg >= 70 && avg < 80;
          case 'average': return avg >= 60 && avg < 70;
          case 'poor': return avg < 60;
          case 'at_risk': return avg < 50 || attendance < 75;
          default: return true;
        }
      });
    }

    // Sort students
    filteredStudents.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'attendance':
          return b.attendance.rate - a.attendance.rate;
        case 'recent_grades':
          return b.performance.overallAverage - a.performance.overallAverage;
        case 'overall':
        default:
          return b.performance.overallAverage - a.performance.overallAverage;
      }
    });

    // Calculate overview statistics
    const overview = {
      classAverage: studentsWithPerformance.length > 0 
        ? studentsWithPerformance.reduce((sum, s) => sum + s.performance.overallAverage, 0) / studentsWithPerformance.length
        : 0,
      studentsAbove70: studentsWithPerformance.filter(s => s.performance.overallAverage >= 70).length,
      atRiskStudents: studentsWithPerformance.filter(s => 
        s.performance.overallAverage < 50 || s.attendance.rate < 75
      ).length,
      averageAttendance: studentsWithPerformance.length > 0
        ? studentsWithPerformance.reduce((sum, s) => sum + s.attendance.rate, 0) / studentsWithPerformance.length
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        students: filteredStudents,
        overview: {
          classAverage: Number(overview.classAverage.toFixed(1)),
          studentsAbove70: overview.studentsAbove70,
          atRiskStudents: overview.atRiskStudents,
          averageAttendance: Number(overview.averageAttendance.toFixed(1))
        },
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          assignedClasses: assignedClasses
        },
        metadata: {
          totalStudents: studentsWithPerformance.length,
          filteredCount: filteredStudents.length,
          currentTerm: currentTerm,
          academicYear: academicYear
        }
      }
    });

  } catch (error) {
    console.error('Class teacher performance GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}