// /app/api/protected/student/grades/route.js
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

// GET - Fetch student's grades
export async function GET(request) {
  try {
    await requireAuth(['student']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const student = await verifyStudentAccess(token);
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || 'all';
    const term = searchParams.get('term') || 'current';
    const recent = searchParams.get('recent') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    // TODO: In production, this would query actual grades table
    // For now, generate mock grade data
    const mockGrades = [];
    const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];
    const assessmentTypes = ['Test', 'Quiz', 'Assignment', 'Project', 'Midterm', 'Final', 'Lab Report'];
    const currentTerm = '2024/2025 First Term';

    subjects.forEach(subjectName => {
      // Generate multiple assessments per subject
      for (let i = 0; i < 8; i++) {
        const assessmentDate = new Date();
        assessmentDate.setDate(assessmentDate.getDate() - Math.floor(Math.random() * 60)); // Last 60 days
        
        const score = Math.floor(Math.random() * 35) + 65; // 65-100 range
        const maxScore = 100;
        const percentage = (score / maxScore) * 100;
        
        // Calculate grade letter
        let grade;
        if (percentage >= 90) grade = 'A';
        else if (percentage >= 80) grade = 'B';
        else if (percentage >= 70) grade = 'C';
        else if (percentage >= 60) grade = 'D';
        else grade = 'F';

        mockGrades.push({
          id: `grade_${subjectName.replace(/\s+/g, '')}_${i}`,
          studentId: student.id,
          subjectName: subjectName,
          assessmentType: assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)],
          assessmentName: `${subjectName} ${assessmentTypes[Math.floor(Math.random() * assessmentTypes.length)]} ${i + 1}`,
          score: score,
          maxScore: maxScore,
          percentage: Math.round(percentage * 100) / 100,
          grade: grade,
          term: currentTerm,
          academicYear: '2024/2025',
          assessmentDate: assessmentDate,
          teacherName: `${subjectName} Teacher`,
          comments: score >= 85 ? 'Excellent work!' : 
                   score >= 75 ? 'Good performance, keep it up!' :
                   score >= 65 ? 'Fair work, room for improvement' :
                   'Needs significant improvement',
          weight: Math.random() > 0.5 ? 1.0 : 0.5, // Full weight or half weight
          createdAt: assessmentDate,
          updatedAt: assessmentDate
        });
      }
    });

    // Apply filters
    let filteredGrades = mockGrades;

    // Filter by subject
    if (subject !== 'all') {
      filteredGrades = filteredGrades.filter(grade => 
        grade.subjectName.toLowerCase().includes(subject.toLowerCase())
      );
    }

    // Filter by term
    if (term !== 'all') {
      filteredGrades = filteredGrades.filter(grade => 
        grade.term === currentTerm
      );
    }

    // Filter recent if requested
    if (recent) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filteredGrades = filteredGrades.filter(grade => 
        new Date(grade.assessmentDate) >= thirtyDaysAgo
      );
    }

    // Sort by assessment date (most recent first)
    filteredGrades.sort((a, b) => new Date(b.assessmentDate) - new Date(a.assessmentDate));

    // Apply limit
    const limitedGrades = filteredGrades.slice(0, limit);

    // Calculate statistics
    const subjectStats = {};
    subjects.forEach(subjectName => {
      const subjectGrades = filteredGrades.filter(g => g.subjectName === subjectName);
      if (subjectGrades.length > 0) {
        const totalScore = subjectGrades.reduce((sum, g) => sum + g.percentage, 0);
        const average = totalScore / subjectGrades.length;
        const latest = subjectGrades[0]; // Most recent grade

        subjectStats[subjectName] = {
          subjectName,
          averagePercentage: Math.round(average * 100) / 100,
          averageGrade: average >= 90 ? 'A' : 
                       average >= 80 ? 'B' :
                       average >= 70 ? 'C' :
                       average >= 60 ? 'D' : 'F',
          totalAssessments: subjectGrades.length,
          latestScore: latest.percentage,
          latestGrade: latest.grade,
          latestDate: latest.assessmentDate,
          trend: Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining'
        };
      }
    });

    // Calculate overall stats
    const overallStats = {
      totalAssessments: filteredGrades.length,
      overallAverage: filteredGrades.length > 0 
        ? Math.round((filteredGrades.reduce((sum, g) => sum + g.percentage, 0) / filteredGrades.length) * 100) / 100
        : 0,
      currentGPA: 0, // Would calculate based on school's GPA system
      classRank: Math.floor(Math.random() * 20) + 10, // Mock rank
      totalClassStudents: 45
    };

    // Calculate GPA (4.0 scale)
    if (overallStats.overallAverage >= 90) overallStats.currentGPA = 4.0;
    else if (overallStats.overallAverage >= 80) overallStats.currentGPA = 3.0 + (overallStats.overallAverage - 80) / 10;
    else if (overallStats.overallAverage >= 70) overallStats.currentGPA = 2.0 + (overallStats.overallAverage - 70) / 10;
    else if (overallStats.overallAverage >= 60) overallStats.currentGPA = 1.0 + (overallStats.overallAverage - 60) / 10;
    else overallStats.currentGPA = 0.0;

    overallStats.currentGPA = Math.round(overallStats.currentGPA * 100) / 100;

    return NextResponse.json({
      success: true,
      data: {
        grades: limitedGrades,
        subjectStats: Object.values(subjectStats),
        overallStats: overallStats,
        term: currentTerm,
        academicYear: '2024/2025',
        studentInfo: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: student.studentProfile?.className,
          studentId: student.studentProfile?.studentId
        }
      }
    });

  } catch (error) {
    console.error('Student grades GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}