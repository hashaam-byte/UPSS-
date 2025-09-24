// /app/api/protected/headadmin/schools/[id]/upgrade-limits/route.js
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request, { params }) {
  let user = null; // Declare at top level for error handling
  
  try {
    user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { id: schoolId } = params;

    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      );
    }

    // Parse request body for custom limits
    let newStudentLimit, newTeacherLimit;
    try {
      const body = await request.json();
      newStudentLimit = body.maxStudents;
      newTeacherLimit = body.maxTeachers;
    } catch {
      // If no body provided, use default upgrades
    }

    // Verify school exists and get current limits
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true,
        maxStudents: true,
        maxTeachers: true
      }
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Get current user counts by role
    const currentCounts = await prisma.user.groupBy({
      by: ['role'],
      where: {
        schoolId: schoolId,
        isActive: true,
        role: { in: ['student', 'teacher'] }
      },
      _count: true
    });

    const currentStudentCount = currentCounts.find(c => c.role === 'student')?._count || 0;
    const currentTeacherCount = currentCounts.find(c => c.role === 'teacher')?._count || 0;

    // Calculate new limits if not provided
    if (!newStudentLimit) {
      // Default upgrade: increase by 50% or minimum 100 more, whichever is greater
      const increase = Math.max(Math.ceil(school.maxStudents * 0.5), 100);
      newStudentLimit = school.maxStudents + increase;
    }

    if (!newTeacherLimit) {
      // Default upgrade: increase by 50% or minimum 10 more, whichever is greater
      const increase = Math.max(Math.ceil(school.maxTeachers * 0.5), 10);
      newTeacherLimit = school.maxTeachers + increase;
    }

    // Validate new limits
    if (newStudentLimit < currentStudentCount) {
      return NextResponse.json(
        { 
          error: `Cannot set student limit (${newStudentLimit}) below current student count (${currentStudentCount})`
        },
        { status: 400 }
      );
    }

    if (newTeacherLimit < currentTeacherCount) {
      return NextResponse.json(
        { 
          error: `Cannot set teacher limit (${newTeacherLimit}) below current teacher count (${currentTeacherCount})`
        },
        { status: 400 }
      );
    }

    // Validate reasonable limits (prevent abuse)
    if (newStudentLimit > 50000 || newTeacherLimit > 5000) {
      return NextResponse.json(
        { error: 'Requested limits exceed maximum allowed values' },
        { status: 400 }
      );
    }

    // Get school admins before transaction to reduce transaction time
    const schoolAdmins = await prisma.user.findMany({
      where: {
        schoolId: schoolId,
        role: 'admin',
        isActive: true
      },
      select: { id: true }
    });

    // Update school limits with increased timeout
    const result = await prisma.$transaction(async (tx) => {
      // Update school
      const updatedSchool = await tx.school.update({
        where: { id: schoolId },
        data: {
          maxStudents: newStudentLimit,
          maxTeachers: newTeacherLimit,
          updatedAt: new Date()
        }
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: user.id,
          action: 'UPGRADE_SCHOOL_LIMITS',
          resource: 'school',
          resourceId: schoolId,
          description: `Upgraded limits for school: ${school.name}`,
          metadata: {
            schoolName: school.name,
            schoolSlug: school.slug,
            previousLimits: {
              students: school.maxStudents,
              teachers: school.maxTeachers
            },
            newLimits: {
              students: newStudentLimit,
              teachers: newTeacherLimit
            },
            currentUsage: {
              students: currentStudentCount,
              teachers: currentTeacherCount
            },
            increases: {
              students: newStudentLimit - school.maxStudents,
              teachers: newTeacherLimit - school.maxTeachers
            },
            upgradedAt: new Date().toISOString(),
            upgradedBy: user.email
          }
        }
      });

      // Create notifications for school admins (batch create for efficiency)
      if (schoolAdmins.length > 0) {
        const notificationData = schoolAdmins.map(admin => ({
          userId: admin.id,
          title: 'School Limits Upgraded',
          content: `Your school limits have been upgraded! You can now have up to ${newStudentLimit} students (previously ${school.maxStudents}) and ${newTeacherLimit} teachers (previously ${school.maxTeachers}). This upgrade allows you to accommodate more users as your school grows.`,
          type: 'success',
          priority: 'normal'
        }));

        await tx.notification.createMany({
          data: notificationData
        });
      }

      return updatedSchool;
    }, {
      timeout: 10000 // Increase timeout to 10 seconds
    });

    return NextResponse.json({
      success: true,
      message: 'School limits upgraded successfully',
      school: {
        id: result.id,
        name: result.name,
        maxStudents: result.maxStudents,
        maxTeachers: result.maxTeachers
      },
      upgrade: {
        previousLimits: {
          students: school.maxStudents,
          teachers: school.maxTeachers
        },
        newLimits: {
          students: newStudentLimit,
          teachers: newTeacherLimit
        },
        increases: {
          students: newStudentLimit - school.maxStudents,
          teachers: newTeacherLimit - school.maxTeachers
        },
        currentUsage: {
          students: currentStudentCount,
          teachers: currentTeacherCount
        },
        availableSlots: {
          students: newStudentLimit - currentStudentCount,
          teachers: newTeacherLimit - currentTeacherCount
        }
      }
    });

  } catch (error) {
    console.error('Error upgrading school limits:', error);
    
    // Create error audit log with proper error handling
    try {
      if (user?.id) {
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'UPGRADE_SCHOOL_LIMITS_FAILED',
            resource: 'school',
            resourceId: params.id,
            description: `Failed to upgrade school limits: ${error.message}`,
            metadata: {
              error: error.message,
              timestamp: new Date().toISOString()
            }
          }
        });
      }
    } catch (auditError) {
      console.error('Failed to create error audit log:', auditError);
    }

    return NextResponse.json(
      { 
        error: 'Failed to upgrade school limits',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}