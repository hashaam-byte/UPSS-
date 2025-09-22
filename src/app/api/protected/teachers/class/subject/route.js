// /app/api/protected/teacher/class/subjects/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Helper function to verify class teacher access
async function verifyClassTeacherAccess(token) {
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

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
    throw new Error('Access denied');
  }

  return user;
}

export async function GET(request) {
  try {
    await requireAuth(['class_teacher']);

    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);

    // Get assigned classes
    const assignedClass = classTeacher.teacherProfile?.coordinatorClass;
    let classNames = [];
    
    if (assignedClass) {
      classNames = [assignedClass];
    } else {
      const teacherSubjects = classTeacher.teacherProfile?.teacherSubjects || [];
      classNames = [...new Set(
        teacherSubjects.flatMap(ts => ts.classes)
      )];
    }

    if (classNames.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          subjects: [],
          message: 'No classes assigned to this class teacher'
        }
      });
    }

    // Get all subjects taught in the assigned classes
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: classTeacher.schoolId,
        isActive: true,
        classes: {
          hasSome: classNames
        }
      },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          },
          where: {
            classes: {
              hasSome: classNames
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Format subjects data with teacher information
    const formattedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      category: subject.category,
      classes: subject.classes.filter(className => classNames.includes(className)),
      teachers: subject.teachers.map(teacherSubject => ({
        id: teacherSubject.teacher.user.id,
        name: `${teacherSubject.teacher.user.firstName} ${teacherSubject.teacher.user.lastName}`,
        email: teacherSubject.teacher.user.email,
        classes: teacherSubject.classes.filter(className => classNames.includes(className))
      })),
      isActive: subject.isActive,
      createdAt: subject.createdAt,
      updatedAt: subject.updatedAt
    }));

    return NextResponse.json({
      success: true,
      data: {
        subjects: formattedSubjects,
        summary: {
          totalSubjects: formattedSubjects.length,
          subjectsByCategory: getSubjectsByCategory(formattedSubjects),
          assignedClasses: classNames
        },
        teacherInfo: {
          id: classTeacher.id,
          name: `${classTeacher.firstName} ${classTeacher.lastName}`,
          assignedClasses: classNames
        }
      }
    });

  } catch (error) {
    console.error('Class teacher subjects GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to group subjects by category
function getSubjectsByCategory(subjects) {
  const categories = {};
  
  subjects.forEach(subject => {
    const category = subject.category || 'OTHER';
    if (!categories[category]) {
      categories[category] = 0;
    }
    categories[category]++;
  });
  
  return categories;
}