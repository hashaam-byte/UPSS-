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
    const subjectFilter = searchParams.get('subject');
    const departmentFilter = searchParams.get('department');
    const classFilter = searchParams.get('class');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

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

    // Build where clause for teachers - only subject and class teachers
    const whereClause = {
      schoolId: coordinator.schoolId,
      role: 'teacher',
      isActive: true,
      teacherProfile: {
        department: {
          in: ['subject_teacher', 'class_teacher']
        }
      },
      ...(departmentFilter && {
        teacherProfile: {
          department: departmentFilter
        }
      })
    };

    // Get teachers with their profiles and subject assignments
    const teachers = await prisma.user.findMany({
      where: whereClause,
      include: {
        teacherProfile: {
          include: {
            teacherSubjects: {
              include: {
                subject: true
              }
            }
          }
        }
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    const totalTeachers = await prisma.user.count({ where: whereClause });

    // Get all subjects available to coordinator's classes
    const availableSubjects = await prisma.subject.findMany({
      where: {
        schoolId: coordinator.schoolId,
        isActive: true,
        classes: {
          hasSome: coordinatorClasses
        }
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
                    lastName: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Filter subjects if specified
    const filteredSubjects = subjectFilter 
      ? availableSubjects.filter(s => s.name.toLowerCase().includes(subjectFilter.toLowerCase()) || 
                                     s.code.toLowerCase().includes(subjectFilter.toLowerCase()))
      : availableSubjects;

    // Transform teacher data
    const transformedTeachers = teachers.map(teacher => {
      const teacherSubjects = teacher.teacherProfile?.teacherSubjects || [];
      
      // Filter subjects that are relevant to coordinator's classes
      const relevantSubjects = teacherSubjects.filter(ts => 
        ts.classes.some(cls => coordinatorClasses.includes(cls))
      );

      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        phone: teacher.phone,
        avatar: teacher.avatar,
        isActive: teacher.isActive,
        lastLogin: teacher.lastLogin,
        
        // Profile data
        employeeId: teacher.teacherProfile?.employeeId,
        department: teacher.teacherProfile?.department,
        qualification: teacher.teacherProfile?.qualification,
        experienceYears: teacher.teacherProfile?.experienceYears || 0,
        joiningDate: teacher.teacherProfile?.joiningDate,
        
        // Subject assignments (only those relevant to coordinator's classes)
        subjects: relevantSubjects.map(ts => ({
          id: ts.subject.id,
          name: ts.subject.name,
          code: ts.subject.code,
          category: ts.subject.category,
          assignedClasses: ts.classes.filter(cls => coordinatorClasses.includes(cls))
        })),
        
        // All classes they can teach in coordinator's scope
        availableClasses: [...new Set(
          relevantSubjects.flatMap(ts => 
            ts.classes.filter(cls => coordinatorClasses.includes(cls))
          )
        )],
        
        // Workload metrics
        totalSubjects: relevantSubjects.length,
        totalClasses: [...new Set(
          relevantSubjects.flatMap(ts => 
            ts.classes.filter(cls => coordinatorClasses.includes(cls))
          )
        )].length
      };
    });

    // Filter teachers by class if specified
    const finalTeachers = classFilter
      ? transformedTeachers.filter(t => t.availableClasses.includes(classFilter))
      : transformedTeachers;

    // Get unassigned subjects (subjects without teachers for coordinator's classes)
    const unassignedSubjects = availableSubjects.filter(subject => {
      const hasTeacherForCoordinatorClasses = subject.teachers.some(ts => 
        ts.classes.some(cls => coordinatorClasses.includes(cls))
      );
      return !hasTeacherForCoordinatorClasses;
    });

    return NextResponse.json({
      success: true,
      data: {
        teachers: finalTeachers,
        subjects: filteredSubjects.map(subject => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          category: subject.category,
          classes: subject.classes.filter(cls => coordinatorClasses.includes(cls)),
          assignedTeachers: subject.teachers
            .filter(ts => ts.classes.some(cls => coordinatorClasses.includes(cls)))
            .map(ts => ({
              id: ts.teacher.user.id,
              name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
              assignedClasses: ts.classes.filter(cls => coordinatorClasses.includes(cls))
            })),
          needsAssignment: !subject.teachers.some(ts => 
            ts.classes.some(cls => coordinatorClasses.includes(cls))
          )
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalTeachers / limit),
          totalTeachers,
          hasNext: page < Math.ceil(totalTeachers / limit),
          hasPrev: page > 1
        },
        filters: {
          availableDepartments: ['subject_teacher', 'class_teacher'],
          coordinatorClasses,
          currentFilters: {
            subject: subjectFilter,
            department: departmentFilter,
            class: classFilter
          }
        },
        statistics: {
          totalTeachers: finalTeachers.length,
          subjectTeachers: finalTeachers.filter(t => t.department === 'subject_teacher').length,
          classTeachers: finalTeachers.filter(t => t.department === 'class_teacher').length,
          totalSubjects: filteredSubjects.length,
          assignedSubjects: filteredSubjects.filter(s => !s.needsAssignment).length,
          unassignedSubjects: unassignedSubjects.length
        },
        unassignedSubjects: unassignedSubjects.map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          classes: s.classes.filter(cls => coordinatorClasses.includes(cls))
        }))
      }
    });

  } catch (error) {
    console.error('Coordinator teachers GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Assign teachers to subjects for specific classes
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const coordinator = await verifyCoordinatorAccess(token);
    const { teacherId, subjectId, classes, action = 'assign' } = await request.json();

    if (!teacherId || !subjectId) {
      return NextResponse.json({
        error: 'Teacher ID and Subject ID are required'
      }, { status: 400 });
    }

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
      return NextResponse.json({
        error: 'Classes array is required and cannot be empty'
      }, { status: 400 });
    }

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

    // Verify all requested classes are under coordinator's control
    const invalidClasses = classes.filter(cls => !coordinatorClasses.includes(cls));
    if (invalidClasses.length > 0) {
      return NextResponse.json({
        error: `You do not have access to assign classes: ${invalidClasses.join(', ')}`
      }, { status: 403 });
    }

    // Verify teacher exists and belongs to school
    const teacher = await prisma.user.findFirst({
      where: {
        id: teacherId,
        schoolId: coordinator.schoolId,
        role: 'teacher',
        isActive: true,
        teacherProfile: {
          department: {
            in: ['subject_teacher', 'class_teacher']
          }
        }
      },
      include: {
        teacherProfile: true
      }
    });

    if (!teacher || !teacher.teacherProfile) {
      return NextResponse.json({
        error: 'Teacher not found or invalid'
      }, { status: 404 });
    }

    // Verify subject exists and is available to coordinator's classes
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: coordinator.schoolId,
        isActive: true,
        classes: {
          hasSome: coordinatorClasses
        }
      }
    });

    if (!subject) {
      return NextResponse.json({
        error: 'Subject not found or not available for your classes'
      }, { status: 404 });
    }

    if (action === 'assign') {
      // Check if teacher-subject assignment already exists
      const existingAssignment = await prisma.teacherSubject.findUnique({
        where: {
          teacherId_subjectId: {
            teacherId: teacher.teacherProfile.id,
            subjectId: subjectId
          }
        }
      });

      if (existingAssignment) {
        // Update existing assignment by adding new classes
        const updatedClasses = [...new Set([...existingAssignment.classes, ...classes])];
        
        await prisma.teacherSubject.update({
          where: {
            teacherId_subjectId: {
              teacherId: teacher.teacherProfile.id,
              subjectId: subjectId
            }
          },
          data: {
            classes: updatedClasses
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Teacher assignment updated successfully',
          data: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            subjectId,
            subjectName: subject.name,
            assignedClasses: updatedClasses,
            newClasses: classes,
            action: 'updated'
          }
        });
      } else {
        // Create new assignment
        await prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacherProfile.id,
            subjectId: subjectId,
            classes: classes
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Teacher assigned successfully',
          data: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            subjectId,
            subjectName: subject.name,
            assignedClasses: classes,
            action: 'created'
          }
        }, { status: 201 });
      }
    } else if (action === 'unassign') {
      // Remove specific classes from assignment
      const existingAssignment = await prisma.teacherSubject.findUnique({
        where: {
          teacherId_subjectId: {
            teacherId: teacher.teacherProfile.id,
            subjectId: subjectId
          }
        }
      });

      if (!existingAssignment) {
        return NextResponse.json({
          error: 'Teacher is not assigned to this subject'
        }, { status: 404 });
      }

      const updatedClasses = existingAssignment.classes.filter(cls => !classes.includes(cls));

      if (updatedClasses.length === 0) {
        // Remove assignment entirely if no classes left
        await prisma.teacherSubject.delete({
          where: {
            teacherId_subjectId: {
              teacherId: teacher.teacherProfile.id,
              subjectId: subjectId
            }
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Teacher unassigned successfully',
          data: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            subjectId,
            subjectName: subject.name,
            removedClasses: classes,
            action: 'deleted'
          }
        });
      } else {
        // Update assignment with remaining classes
        await prisma.teacherSubject.update({
          where: {
            teacherId_subjectId: {
              teacherId: teacher.teacherProfile.id,
              subjectId: subjectId
            }
          },
          data: {
            classes: updatedClasses
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Classes removed from teacher assignment',
          data: {
            teacherId,
            teacherName: `${teacher.firstName} ${teacher.lastName}`,
            subjectId,
            subjectName: subject.name,
            removedClasses: classes,
            remainingClasses: updatedClasses,
            action: 'updated'
          }
        });
      }
    } else {
      return NextResponse.json({
        error: 'Invalid action. Use "assign" or "unassign"'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Coordinator teacher assignment error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
