// app/api/protected/teachers/director/students/reports/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

export async function GET(request) {
  try {
    const user = await requireAuth(['teacher']);
    
    if (user.department !== 'director') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'overview';
    const period = searchParams.get('period') || 'month';
    const classFilter = searchParams.get('class');
    const format = searchParams.get('format') || 'json';

    // Get students in director's school
    const students = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true,
        ...(classFilter && {
          studentProfile: {
            className: classFilter
          }
        })
      },
      include: {
        studentProfile: true,
        receivedGrades: {
          include: {
            subject: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        attendance: {
          orderBy: {
            date: 'desc'
          }
        },
        performanceMetrics: {
          orderBy: {
            lastCalculated: 'desc'
          },
          take: 1
        }
      }
    });

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'term':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const reportData = {};

    // Overview Report
    if (type === 'overview') {
      const totalStudents = students.length;
      const newStudents = students.filter(s => 
        new Date(s.createdAt) >= startDate
      ).length;
      
      const recentLogins = students.filter(s => 
        s.lastLogin && new Date(s.lastLogin) >= startDate
      ).length;
      
      const activeRate = totalStudents > 0 
        ? Math.round((recentLogins / totalStudents) * 100) 
        : 0;

      // Distribution by class
      const byClass = students.reduce((acc, student) => {
        const className = student.studentProfile?.className || 'Unassigned';
        const existing = acc.find(item => item.className === className);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ className, count: 1 });
        }
        return acc;
      }, []);

      // Distribution by gender
      const byGender = students.reduce((acc, student) => {
        const gender = student.gender || 'Not Specified';
        const existing = acc.find(item => item.gender === gender);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ gender, count: 1 });
        }
        return acc;
      }, []);

      // Distribution by age
      const byAge = students.reduce((acc, student) => {
        if (student.dateOfBirth) {
          const age = Math.floor(
            (new Date() - new Date(student.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)
          );
          const existing = acc.find(item => item.age === age);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ age, count: 1 });
          }
        }
        return acc;
      }, []).sort((a, b) => a.age - b.age);

      reportData.overview = {
        totalStudents,
        newStudents,
        recentLogins,
        activeRate
      };

      reportData.distributions = {
        byClass,
        byGender,
        byAge
      };
    }

    // Detailed List Report
    if (type === 'detailed') {
      reportData.students = students.map(student => ({
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        className: student.studentProfile?.className,
        studentId: student.studentProfile?.studentId,
        gender: student.gender,
        age: student.dateOfBirth 
          ? Math.floor((new Date() - new Date(student.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000))
          : null,
        parentName: student.studentProfile?.parentName,
        parentPhone: student.studentProfile?.parentPhone,
        parentEmail: student.studentProfile?.parentEmail,
        address: student.address,
        isActive: student.isActive,
        lastLogin: student.lastLogin,
        createdAt: student.createdAt
      }));
    }

    // Performance Report
    if (type === 'performance') {
      const studentsWithGrades = students.filter(s => s.receivedGrades.length > 0);
      
      const totalGrades = studentsWithGrades.reduce((sum, s) => sum + s.receivedGrades.length, 0);
      const averageGrade = totalGrades > 0
        ? Math.round(
            studentsWithGrades.reduce((sum, s) => {
              const studentAvg = s.receivedGrades.reduce((gSum, g) => gSum + Number(g.percentage), 0) / s.receivedGrades.length;
              return sum + studentAvg;
            }, 0) / studentsWithGrades.length
          )
        : 0;

      const topPerformers = studentsWithGrades.length;
      const atRisk = students.filter(s => 
        s.performanceMetrics[0]?.isAtRisk || 
        (s.receivedGrades.length > 0 && 
          (s.receivedGrades.reduce((sum, g) => sum + Number(g.percentage), 0) / s.receivedGrades.length) < 50)
      ).length;

      // Performance by subject
      const subjectPerformance = {};
      students.forEach(student => {
        student.receivedGrades.forEach(grade => {
          const subjectName = grade.subject.name;
          if (!subjectPerformance[subjectName]) {
            subjectPerformance[subjectName] = {
              subject: subjectName,
              totalScore: 0,
              count: 0
            };
          }
          subjectPerformance[subjectName].totalScore += Number(grade.percentage);
          subjectPerformance[subjectName].count++;
        });
      });

      const bySubject = Object.values(subjectPerformance).map(subj => ({
        subject: subj.subject,
        averageScore: Math.round(subj.totalScore / subj.count)
      })).sort((a, b) => b.averageScore - a.averageScore);

      reportData.performance = {
        averageGrade,
        topPerformers,
        atRisk
      };

      reportData.bySubject = bySubject;
    }

    // Attendance Report
    if (type === 'attendance') {
      const studentsWithAttendance = students.filter(s => s.attendance.length > 0);
      
      const totalAttendance = studentsWithAttendance.reduce((sum, s) => {
        const presentCount = s.attendance.filter(a => a.status === 'present').length;
        const totalCount = s.attendance.length;
        return sum + (totalCount > 0 ? (presentCount / totalCount) * 100 : 0);
      }, 0);

      const averageRate = studentsWithAttendance.length > 0
        ? Math.round(totalAttendance / studentsWithAttendance.length)
        : 0;

      const perfectAttendance = students.filter(s => 
        s.attendance.length > 0 && s.attendance.every(a => a.status === 'present')
      ).length;

      const chronicAbsence = students.filter(s => {
        const presentCount = s.attendance.filter(a => a.status === 'present').length;
        const totalCount = s.attendance.length;
        return totalCount > 0 && (presentCount / totalCount) < 0.8;
      }).length;

      // Attendance trends
      const trends = [];
      const daysToCheck = 30;
      for (let i = 0; i < daysToCheck; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const dayAttendance = students.reduce((acc, s) => {
          const dayRecord = s.attendance.find(a => 
            new Date(a.date).toISOString().split('T')[0] === dateStr
          );
          if (dayRecord) {
            acc.total++;
            if (dayRecord.status === 'present') acc.present++;
          }
          return acc;
        }, { total: 0, present: 0 });

        if (dayAttendance.total > 0) {
          trends.push({
            date: dateStr,
            attendanceRate: Math.round((dayAttendance.present / dayAttendance.total) * 100)
          });
        }
      }

      reportData.attendance = {
        averageRate,
        perfectAttendance,
        chronicAbsence
      };

      reportData.trends = trends.reverse();
    }

    // Demographics Report
    if (type === 'demographics') {
      const genderDist = students.reduce((acc, s) => {
        const gender = s.gender || 'Not Specified';
        const existing = acc.find(item => item.name === gender);
        if (existing) {
          existing.value++;
        } else {
          acc.push({ name: gender, value: 1 });
        }
        return acc;
      }, []);

      const locationDist = students.reduce((acc, s) => {
        if (s.address) {
          // Extract city/area from address (simplified)
          const location = s.address.split(',')[0] || 'Unknown';
          const existing = acc.find(item => item.location === location);
          if (existing) {
            existing.count++;
          } else {
            acc.push({ location, count: 1 });
          }
        }
        return acc;
      }, []).sort((a, b) => b.count - a.count).slice(0, 10);

      reportData.demographics = {
        gender: genderDist,
        location: locationDist
      };
    }

    return NextResponse.json({
      success: true,
      data: reportData
    });
  } catch (error) {
    console.error('Reports error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate report' },
      { status: 500 }
    );
  }
}