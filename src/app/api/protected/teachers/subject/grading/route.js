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
    const assignmentId = searchParams.get('assignmentId');
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'submittedAt';
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher's assigned subjects
    const teacherSubjects = subjectTeacher.teacherProfile?.teacherSubjects || [];
    const subjectIds = teacherSubjects.map(ts => ts.subject.id);
    const assignedClasses = [...new Set(teacherSubjects.flatMap(ts => ts.classes))];

    if (subjectIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          submissions: [],
          summary: { total: 0, pending: 0, graded: 0, late: 0 },
          message: 'No subjects assigned to this teacher'
        }
      });
    }

    // Build where conditions for assignments
    let assignmentWhere = {
      schoolId: subjectTeacher.schoolId,
      teacherId: subjectTeacher.id,
      status: { in: ['active', 'closed'] }
    };

    if (assignmentId && assignmentId !== 'all') {
      assignmentWhere.id = assignmentId;
    }

    // Get assignments created by this teacher
    const assignments = await prisma.assignment.findMany({
      where: assignmentWhere,
      include: {
        subject: true
      }
    });

    const assignmentIds = assignments.map(a => a.id);

    if (assignmentIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          submissions: [],
          summary: { total: 0, pending: 0, graded: 0, late: 0 },
          message: 'No assignments found for this teacher'
        }
      });
    }

    // Build where conditions for submissions
    let submissionWhere = {
      assignmentId: {
        in: assignmentIds
      },
      schoolId: subjectTeacher.schoolId
    };

    // Add status filter
    if (status !== 'all') {
      if (status === 'pending') {
        submissionWhere.status = 'submitted';
        submissionWhere.score = null;
      } else if (status === 'graded') {
        submissionWhere.status = 'graded';
      } else if (status === 'late') {
        submissionWhere.isLateSubmission = true;
        submissionWhere.status = { not: 'graded' };
      } else {
        submissionWhere.status = status;
      }
    }

    // Add search filter
    if (search) {
      const searchWhere = {
        OR: [
          {
            student: {
              OR: [
                { firstName: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
              ]
            }
          },
          {
            assignment: {
              title: { contains: search, mode: 'insensitive' }
            }
          }
        ]
      };
      submissionWhere.AND = [searchWhere];
    }

    // Get total count
    const totalSubmissions = await prisma.assignmentSubmission.count({
      where: submissionWhere
    });

    // Build order by
    let orderBy;
    switch (sortBy) {
      case 'student':
        orderBy = [{ student: { firstName: 'asc' } }, { student: { lastName: 'asc' } }];
        break;
      case 'assignment':
        orderBy = [{ assignment: { title: 'asc' } }];
        break;
      case 'score':
        orderBy = [{ score: 'desc' }];
        break;
      case 'submittedAt':
      default:
        orderBy = [{ submittedAt: 'desc' }];
        break;
    }

    // Get submissions with pagination
    const submissions = await prisma.assignmentSubmission.findMany({
      where: submissionWhere,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            studentProfile: {
              select: {
                studentId: true,
                className: true
              }
            }
          }
        },
        assignment: {
          select: {
            id: true,
            title: true,
            maxScore: true,
            dueDate: true,
            subject: {
              select: {
                name: true,
                code: true
              }
            }
          }
        }
      },
      orderBy: orderBy,
      skip: (page - 1) * limit,
      take: limit
    });

    // Format submissions data
    const formattedSubmissions = submissions.map(submission => ({
      id: submission.id,
      student: {
        id: submission.student.id,
        firstName: submission.student.firstName,
        lastName: submission.student.lastName,
        email: submission.student.email,
        profile: submission.student.studentProfile
      },
      assignment: {
        id: submission.assignment.id,
        title: submission.assignment.title,
        maxScore: submission.assignment.maxScore,
        dueDate: submission.assignment.dueDate,
        subject: submission.assignment.subject
      },
      content: submission.content,
      attachments: submission.attachments,
      submittedAt: submission.submittedAt,
      isLateSubmission: submission.isLateSubmission,
      attemptNumber: submission.attemptNumber,
      score: submission.score,
      maxScore: submission.maxScore,
      feedback: submission.feedback,
      gradedAt: submission.gradedAt,
      status: submission.status,
      createdAt: submission.createdAt,
      updatedAt: submission.updatedAt
    }));

    // Calculate summary statistics
    const allSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        assignmentId: {
          in: assignmentIds
        },
        schoolId: subjectTeacher.schoolId
      }
    });

    const summary = {
      total: allSubmissions.length,
      pending: allSubmissions.filter(s => s.status === 'submitted' && s.score === null).length,
      graded: allSubmissions.filter(s => s.status === 'graded').length,
      late: allSubmissions.filter(s => s.isLateSubmission && s.status !== 'graded').length,
      averageScore: calculateAverageScore(allSubmissions.filter(s => s.score !== null)),
      gradingRate: allSubmissions.length > 0 
        ? Math.round((allSubmissions.filter(s => s.status === 'graded').length / allSubmissions.length) * 100)
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        submissions: formattedSubmissions,
        summary: summary,
        pagination: {
          total: totalSubmissions,
          page: page,
          limit: limit,
          pages: Math.ceil(totalSubmissions / limit)
        },
        teacherInfo: {
          id: subjectTeacher.id,
          name: `${subjectTeacher.firstName} ${subjectTeacher.lastName}`,
          assignedSubjects: teacherSubjects.map(ts => ({
            id: ts.subject.id,
            name: ts.subject.name,
            classes: ts.classes
          }))
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

// PUT - Grade a submission
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { submissionId, score, feedback, status = 'graded' } = body;

    if (!submissionId) {
      return NextResponse.json({
        error: 'Submission ID is required'
      }, { status: 400 });
    }

    if (score === undefined || score === null || isNaN(score)) {
      return NextResponse.json({
        error: 'Valid score is required'
      }, { status: 400 });
    }

    // Verify submission belongs to teacher's assignment
    const submission = await prisma.assignmentSubmission.findFirst({
      where: {
        id: submissionId,
        schoolId: subjectTeacher.schoolId,
        assignment: {
          teacherId: subjectTeacher.id
        }
      },
      include: {
        assignment: true,
        student: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!submission) {
      return NextResponse.json({
        error: 'Submission not found or access denied'
      }, { status: 404 });
    }

    // Validate score is within range
    if (score < 0 || score > submission.assignment.maxScore) {
      return NextResponse.json({
        error: `Score must be between 0 and ${submission.assignment.maxScore}`
      }, { status: 400 });
    }

    // Update the submission
    const updatedSubmission = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: parseInt(score),
        feedback: feedback || null,
        gradedAt: new Date(),
        gradedBy: subjectTeacher.id,
        status: status
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: submission.studentId,
        schoolId: subjectTeacher.schoolId,
        title: `Assignment Graded: ${submission.assignment.title}`,
        content: `Your assignment "${submission.assignment.title}" has been graded. Score: ${score}/${submission.assignment.maxScore}`,
        type: 'info',
        priority: 'normal',
        isRead: false
      }
    });

    // Create grade entry
    const percentage = (score / submission.assignment.maxScore) * 100;
    const gradeValue = getGradeFromPercentage(percentage);

    await prisma.grade.create({
      data: {
        studentId: submission.studentId,
        subjectId: submission.assignment.subjectId,
        schoolId: subjectTeacher.schoolId,
        teacherId: subjectTeacher.id,
        assessmentType: 'assignment',
        assessmentName: submission.assignment.title,
        score: parseInt(score),
        maxScore: submission.assignment.maxScore,
        percentage: Number(percentage.toFixed(2)),
        grade: gradeValue,
        term: getCurrentTerm(),
        academicYear: new Date().getFullYear().toString(),
        assessmentDate: new Date(),
        comments: feedback || null,
        createdBy: subjectTeacher.id
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Submission graded successfully',
      data: {
        submissionId: submissionId,
        score: parseInt(score),
        maxScore: submission.assignment.maxScore,
        percentage: Number(percentage.toFixed(2)),
        feedback: feedback,
        gradedAt: updatedSubmission.gradedAt,
        studentName: `${submission.student.firstName} ${submission.student.lastName}`
      }
    });

  } catch (error) {
    console.error('Grade submission error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to calculate average score
function calculateAverageScore(gradedSubmissions) {
  if (gradedSubmissions.length === 0) return 0;
  
  const totalScore = gradedSubmissions.reduce((sum, submission) => {
    const percentage = (submission.score / submission.maxScore) * 100;
    return sum + percentage;
  }, 0);
  
  return Number((totalScore / gradedSubmissions.length).toFixed(1));
}

// Helper function to get grade from percentage
function getGradeFromPercentage(percentage) {
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

// Helper function to get current term
function getCurrentTerm() {
  const month = new Date().getMonth() + 1; // 0-based to 1-based
  
  if (month >= 9 && month <= 12) {
    return 'First Term';
  } else if (month >= 1 && month <= 4) {
    return 'Second Term';
  } else {
    return 'Third Term';
  }
}