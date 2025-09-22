// /app/api/protected/student/assignments/route.js
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

// GET - Fetch student's assignments
export async function GET(request) {
  try {
    await requireAuth(['student']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const student = await verifyStudentAccess(token);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all'; // all, pending, submitted, overdue
    const subject = searchParams.get('subject') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    // Get student's class info
    const studentClass = student.studentProfile?.className;
    const studentSection = student.studentProfile?.section;

    if (!studentClass) {
      return NextResponse.json({
        success: true,
        data: {
          assignments: [],
          summary: { total: 0, pending: 0, submitted: 0, overdue: 0 },
          message: 'Student class not assigned'
        }
      });
    }

    // TODO: In production, this would query actual assignments table
    // For now, generate mock assignment data based on student's class
    const mockAssignments = [];
    const subjects = ['Mathematics', 'English', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];
    const assignmentTypes = ['Homework', 'Project', 'Quiz', 'Essay', 'Lab Report', 'Research', 'Presentation'];
    
    // Generate assignments for each subject
    subjects.forEach(subjectName => {
      for (let i = 0; i < 6; i++) {
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
        
        const dueDate = new Date(createdDate);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 14) + 3); // Due 3-17 days after creation
        
        const isOverdue = dueDate < new Date();
        const isSubmitted = Math.random() > 0.3; // 70% submission rate
        const submissionDate = isSubmitted 
          ? new Date(dueDate.getTime() - Math.floor(Math.random() * 3 * 24 * 60 * 60 * 1000))
          : null;

        const assignmentStatus = !isSubmitted && isOverdue ? 'overdue' :
                               !isSubmitted ? 'pending' :
                               isSubmitted && submissionDate > dueDate ? 'late' :
                               'submitted';

        mockAssignments.push({
          id: `assignment_${subjectName.replace(/\s+/g, '')}_${i}`,
          title: `${subjectName} ${assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)]} ${i + 1}`,
          description: `Complete the assigned work for ${subjectName}. This assignment covers recent topics and requires thorough understanding of the concepts.`,
          subject: subjectName,
          assignmentType: assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)],
          
          // Dates
          createdAt: createdDate,
          dueDate: dueDate,
          
          // Grading
          maxScore: 100,
          
          // Teacher info
          teacherId: `teacher_${subjectName.replace(/\s+/g, '')}`,
          teacherName: `${subjectName} Teacher`,
          
          // Classes this assignment is for
          classes: [studentClass],
          
          // Instructions and attachments
          instructions: `Please complete this ${assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)].toLowerCase()} assignment and submit before the due date. Show all working and provide detailed explanations.`,
          attachments: Math.random() > 0.7 ? [`${subjectName}_assignment_${i}.pdf`] : [],
          
          // Student's submission info
          submission: isSubmitted ? {
            id: `submission_${student.id}_${i}`,
            submittedAt: submissionDate,
            content: `This is my submission for ${subjectName} assignment ${i + 1}. I have completed all the required work.`,
            attachments: Math.random() > 0.5 ? [`submission_${i}.pdf`] : [],
            score: Math.random() > 0.5 ? Math.floor(Math.random() * 40) + 60 : null, // 60-100 if graded
            feedback: Math.random() > 0.3 ? `Good work! ${Math.random() > 0.5 ? 'Keep it up.' : 'Some areas need improvement.'}` : null,
            gradedAt: Math.random() > 0.5 ? new Date() : null,
            isLateSubmission: submissionDate > dueDate
          } : null,
          
          status: assignmentStatus,
          priority: isOverdue ? 'high' : new Date(dueDate) - new Date() < 2 * 24 * 60 * 60 * 1000 ? 'medium' : 'normal'
        });
      }
    });

    // Apply filters
    let filteredAssignments = mockAssignments;

    // Filter by subject
    if (subject !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    // Filter by status
    if (status !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => {
        switch (status) {
          case 'pending':
            return assignment.status === 'pending';
          case 'submitted':
            return assignment.status === 'submitted' || assignment.status === 'late';
          case 'overdue':
            return assignment.status === 'overdue';
          case 'active':
            return assignment.status === 'pending' || assignment.status === 'overdue';
          default:
            return true;
        }
      });
    }

    // Sort by due date (nearest first)
    filteredAssignments.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + limit);

    // Calculate summary statistics
    const summary = {
      total: filteredAssignments.length,
      pending: filteredAssignments.filter(a => a.status === 'pending').length,
      submitted: filteredAssignments.filter(a => a.status === 'submitted' || a.status === 'late').length,
      overdue: filteredAssignments.filter(a => a.status === 'overdue').length,
      graded: filteredAssignments.filter(a => a.submission?.score !== null).length
    };

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        summary: summary,
        pagination: {
          total: filteredAssignments.length,
          page: page,
          limit: limit,
          pages: Math.ceil(filteredAssignments.length / limit)
        },
        studentInfo: {
          id: student.id,
          name: `${student.firstName} ${student.lastName}`,
          className: studentClass,
          studentId: student.studentProfile?.studentId
        }
      }
    });

  } catch (error) {
    console.error('Student assignments GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit assignment
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const student = await verifyStudentAccess(token);
    const body = await request.json();
    const { assignmentId, content, attachments = [] } = body;

    if (!assignmentId || !content) {
      return NextResponse.json({
        error: 'Assignment ID and content are required'
      }, { status: 400 });
    }

    // TODO: In production, verify assignment exists and student can submit
    // Also check for late submissions and handle file uploads

    const submissionData = {
      id: `submission_${student.id}_${Date.now()}`,
      assignmentId: assignmentId,
      studentId: student.id,
      content: content.trim(),
      attachments: attachments,
      submittedAt: new Date(),
      isLateSubmission: false, // Would check against assignment due date
      status: 'submitted'
    };

    // TODO: In production, save to actual assignment_submissions table
    
    const submission = await prisma.assignmentSubmission.create({
      data: {
        assignmentId: assignmentId,
        studentId: student.id,
        schoolId: student.schoolId,
        content: content,
        attachments: attachments,
        submittedAt: new Date(),
        isLateSubmission: false,
        status: 'submitted'
      }
    });
    

    return NextResponse.json({
      success: true,
      message: 'Assignment submitted successfully',
      data: submissionData
    }, { status: 201 });

  } catch (error) {
    console.error('Submit assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}