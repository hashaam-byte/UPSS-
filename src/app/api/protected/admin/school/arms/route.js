// src/app/api/protected/admin/school/arms/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);

    // Get school ID
    const schoolId = user.role === 'admin' ? user.schoolId : null;

    // Fetch all classes from the database
    const classes = await prisma.class.findMany({
      where: schoolId ? { schoolId } : {},
      orderBy: { name: 'asc' }
    });

    // Extract unique arms from class codes
    // Assuming class code format is like "SS1A", "SS2B", etc.
    const arms = [...new Set(classes.map(c => {
      // Extract the last character (arm) from the code
      const code = c.code || c.name;
      const match = code.match(/[A-Z]+$/);
      return match ? match[0] : null;
    }).filter(Boolean))];

    // If no classes in database, return default arms
    const defaultArms = ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire'];
    
    // Also get class levels
    const classLevels = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
    
    return NextResponse.json({
      success: true,
      arms: arms.length > 0 ? arms.sort() : defaultArms,
      classLevels,
      classes: classes.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code
      }))
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    console.error('Get arms error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      arms: ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Silicon', 'Copper'] // Fallback
    }, { status: 500 });
  }
}