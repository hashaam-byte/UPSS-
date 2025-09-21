// app/api/protected/admin/school/arms/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    // Verify authentication and require admin or headadmin role
    const user = await requireAuth(['admin', 'headadmin']);

    // Get the school ID from the user
    const schoolId = user.school?.id;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for user' },
        { status: 404 }
      );
    }

    // Method 1: Get arms from existing student profiles (most reliable)
    const studentArms = await prisma.studentProfile.findMany({
      where: {
        user: {
          schoolId: schoolId,
          role: 'student'
        },
        section: {
          not: null
        }
      },
      select: {
        section: true
      },
      distinct: ['section']
    });

    // Extract unique arms from student sections
    let availableArms = studentArms
      .map(student => student.section)
      .filter(section => section && section.trim())
      .sort();

    // Method 2: Get arms from teacher subjects (for class teachers and coordinators)
    const teacherArms = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: {
            schoolId: schoolId
          }
        }
      },
      select: {
        classes: true
      }
    });

    // Extract arms from teacher classes (e.g., "SS1A" -> "A")
    const teacherArmsList = teacherArms
      .flatMap(ts => ts.classes || [])
      .map(className => {
        // Extract arm from class name (e.g., "SS1A" -> "A", "JS2B" -> "B")
        const match = className.match(/([A-Z]+)$/);
        return match ? match[1] : null;
      })
      .filter(arm => arm && arm.length === 1) // Only single letter arms
      .filter((arm, index, self) => self.indexOf(arm) === index) // Remove duplicates
      .sort();

    // Combine both sources
    const combinedArms = [...new Set([...availableArms, ...teacherArmsList])];

    // Method 3: If no arms found, provide default common arms
    if (combinedArms.length === 0) {
      availableArms = ['A', 'B', 'C', 'D', 'E'];
    } else {
      availableArms = combinedArms;
    }

    // Method 4: Check if there are any timetable entries that might have arms
    if (availableArms.length === 0) {
      const timetableArms = await prisma.timetable.findMany({
        where: {
          schoolId: schoolId
        },
        select: {
          className: true
        },
        distinct: ['className']
      });

      const timetableArmsList = timetableArms
        .map(t => t.className)
        .map(className => {
          const match = className.match(/([A-Z]+)$/);
          return match ? match[1] : null;
        })
        .filter(arm => arm && arm.length === 1)
        .filter((arm, index, self) => self.indexOf(arm) === index)
        .sort();

      if (timetableArmsList.length > 0) {
        availableArms = timetableArmsList;
      }
    }

    // Final fallback to common arms if still empty
    if (availableArms.length === 0) {
      availableArms = ['A', 'B', 'C'];
    }

    return NextResponse.json({
      success: true,
      arms: availableArms,
      message: `Found ${availableArms.length} available class arms`,
      metadata: {
        schoolId: schoolId,
        totalArms: availableArms.length,
        source: combinedArms.length > 0 ? 'database' : 'default'
      }
    });

  } catch (error) {
    console.error('Error fetching school arms:', error);
    
    // Handle authentication/authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch school arms',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Optional: POST endpoint to add/update arms for a school
export async function POST(request) {
  try {
    // Verify authentication and require admin or headadmin role
    const user = await requireAuth(['admin', 'headadmin']);

    const { arms } = await request.json();

    // Validate arms array
    if (!Array.isArray(arms) || arms.length === 0) {
      return NextResponse.json(
        { error: 'Invalid arms data. Expected non-empty array.' },
        { status: 400 }
      );
    }

    // Validate each arm (should be single letters)
    const validArms = arms.filter(arm => 
      typeof arm === 'string' && 
      arm.length === 1 && 
      /^[A-Z]$/.test(arm)
    );

    if (validArms.length !== arms.length) {
      return NextResponse.json(
        { 
          error: 'Invalid arm format. Arms should be single uppercase letters (A-Z).',
          received: arms,
          valid: validArms
        },
        { status: 400 }
      );
    }

    // Get school ID from user
    const schoolId = user.school?.id;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for user' },
        { status: 404 }
      );
    }
    
    // Store arms as a JSON setting
    await prisma.systemSetting.upsert({
      where: {
        key: `school_arms_${schoolId}`
      },
      update: {
        value: JSON.stringify(validArms.sort()),
        dataType: 'json',
        updatedBy: user.id
      },
      create: {
        key: `school_arms_${schoolId}`,
        value: JSON.stringify(validArms.sort()),
        dataType: 'json',
        category: 'school_config',
        description: `Available class arms for school ${schoolId}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'School arms updated successfully',
      arms: validArms.sort(),
      schoolId: schoolId
    });

  } catch (error) {
    console.error('Error updating school arms:', error);
    
    // Handle authentication/authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to update school arms',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for user' },
        { status: 404 }
      );
    }

    // Method 1: Get arms from existing student profiles (most reliable)
    const studentArms = await prisma.studentProfile.findMany({
      where: {
        user: {
          schoolId: schoolId,
          role: 'student'
        },
        section: {
          not: null
        }
      },
      select: {
        section: true
      },
      distinct: ['section']
    });

    // Extract unique arms from student sections
    let availableArms = studentArms
      .map(student => student.section)
      .filter(section => section && section.trim())
      .sort();

    // Method 2: Get arms from teacher subjects (for class teachers and coordinators)
    const teacherArms = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: {
            schoolId: schoolId
          }
        }
      },
      select: {
        classes: true
      }
    });

    // Extract arms from teacher classes (e.g., "SS1A" -> "A")
    const teacherArmsList = teacherArms
      .flatMap(ts => ts.classes || [])
      .map(className => {
        // Extract arm from class name (e.g., "SS1A" -> "A", "JS2B" -> "B")
        const match = className.match(/([A-Z]+)$/);
        return match ? match[1] : null;
      })
      .filter(arm => arm && arm.length === 1) // Only single letter arms
      .filter((arm, index, self) => self.indexOf(arm) === index) // Remove duplicates
      .sort();

    // Combine both sources
    const combinedArms = [...new Set([...availableArms, ...teacherArmsList])];

    // Method 3: If no arms found, provide default common arms
    if (combinedArms.length === 0) {
      availableArms = ['A', 'B', 'C', 'D', 'E'];
    } else {
      availableArms = combinedArms;
    }

    // Method 4: Check if there are any timetable entries that might have arms
    if (availableArms.length === 0) {
      const timetableArms = await prisma.timetable.findMany({
        where: {
          schoolId: schoolId
        },
        select: {
          className: true
        },
        distinct: ['className']
      });

      const timetableArmsList = timetableArms
        .map(t => t.className)
        .map(className => {
          const match = className.match(/([A-Z]+)$/);
          return match ? match[1] : null;
        })
        .filter(arm => arm && arm.length === 1)
        .filter((arm, index, self) => self.indexOf(arm) === index)
        .sort();

      if (timetableArmsList.length > 0) {
        availableArms = timetableArmsList;
      }
    }

    // Final fallback to common arms if still empty
    if (availableArms.length === 0) {
      availableArms = ['A', 'B', 'C'];
    }

    return NextResponse.json({
      success: true,
      arms: availableArms,
      message: `Found ${availableArms.length} available class arms`,
      metadata: {
        schoolId: schoolId,
        totalArms: availableArms.length,
        source: combinedArms.length > 0 ? 'database' : 'default'
      }
    });

