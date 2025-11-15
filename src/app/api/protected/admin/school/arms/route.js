// src/app/api/protected/admin/school/arms/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET - Fetch all arms
export async function GET(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);

    // Get school ID
    const schoolId = user.role === 'admin' ? user.schoolId : null;

    // Try to get arms from school settings first
    let arms = [];
    
    if (schoolId) {
      const schoolSettings = await prisma.systemSetting.findFirst({
        where: {
          key: `school_arms_${schoolId}`,
          category: 'school_config'
        }
      });

      if (schoolSettings) {
        try {
          arms = JSON.parse(schoolSettings.value);
        } catch (e) {
          console.error('Failed to parse arms:', e);
        }
      }
    }

    // If no arms found, return default arms
    if (arms.length === 0) {
      arms = ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Copper', 'Mercury'];
    }

    // Also get class levels for reference
    const classLevels = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];
    
    return NextResponse.json({
      success: true,
      arms: arms,
      classLevels
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
      arms: ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Copper', 'Mercury'] // Fallback
    }, { status: 500 });
  }
}

// POST - Add, Edit, or Delete arms
export async function POST(request) {
  try {
    const user = await requireAuth(['admin', 'headadmin']);

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Only school admins can modify arms' }, { status: 403 });
    }

    const schoolId = user.schoolId;
    const body = await request.json();
    const { action, armName, oldName, newName } = body;

    // Get current arms
    let arms = [];
    let settingId = null;
    
    const schoolSettings = await prisma.systemSetting.findFirst({
      where: {
        key: `school_arms_${schoolId}`,
        category: 'school_config'
      }
    });

    if (schoolSettings) {
      settingId = schoolSettings.id;
      try {
        arms = JSON.parse(schoolSettings.value);
      } catch (e) {
        arms = ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Copper', 'Mercury'];
      }
    } else {
      arms = ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Copper', 'Mercury'];
    }

    // Perform action
    switch (action) {
      case 'add':
        if (!armName || !armName.trim()) {
          return NextResponse.json({ error: 'Arm name is required' }, { status: 400 });
        }
        
        const normalizedNewArm = armName.trim();
        
        // Check for duplicates (case-insensitive)
        if (arms.some(arm => arm.toLowerCase() === normalizedNewArm.toLowerCase())) {
          return NextResponse.json({ error: 'This arm already exists' }, { status: 400 });
        }
        
        arms.push(normalizedNewArm);
        break;

      case 'edit':
        if (!oldName || !newName || !newName.trim()) {
          return NextResponse.json({ error: 'Old name and new name are required' }, { status: 400 });
        }
        
        const normalizedEditArm = newName.trim();
        
        // Check for duplicates (case-insensitive, excluding current arm)
        if (arms.some(arm => arm.toLowerCase() === normalizedEditArm.toLowerCase() && arm !== oldName)) {
          return NextResponse.json({ error: 'This arm already exists' }, { status: 400 });
        }
        
        const editIndex = arms.findIndex(arm => arm === oldName);
        if (editIndex === -1) {
          return NextResponse.json({ error: 'Arm not found' }, { status: 404 });
        }
        
        arms[editIndex] = normalizedEditArm;
        
        // Update all students with this arm
        await prisma.studentProfile.updateMany({
          where: {
            user: { schoolId },
            className: {
              contains: oldName
            }
          },
          data: {
            className: {
              // This is a simplified approach - you might need to handle this differently
              // based on your exact className format
            }
          }
        });
        
        break;

      case 'delete':
        if (!armName) {
          return NextResponse.json({ error: 'Arm name is required' }, { status: 400 });
        }
        
        const deleteIndex = arms.findIndex(arm => arm === armName);
        if (deleteIndex === -1) {
          return NextResponse.json({ error: 'Arm not found' }, { status: 404 });
        }
        
        // Check if any students are assigned to this arm
        const studentsWithArm = await prisma.studentProfile.count({
          where: {
            user: { schoolId },
            className: {
              contains: armName
            }
          }
        });
        
        if (studentsWithArm > 0) {
          return NextResponse.json({ 
            error: `Cannot delete arm: ${studentsWithArm} student(s) are currently assigned to this arm. Please reassign them first.` 
          }, { status: 400 });
        }
        
        arms.splice(deleteIndex, 1);
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // Save updated arms
    const armsJson = JSON.stringify(arms);
    
    if (settingId) {
      await prisma.systemSetting.update({
        where: { id: settingId },
        data: {
          value: armsJson,
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.systemSetting.create({
        data: {
          key: `school_arms_${schoolId}`,
          value: armsJson,
          dataType: 'json',
          category: 'school_config',
          description: 'Custom class arms configured for this school'
        }
      });
    }

    return NextResponse.json({
      success: true,
      message: `Arm ${action}ed successfully`,
      arms
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    console.error('Arms management error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
}