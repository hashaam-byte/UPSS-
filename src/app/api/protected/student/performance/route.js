// /app/api/protected/student/performance/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify student access
async function verifyStudentAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { 
      studentProfile: true,
      school: true 
    }
  });

  if (!user || user.role !== 'student') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch student's performance analytics
export async function GET(request) {
  try {
    await requireAuth(['student']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const student = await verifyStudentAccess(token);
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'current_term';
    const subject = searchParams.get('subject') || 'all';

    // In production, this would calculate from actual grades, attendance, and assignment tables
    const performanceData = await calculateStudentPerformance(student, period, subject);

    return NextResponse.json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Student performance GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function calculateStudentPerformance(student, period, subject) {
  // TODO: In production, query actual data from:
  // - grades table for academic performance
  // - attendance table for attendance metrics
  // - assignment_submissions table for assignment data
  
  const studentClass = student.studentProfile?.className;
  const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];
  
  // Mock comprehensive performance data
  const subjectPerformance = subjects.map(subjectName => {
    const currentScore = Math.floor(Math.random() * 35) + 65; // 65-100
    const previousScore = Math.floor(Math.random() * 35) + 65;
    const trend = currentScore > previousScore ? 'improving' : 
                  currentScore < previousScore ? 'declining' : 'stable';
    
    return {
      subject: subjectName,
      currentAverage: currentScore,
      previousAverage: previousScore,
      trend: trend,
      improvement: currentScore - previousScore,
      grades: [
        { assessment: 'Test 1', score: Math.floor(Math.random() * 30) + 70, date: '2024-01-15' },
        { assessment: 'Quiz 1', score: Math.floor(Math.random() * 30) + 70, date: '2024-01-22' },
        { assessment: 'Assignment 1', score: Math.floor(Math.random() * 30) + 70, date: '2024-01-29' },
        { assessment: 'Test 2', score: Math.floor(Math.random() * 30) + 70, date: '2024-02-05' }
      ],
      assignments: {
        total: Math.floor(Math.random() * 10) + 15,
        submitted: Math.floor(Math.random() * 5) + 12,
        pending: Math.floor(Math.random() * 3) + 1
      },
      attendance: {
        rate: Math.floor(Math.random() * 20) + 80,
        present: Math.floor(Math.random() * 5) + 25,
        absent: Math.floor(Math.random() * 5) + 2
      }
    };
  });

  // Overall statistics
  const overallStats = {
    currentGPA: calculateGPA(subjectPerformance.map(s => s.currentAverage)),
    overallAverage: Math.round(subjectPerformance.reduce((sum, s) => sum + s.currentAverage, 0) / subjectPerformance.length),
    totalCredits: subjectPerformance.length * 3, // Mock credit system
    earnedCredits: subjectPerformance.filter(s => s.currentAverage >= 60).length * 3,
    classRank: Math.floor(Math.random() * 20) + 10,
    totalClassStudents: 45,
    attendanceRate: Math.floor(Math.random() * 15) + 85,
    assignmentCompletion: Math.round(
      subjectPerformance.reduce((sum, s) => sum + (s.assignments.submitted / s.assignments.total), 0) / subjectPerformance.length * 100
    )
  };

  // Performance trends over time
  const performanceTrends = {
    monthly: Array.from({ length: 6 }, (_, i) => ({
      month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
      average: Math.floor(Math.random() * 20) + 70,
      attendance: Math.floor(Math.random() * 15) + 85
    })),
    weekly: Array.from({ length: 8 }, (_, i) => ({
      week: `Week ${i + 1}`,
      performance: Math.floor(Math.random() * 20) + 70,
      assignments: Math.floor(Math.random() * 5) + 3
    }))
  };

  // Strengths and weaknesses analysis
  const strongSubjects = subjectPerformance.filter(s => s.currentAverage >= 85).map(s => s.subject);
  const weakSubjects = subjectPerformance.filter(s => s.currentAverage < 70).map(s => s.subject);
  const improvingSubjects = subjectPerformance.filter(s => s.trend === 'improving').map(s => s.subject);

  // Goals and recommendations
  const goals = [
    {
      type: 'academic',
      title: 'Improve Mathematics Performance',
      target: 85,
      current: subjectPerformance.find(s => s.subject === 'Mathematics')?.currentAverage || 75,
      deadline: '2024-03-31',
      progress: 65
    },
    {
      type: 'attendance',
      title: 'Maintain Perfect Attendance',
      target: 100,
      current: overallStats.attendanceRate,
      deadline: '2024-04-30',
      progress: 90
    }
  ];

  const recommendations = [
    'Focus extra study time on subjects with declining trends',
    'Maintain strong performance in your best subjects',
    'Consider forming study groups for challenging subjects',
    'Set up regular meeting with teachers for subjects below 70%'
  ];

  return {
    studentInfo: {
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
      className: studentClass,
      studentId: student.studentProfile?.studentId
    },
    period: period,
    overallStats: overallStats,
    subjectPerformance: subject === 'all' ? subjectPerformance : 
                       subjectPerformance.filter(s => s.subject.toLowerCase().includes(subject.toLowerCase())),
    performanceTrends: performanceTrends,
    analysis: {
      strongSubjects: strongSubjects,
      weakSubjects: weakSubjects,
      improvingSubjects: improvingSubjects,
      decliningSubjects: subjectPerformance.filter(s => s.trend === 'declining').map(s => s.subject)
    },
    goals: goals,
    recommendations: recommendations,
    lastUpdated: new Date()
  };
}

function calculateGPA(scores) {
  const gpaPoints = scores.map(score => {
    if (score >= 90) return 4.0;
    if (score >= 80) return 3.0 + (score - 80) / 10;
    if (score >= 70) return 2.0 + (score - 70) / 10;
    if (score >= 60) return 1.0 + (score - 60) / 10;
    return 0.0;
  });
  
  return Math.round((gpaPoints.reduce((sum, gpa) => sum + gpa, 0) / gpaPoints.length) * 100) / 100;
}