// /app/api/protected/teacher/class/subjects/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);

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
          subjects: [],
          message: 'No classes assigned to this class teacher'
        }
      });
    }

    // Get all subjects taught in the assigned classes
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        classes: {
          hasSome: assignedClasses
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
              hasSome: assignedClasses
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
      classes: subject.classes.filter(className => assignedClasses.includes(className)),
      teachers: subject.teachers.map(teacherSubject => ({
        id: teacherSubject.teacher.user.id,
        name: `${teacherSubject.teacher.user.firstName} ${teacherSubject.teacher.user.lastName}`,
        email: teacherSubject.teacher.user.email,
        classes: teacherSubject.classes.filter(className => assignedClasses.includes(className))
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
          assignedClasses: assignedClasses
        },
        teacherInfo: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          assignedClasses: assignedClasses
        }
      }
    });

  } catch (error) {
    console.error('Class teacher subjects GET error:', error);
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