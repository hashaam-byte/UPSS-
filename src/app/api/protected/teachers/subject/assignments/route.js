// /app/api/protected/teacher/subject/assignments/route.js
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

// GET - Fetch assignments for subject teacher
export async function GET(request) {
  try {
    await requireAuth(['subject_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject');
    const status = searchParams.get('status') || 'all';
    const sortBy = searchParams.get('sortBy') || 'dueDate';
    const search = searchParams.get('search') || '';
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
          assignments: [],
          summary: { total: 0, active: 0, closed: 0, draft: 0 },
          teacherSubjects: [],
          message: 'No subjects assigned to this teacher'
        }
      });
    }

    // TODO: In production, this would query an actual assignments table
    // For now, generate mock assignment data based on teacher's subjects
    const mockAssignments = [];
    
    teacherSubjects.forEach(teacherSubject => {
      const subjectName = teacherSubject.subject?.name;
      const subjectClasses = teacherSubject.classes;
      
      // Generate sample assignments for this subject
      for (let i = 0; i < 8; i++) {
        const createdDate = new Date();
        createdDate.setDate(createdDate.getDate() - Math.floor(Math.random() * 60)); // Random date within last 60 days
        
        const dueDate = new Date(createdDate);
        dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 7); // Due 7-37 days after creation
        
        const assignmentTypes = ['Homework', 'Project', 'Quiz', 'Essay', 'Lab Report', 'Research Paper'];
        const statuses = ['active', 'closed', 'draft'];
        const assignmentStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        const totalStudents = Math.floor(Math.random() * 30) + 20; // 20-50 students
        const submissionCount = assignmentStatus === 'active' 
          ? Math.floor(Math.random() * totalStudents * 0.8) // 0-80% submitted for active
          : assignmentStatus === 'closed' 
          ? Math.floor(totalStudents * (0.7 + Math.random() * 0.3)) // 70-100% for closed
          : 0; // 0 for draft

        mockAssignments.push({
          id: `assignment_${subjectName.replace(/\s+/g, '')}_${i}`,
          title: `${assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)]} ${i + 1}`,
          description: `${subjectName} assignment covering recent topics`,
          subject: subjectName,
          subjectId: teacherSubject.subject?.id,
          classes: subjectClasses,
          assignmentType: assignmentTypes[Math.floor(Math.random() * assignmentTypes.length)],
          status: assignmentStatus,
          createdAt: createdDate,
          dueDate: dueDate,
          maxScore: 100,
          instructions: `Complete the assigned work and submit before the due date.`,
          attachments: [],
          totalStudents: totalStudents,
          submissionCount: submissionCount,
          gradedCount: assignmentStatus === 'closed' ? submissionCount : Math.floor(submissionCount * 0.6),
          createdBy: subjectTeacher.id
        });
      }
    });

    // Apply filters
    let filteredAssignments = mockAssignments;

    // Filter by subject
    if (subject && subject !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => 
        assignment.subject.toLowerCase().includes(subject.toLowerCase())
      );
    }

    // Filter by status
    if (status !== 'all') {
      filteredAssignments = filteredAssignments.filter(assignment => {
        if (status === 'overdue') {
          return assignment.status === 'active' && new Date(assignment.dueDate) < new Date();
        }
        return assignment.status === status;
      });
    }

    // Apply search
    if (search) {
      filteredAssignments = filteredAssignments.filter(assignment =>
        assignment.title.toLowerCase().includes(search.toLowerCase()) ||
        assignment.subject.toLowerCase().includes(search.toLowerCase()) ||
        assignment.description.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Sort assignments
    filteredAssignments.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'createdAt':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'dueDate':
        default:
          return new Date(a.dueDate) - new Date(b.dueDate);
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const paginatedAssignments = filteredAssignments.slice(startIndex, startIndex + limit);

    // Calculate summary statistics
    const summary = {
      total: filteredAssignments.length,
      active: filteredAssignments.filter(a => a.status === 'active').length,
      closed: filteredAssignments.filter(a => a.status === 'closed').length,
      draft: filteredAssignments.filter(a => a.status === 'draft').length,
      overdue: filteredAssignments.filter(a => 
        a.status === 'active' && new Date(a.dueDate) < new Date()
      ).length
    };

    return NextResponse.json({
      success: true,
      data: {
        assignments: paginatedAssignments,
        summary: summary,
        teacherSubjects: teacherSubjects.map(ts => ({
          id: ts.id,
          subject: ts.subject,
          classes: ts.classes
        })),
        assignedClasses: assignedClasses,
        pagination: {
          total: filteredAssignments.length,
          page: page,
          limit: limit,
          pages: Math.ceil(filteredAssignments.length / limit)
        },
        filters: {
          subject,
          status,
          sortBy,
          search
        },
        teacherInfo: {
          id: subjectTeacher.id,
          name: `${subjectTeacher.firstName} ${subjectTeacher.lastName}`,
          assignedSubjects: subjectNames
        }
      }
    });

  } catch (error) {
    console.error('Subject teacher assignments GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new assignment
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { 
      title, 
      description, 
      subjectId, 
      classes = [], 
      dueDate, 
      maxScore = 100, 
      instructions, 
      assignmentType = 'homework',
      status = 'draft',
      attachments = []
    } = body;

    if (!title || !subjectId || !dueDate) {
      return NextResponse.json({
        error: 'Title, subject, and due date are required'
      }, { status: 400 });
    }

    // Verify teacher is assigned to this subject
    const teacherSubject = await prisma.teacherSubject.findFirst({
      where: {
        teacherId: subjectTeacher.teacherProfile.id,
        subjectId: subjectId
      },
      include: {
        subject: true
      }
    });

    if (!teacherSubject) {
      return NextResponse.json({
        error: 'You are not assigned to teach this subject'
      }, { status: 403 });
    }

    // Validate due date
    const dueDateObj = new Date(dueDate);
    if (dueDateObj <= new Date()) {
      return NextResponse.json({
        error: 'Due date must be in the future'
      }, { status: 400 });
    }

    // TODO: In production, save to actual assignments table
    const assignmentData = {
      id: `assignment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      description: description || '',
      subjectId,
      subjectName: teacherSubject.subject.name,
      classes: classes.length > 0 ? classes : teacherSubject.classes,
      dueDate: dueDateObj,
      maxScore,
      instructions: instructions || '',
      assignmentType,
      status,
      attachments,
      createdBy: subjectTeacher.id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create notifications for students if assignment is active
    if (status === 'active') {
      // TODO: In production, create notifications for all students in the assigned classes
      
      const students = await prisma.user.findMany({
        where: {
          schoolId: subjectTeacher.schoolId,
          role: 'student',
          isActive: true,
          studentProfile: {
            className: {
              in: assignmentData.classes
            }
          }
        }
      });

      for (const student of students) {
        await prisma.notification.create({
          data: {
            userId: student.id,
            schoolId: subjectTeacher.schoolId,
            title: `New Assignment: ${title}`,
            content: `You have a new ${assignmentType} assignment in ${teacherSubject.subject.name}. Due: ${dueDateObj.toLocaleDateString()}`,
            type: 'info',
            priority: 'normal',
            isRead: false
          }
        });
      }
      
    }

    return NextResponse.json({
      success: true,
      message: 'Assignment created successfully',
      data: assignmentData
    }, { status: 201 });

  } catch (error) {
    console.error('Create assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update existing assignment
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const body = await request.json();
    const { assignmentId, ...updateData } = body;

    if (!assignmentId) {
      return NextResponse.json({
        error: 'Assignment ID is required'
      }, { status: 400 });
    }

    // TODO: In production, verify assignment ownership and update in database
    
    return NextResponse.json({
      success: true,
      message: 'Assignment updated successfully',
      data: {
        assignmentId,
        updatedAt: new Date(),
        ...updateData
      }
    });

  } catch (error) {
    console.error('Update assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete assignment
export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const subjectTeacher = await verifySubjectTeacherAccess(token);
    const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('id');

    if (!assignmentId) {
      return NextResponse.json({
        error: 'Assignment ID is required'
      }, { status: 400 });
    }

    // TODO: In production, verify ownership and delete from database
    // Also handle cascading deletions (submissions, grades, notifications, etc.)

    return NextResponse.json({
      success: true,
      message: 'Assignment deleted successfully',
      data: {
        deletedAssignmentId: assignmentId,
        deletedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Delete assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}