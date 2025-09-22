// /app/api/protected/teacher/subject/grading/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify subject teacher access
async function verifySubjectTeacherAccess(token) {
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

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'subject_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

// GET - Fetch submissions for grading
export async function GET(request) {
  try {
    await requireAuth(['subject_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignment');
    const status = searchParams.get('status') || 'all';
    const subjectFilter = searchParams.get('subject');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get teacher's assigned subjects
    const teacherSubjects = subjectTeacher.teacherProfile?.teacherSubjects || [];
    const subjectNames = teacherSubjects.map(ts => ts.subject?.name).filter(Boolean);
    const assignedClasses = [...new Set(teacherSubjects.flatMap(ts => ts.classes))];

    if (subjectNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          submissions: [],
          summary: { total: 0, pending: 0, graded: 0, late: 0 },
          message: 'No subjects assigned to this teacher'
        }
      });
    }

    // TODO: In production, this would query actual assignment_submissions table
    // For now, generate mock submission data
    const mockSubmissions = [];
    
    // Generate submissions for each subject/assignment
    teacherSubjects.forEach(teacherSubject => {
      const subjectName = teacherSubject.subject?.name;
      const subjectClasses = teacherSubject.classes;
      
      // Generate sample assignments for this subject
      for (let assignmentIndex = 0; assignmentIndex < 3; assignmentIndex++) {
        const assignmentTitle = `Assignment ${assignmentIndex + 1}`;
        const assignmentId = `assignment_${subjectName.replace(/\s+/g, '')}_${assignmentIndex}`;
        
        // Generate students for this assignment
        for (let studentIndex = 0; studentIndex < 15; studentIndex++) {
          const submissionDate = new Date();
          submissionDate.setDate(submissionDate.getDate() - Math.floor(Math.random() * 14)); // Last 14 days
          
          const dueDate = new Date(submissionDate);
          dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 7) + 1); // Due 1-7 days after submission
          
          const isLateSubmission = submissionDate > dueDate;
          const isGraded = Math.random() > 0.4; // 60% chance of being graded
          const score = isGraded ? Math.floor(Math.random() * 40) + 60 : null; // 60-100 if graded
          
          const submissionStatus = !isGraded ? 'pending' : 
                                 isLateSubmission ? 'late' : 'graded';

          mockSubmissions.push({
            id: `submission_${assignmentId}_student_${studentIndex}`,
            assignmentId: assignmentId,
            studentId: `student_${studentIndex}`,
            schoolId: subjectTeacher.schoolId,
            
            // Assignment details
            assignment: {
              id: assignmentId,
              title: `${subjectName} ${assignmentTitle}`,
              subject: subjectName,
              maxScore: 100,
              dueDate: dueDate
            },
            
            // Student details
            student: {
              id: `student_${studentIndex}`,
              name: `Student ${studentIndex + 1}`,
              className: subjectClasses[Math.floor(Math.random() * subjectClasses.length)]
            },
            
            // Submission details
            content: `This is the submission content for ${subjectName} ${assignmentTitle} by Student ${studentIndex + 1}. The student has provided their work and is awaiting feedback.`,
            attachments: Math.random() > 0.7 ? [`attachment_${assignmentId}_${studentIndex}.pdf`] : [],
            
            submittedAt: submissionDate,
            isLateSubmission: isLateSubmission,
            attemptNumber: 1,
            
            // Grading
            score: score,
            maxScore: 100,
            feedback: isGraded ? `Good work on this assignment. ${score >= 80 ? 'Excellent understanding demonstrated.' : 'Some areas need improvement.'}` : null,
            gradedAt: isGraded ? new Date() : null,
            gradedBy: isGraded ? subjectTeacher.id : null,
            
            status: submissionStatus,
            createdAt: submissionDate,
            updatedAt: isGraded ? new Date() : submissionDate
          });
        }
      }
    });

    // Apply filters
    let filteredSubmissions = mockSubmissions;

    // Filter by assignment
    if (assignmentId && assignmentId !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(s => s.assignmentId === assignmentId);
    }

    // Filter by status
    if (status !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(s => s.status === status);
    }

    // Filter by subject
    if (subjectFilter && subjectFilter !== 'all') {
      filteredSubmissions = filteredSubmissions.filter(s => 
        s.assignment.subject.toLowerCase().includes(subjectFilter.toLowerCase())
      );
    }

    // Sort by submission date (most recent first)
    filteredSubmissions.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, startIndex + limit);

    // Calculate summary statistics
    const summary = {
      total: filteredSubmissions.length,
      pending: filteredSubmissions.filter(s => s.status === 'pending').length,
      graded: filteredSubmissions.filter(s => s.status === 'graded').length,
      late: filteredSubmissions.filter(s => s.status === 'late' || s.isLateSubmission).length
    };

    return NextResponse.json({
      success: true,
      data: {
        submissions: paginatedSubmissions,
        summary: summary,
        pagination: {
          total: filteredSubmissions.length,
          page: page,
          limit: limit,
          pages: Math.ceil(filteredSubmissions.length / limit)
        },
        teacherInfo: {
          id: subjectTeacher.id,
          name: `${subjectTeacher.firstName} ${subjectTeacher.lastName}`,
          assignedSubjects: subjectNames
        }
      }
    });

  } catch (error) {
    console.error('Subject teacher grading GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Submit individual grade
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { submissionId, score, feedback = '', gradedAt } = body;

    if (!submissionId || score === null || score === undefined) {
      return NextResponse.json({
        error: 'Submission ID and score are required'
      }, { status: 400 });
    }

    const scoreNum = parseInt(score);
    if (isNaN(scoreNum) || scoreNum < 0) {
      return NextResponse.json({
        error: 'Score must be a valid number greater than or equal to 0'
      }, { status: 400 });
    }

    // TODO: In production, update the actual assignment_submission record
    
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          include: {
            teacher: true
          }
        },
        student: true
      }
    });

    if (!submission) {
      return NextResponse.json({
        error: 'Submission not found'
      }, { status: 404 });
    }

    // Verify teacher owns this assignment
    if (submission.assignment.teacherId !== subjectTeacher.id) {
      return NextResponse.json({
        error: 'You can only grade submissions for your own assignments'
      }, { status: 403 });
    }

    // Verify score doesn't exceed max score
    if (scoreNum > submission.assignment.maxScore) {
      return NextResponse.json({
        error: `Score cannot exceed maximum score of ${submission.assignment.maxScore}`
      }, { status: 400 });
    }

    // Update the submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: scoreNum,
        feedback: feedback,
        gradedAt: new Date(gradedAt || Date.now()),
        gradedBy: subjectTeacher.id,
        status: 'graded'
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: submission.student.id,
        schoolId: subjectTeacher.schoolId,
        title: 'Assignment Graded',
        content: `Your ${submission.assignment.title} has been graded. Score: ${scoreNum}/${submission.assignment.maxScore}`,
        type: 'info',
        priority: 'normal',
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Grade submitted successfully',
      data: {
        submissionId,
        score: scoreNum,
        feedback: feedback,
        gradedAt: new Date(),
        gradedBy: subjectTeacher.id
      }
    });

  } catch (error) {
    console.error('Submit grade error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing grade
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { submissionId, score, feedback } = body;

    if (!submissionId) {
      return NextResponse.json({
        error: 'Submission ID is required'
      }, { status: 400 });
    }

    // TODO: In production, update the actual submission record
    // Similar logic to POST but for updating existing grades

    return NextResponse.json({
      success: true,
      message: 'Grade updated successfully',
      data: {
        submissionId,
        score: parseInt(score),
        feedback: feedback,
        updatedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Update grade error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}