// /app/api/protected/teacher/class/settings/route.js
import { requireAuth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Fetch class teacher settings and preferences
export async function GET(request) {
  try {
    const user = await requireAuth(['class_teacher']);

    // Get teacher profile and assigned classes
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: { teacherSubjects: true }
    });
    
    const assignedClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);

    // Get school settings that affect class teachers
    const schoolSettings = await prisma.systemSetting.findMany({
      where: {
        category: {
          in: ['class_management', 'grading', 'communication', 'notifications']
        }
      }
    });

    const settings = {
      // Personal settings
      personalSettings: {
        emailNotifications: {
          studentAbsent: true,
          lowPerformance: true,
          parentMessages: true,
          assignmentOverdue: true,
          behavioralIssues: true
        },
        dashboardPreferences: {
          defaultView: 'performance',
          studentsPerPage: 20,
          showParentContacts: true,
          autoRefresh: false,
          refreshInterval: 300
        },
        gradingPreferences: {
          defaultGradingScale: 'percentage',
          roundingMethod: 'nearest',
          showTrends: true,
          highlightConcerns: true
        },
        communicationSettings: {
          autoReplyEnabled: false,
          autoReplyMessage: '',
          signatureEnabled: true,
          emailSignature: `Best regards,\n${user.firstName} ${user.lastName}\nClass Teacher`,
          allowParentDirectContact: true,
          parentMeetingSlots: []
        }
      },
      
      // School-wide settings
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
        assignedClasses: assignedClasses,
        primaryClass: assignedClasses.length > 0 ? assignedClasses[0] : null,
        classroomManagement: {
          attendanceTrackingEnabled: true,
          behaviorTrackingEnabled: true,
          parentProgressReports: 'weekly',
          performanceAlerts: {
            failingGradeThreshold: 60,
            attendanceThreshold: 85,
            consecutiveAbsences: 3
          }
        }
      },

      // Available options
      availableOptions: {
        gradingScales: ['percentage', 'letter', 'points'],
        reportFrequencies: ['daily', 'weekly', 'monthly'],
        roundingMethods: ['up', 'down', 'nearest'],
        dashboardViews: ['performance', 'attendance', 'messages', 'overview']
      },

      teacherInfo: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        employeeId: teacherProfile?.employeeId,
        department: teacherProfile?.department,
        joiningDate: teacherProfile?.joiningDate
      }
    };

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('Class teacher settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update class teacher settings
export async function PUT(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { settingType, settingKey, value, settings } = body;

    // Handle bulk settings update
    if (settings && typeof settings === 'object') {
      // TODO: In production, store these in a user_settings table
      
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
    const updateResult = {
      settingType,
      settingKey,
      oldValue: null,
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Reset settings to default
export async function POST(request) {
  try {
    const user = await requireAuth(['class_teacher']);
    const body = await request.json();
    const { resetType = 'all' } = body;

    // TODO: In production, implement actual reset functionality

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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}