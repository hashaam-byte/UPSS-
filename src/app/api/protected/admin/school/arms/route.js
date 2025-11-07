// src/app/api/protected/admin/school/arms/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verify authentication - allow admin, headadmin, and teacher
    const user = await requireAuth(['admin', 'headadmin', 'teacher']);

    // Get the school ID from the user
    const schoolId = user.schoolId || user.school?.id;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for user' },
        { status: 404 }
      );
    }

    // Fetch school information
    const school = await prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        slug: true
      }
    });

    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    let availableArms = [];
    let source = 'default';

    // Method 1: Get arms from existing student profiles (most reliable)
    const studentArms = await prisma.studentProfile.findMany({
      where: {
        user: {
          schoolId: schoolId,
          role: 'student',
          isActive: true
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
    const studentArmsList = studentArms
      .map(student => student.section)
      .filter(section => section && section.trim())
      .sort();

    // Method 2: Get arms from teacher subjects (for class teachers and coordinators)
    const teacherArms = await prisma.teacherSubject.findMany({
      where: {
        teacher: {
          user: {
            schoolId: schoolId,
            isActive: true
          }
        }
      },
      select: {
        classes: true
      }
    });

    // Extract arms from teacher classes (e.g., "SS1A" -> "A", "SS1 Silver" -> "Silver")
    const teacherArmsList = teacherArms
      .flatMap(ts => ts.classes || [])
      .map(className => {
        // First try to match single letter arms (e.g., "SS1A" -> "A")
        const letterMatch = className.match(/([A-Z])$/);
        if (letterMatch) return letterMatch[1];
        
        // Then try to match word arms (e.g., "SS1 Silver" -> "Silver")
        const wordMatch = className.match(/\s+([A-Z][a-z]+)$/);
        if (wordMatch) return wordMatch[1];
        
        return null;
      })
      .filter(arm => arm !== null);

    // Method 3: Check timetable entries for arms
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
        // Match single letter or word arms
        const letterMatch = className.match(/([A-Z])$/);
        if (letterMatch) return letterMatch[1];
        
        const wordMatch = className.match(/\s+([A-Z][a-z]+)$/);
        if (wordMatch) return wordMatch[1];
        
        return null;
      })
      .filter(arm => arm !== null);

    // Combine all sources and remove duplicates
    const combinedArms = [
      ...new Set([
        ...studentArmsList,
        ...teacherArmsList,
        ...timetableArmsList
      ])
    ].sort();

    // Determine which arms to use
    if (combinedArms.length > 0) {
      availableArms = combinedArms;
      source = 'database';
    } else {
      // Default arms - can be letter-based or name-based
      // Check if school has a preference (you can extend this later)
      availableArms = ['Silver', 'Diamond', 'Gold', 'Platinum', 'Ruby', 'Emerald'];
      source = 'default';
      
      // Alternative letter-based default
      // availableArms = ['A', 'B', 'C', 'D', 'E'];
    }

    return NextResponse.json({
      success: true,
      arms: availableArms,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug
      },
      metadata: {
        totalArms: availableArms.length,
        source: source,
        sources: {
          students: studentArmsList.length,
          teachers: teacherArmsList.length,
          timetables: timetableArmsList.length
        }
      },
      message: `Found ${availableArms.length} available class arms`
    });

  } catch (error) {
    console.error('Error fetching school arms:', error);
    
    // Handle authentication/authorization errors
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'Failed to fetch school arms',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);
    const { arms } = await request.json();

    // Validate input
    if (!Array.isArray(arms) || arms.length === 0) {
      return NextResponse.json(
        { error: 'Arms must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate each arm
    const validArms = arms.filter(arm => 
      typeof arm === 'string' && 
      arm.trim().length > 0 &&
      arm.length <= 20 // Reasonable length limit
    );

    if (validArms.length === 0) {
      return NextResponse.json(
        { error: 'No valid arms provided' },
        { status: 400 }
      );
    }

    const schoolId = user.schoolId || user.school?.id;
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School not found for user' },
        { status: 404 }
      );
    }

    // TODO: In future, store custom arms in a school_settings table
    // For now, this endpoint acknowledges the configuration
    // You can extend this to:
    // 1. Create a SchoolSettings model
    // 2. Store arms configuration there
    // 3. Use it as fallback in GET endpoint

    // Example implementation (uncomment when SchoolSettings model exists):
    /*
    await prisma.schoolSettings.upsert({
      where: { schoolId: schoolId },
      update: { 
        customArms: validArms,
        updatedAt: new Date()
      },
      create: {
        schoolId: schoolId,
        customArms: validArms
      }
    });
    */

    return NextResponse.json({
      success: true,
      message: 'Arms configuration updated successfully',
      arms: validArms,
      metadata: {
        schoolId: schoolId,
        totalArms: validArms.length,
        note: 'Custom arms configuration will be used as default'
      }
    });

  } catch (error) {
    console.error('Update arms error:', error);
    
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'Failed to update arms configuration',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}