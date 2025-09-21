// /app/api/protected/teacher/class/settings/route.js
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

// GET - Fetch class teacher settings and preferences
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

    // Get school settings that affect class teachers
    const schoolSettings = await prisma.systemSetting.findMany({
      where: {
        category: {
          in: ['class_management', 'grading', 'communication', 'notifications']
        }
      }
    });

    const settings = {
      // Personal settings (stored in user profile or separate settings table)
      personalSettings: {
        emailNotifications: {
          studentAbsent: true,
          lowPerformance: true,
          parentMessages: true,
          assignmentOverdue: true,
          behavioralIssues: true
        },
        dashboardPreferences: {
          defaultView: 'performance', // 'performance', 'attendance', 'messages'
          studentsPerPage: 20,
          showParentContacts: true,
          autoRefresh: false,
          refreshInterval: 300 // seconds
        },
        gradingPreferences: {
          defaultGradingScale: 'percentage', // 'percentage', 'letter', 'points'
          roundingMethod: 'nearest', // 'up', 'down', 'nearest'
          showTrends: true,
          highlightConcerns: true
        },
        communicationSettings: {
          autoReplyEnabled: false,
          autoReplyMessage: '',
          signatureEnabled: true,
          emailSignature: `Best regards,\n${classTeacher.firstName} ${classTeacher.lastName}\nClass Teacher`,
          allowParentDirectContact: true,
          parentMeetingSlots: [] // Available time slots for parent meetings
        }
      },
      
      // School-wide settings that affect class teachers
      schoolSettings: schoolSettings.reduce((acc, setting) => {
        acc[setting.key] = {
          value: setting.value,
          dataType: setting.dataType,
          category: setting.category,
          description: setting.description
        };
        return acc;
      }, {}),
      
      // Class-specific settings
      classSettings: {
        assignedClasses: classNames,
        primaryClass: assignedClass || (classNames.length > 0 ? classNames[0] : null),
        classroomManagement: {
          attendanceTrackingEnabled: true,
          behaviorTrackingEnabled: true,
          parentProgressReports: 'weekly', // 'daily', 'weekly', 'monthly'
          performanceAlerts: {
            failingGradeThreshold: 60,
            attendanceThreshold: 85,
            consecutiveAbsences: 3
          }
        }
      },

      // Available options for dropdowns and selections
      availableOptions: {
        gradingScales: ['percentage', 'letter', 'points'],
        reportFrequencies: ['daily', 'weekly', 'monthly'],
        roundingMethods: ['up', 'down', 'nearest'],
        dashboardViews: ['performance', 'attendance', 'messages', 'overview']
      },

      teacherInfo: {
        id: classTeacher.id,
        name: `${classTeacher.firstName} ${classTeacher.lastName}`,
        email: classTeacher.email,
        employeeId: classTeacher.teacherProfile?.employeeId,
        department: classTeacher.teacherProfile?.department,
        joiningDate: classTeacher.teacherProfile?.joiningDate
      }
    };

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Class teacher settings GET error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update class teacher settings
export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { settingType, settingKey, value, settings } = body;

    // Handle bulk settings update
    if (settings && typeof settings === 'object') {
      // TODO: In production, you'd store these in a user_settings table
      // For now, we'll simulate the update
      
      return NextResponse.json({
        success: true,
        message: 'Settings updated successfully',
        data: {
          updatedSettings: Object.keys(settings),
          timestamp: new Date()
        }
      });
    }

    // Handle single setting update
    if (!settingType || !settingKey || value === undefined) {
      return NextResponse.json({
        error: 'Setting type, key, and value are required'
      }, { status: 400 });
    }

    // Validate setting updates based on type
    const validSettingTypes = [
      'personalSettings',
      'classSettings',
      'communicationSettings',
      'gradingPreferences',
      'dashboardPreferences',
      'emailNotifications'
    ];

    if (!validSettingTypes.includes(settingType)) {
      return NextResponse.json({
        error: 'Invalid setting type'
      }, { status: 400 });
    }

    // TODO: In production, implement actual setting storage
    // For now, simulate the update
    const updateResult = {
      settingType,
      settingKey,
      oldValue: null, // Would be fetched from database
      newValue: value,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      message: 'Setting updated successfully',
      data: updateResult
    });

  } catch (error) {
    console.error('Class teacher settings PUT error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Reset settings to default
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const classTeacher = await verifyClassTeacherAccess(token);
    const body = await request.json();
    const { resetType = 'all' } = body; // 'all', 'personal', 'class', 'communication'

    // TODO: In production, implement actual reset functionality
    // This would clear user-specific settings and restore defaults

    const resetResult = {
      resetType,
      affectedSettings: [],
      resetAt: new Date()
    };

    switch (resetType) {
      case 'personal':
        resetResult.affectedSettings = [
          'emailNotifications',
          'dashboardPreferences',
          'gradingPreferences'
        ];
        break;
      case 'class':
        resetResult.affectedSettings = [
          'classroomManagement',
          'performanceAlerts'
        ];
        break;
      case 'communication':
        resetResult.affectedSettings = [
          'communicationSettings',
          'emailSignature',
          'autoReply'
        ];
        break;
      case 'all':
      default:
        resetResult.affectedSettings = [
          'emailNotifications',
          'dashboardPreferences',
          'gradingPreferences',
          'classroomManagement',
          'communicationSettings'
        ];
    }

    return NextResponse.json({
      success: true,
      message: 'Settings reset successfully',
      data: resetResult
    });

  } catch (error) {
    console.error('Class teacher settings reset error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}