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

    // Get (or lazily create) this teacher's real settings row
    let userSettings = await prisma.userSettings.findUnique({
      where: { userId: user.id }
    });
    if (!userSettings) {
      userSettings = await prisma.userSettings.create({
        data: { userId: user.id }
      });
    }

    const DEFAULT_PREFERENCES = {
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
      },
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
    };

    // Merge stored JSON preferences over defaults (stored values win)
    const storedPrefs = userSettings.preferences || {};
    const mergedPrefs = {
      dashboardPreferences: { ...DEFAULT_PREFERENCES.dashboardPreferences, ...(storedPrefs.dashboardPreferences || {}) },
      gradingPreferences: { ...DEFAULT_PREFERENCES.gradingPreferences, ...(storedPrefs.gradingPreferences || {}) },
      communicationSettings: { ...DEFAULT_PREFERENCES.communicationSettings, ...(storedPrefs.communicationSettings || {}) },
      classroomManagement: { ...DEFAULT_PREFERENCES.classroomManagement, ...(storedPrefs.classroomManagement || {}) }
    };

    const settings = {
      // Personal settings — fixed fields come from the real UserSettings row,
      // free-form ones come from the merged JSON preferences blob
      personalSettings: {
        emailNotifications: {
          studentAbsent: userSettings.attendanceAlerts,
          lowPerformance: userSettings.gradeNotifications,
          parentMessages: userSettings.emailNotifications,
          assignmentOverdue: userSettings.assignmentReminders,
          behavioralIssues: userSettings.attendanceAlerts
        },
        dashboardPreferences: mergedPrefs.dashboardPreferences,
        gradingPreferences: mergedPrefs.gradingPreferences,
        communicationSettings: mergedPrefs.communicationSettings
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
        classroomManagement: mergedPrefs.classroomManagement
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

    // Fixed columns on UserSettings that map to top-level flags rather than the JSON blob
    const FIXED_FIELD_MAP = {
      emailNotifications: 'emailNotifications',
      pushNotifications: 'pushNotifications',
      smsNotifications: 'smsNotifications',
      assignmentReminders: 'assignmentReminders',
      gradeNotifications: 'gradeNotifications',
      attendanceAlerts: 'attendanceAlerts',
      theme: 'theme',
      language: 'language'
    };

    // Handle bulk settings update
    if (settings && typeof settings === 'object') {
      const existing = await prisma.userSettings.findUnique({ where: { userId: user.id } });
      const existingPrefs = existing?.preferences || {};

      const fixedUpdates = {};
      const jsonUpdates = { ...existingPrefs };

      for (const [key, val] of Object.entries(settings)) {
        if (FIXED_FIELD_MAP[key]) {
          fixedUpdates[FIXED_FIELD_MAP[key]] = val;
        } else {
          // treat as a preferences sub-object, e.g. dashboardPreferences / gradingPreferences
          jsonUpdates[key] = { ...(jsonUpdates[key] || {}), ...(typeof val === 'object' ? val : { value: val }) };
        }
      }

      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: { ...fixedUpdates, preferences: jsonUpdates },
        create: { userId: user.id, ...fixedUpdates, preferences: jsonUpdates }
      });

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

    const existing = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    const oldValue = FIXED_FIELD_MAP[settingKey]
      ? existing?.[FIXED_FIELD_MAP[settingKey]] ?? null
      : existing?.preferences?.[settingType]?.[settingKey] ?? null;

    if (FIXED_FIELD_MAP[settingKey]) {
      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: { [FIXED_FIELD_MAP[settingKey]]: value },
        create: { userId: user.id, [FIXED_FIELD_MAP[settingKey]]: value }
      });
    } else {
      const prefs = existing?.preferences || {};
      const sectionPrefs = { ...(prefs[settingType] || {}), [settingKey]: value };
      const updatedPrefs = { ...prefs, [settingType]: sectionPrefs };

      await prisma.userSettings.upsert({
        where: { userId: user.id },
        update: { preferences: updatedPrefs },
        create: { userId: user.id, preferences: updatedPrefs }
      });
    }

    const updateResult = {
      settingType,
      settingKey,
      oldValue,
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

    const resetResult = {
      resetType,
      affectedSettings: [],
      resetAt: new Date()
    };

    const existing = await prisma.userSettings.findUnique({ where: { userId: user.id } });
    const prefs = existing?.preferences || {};

    const RESET_GROUPS = {
      personal: {
        affectedSettings: ['emailNotifications', 'dashboardPreferences', 'gradingPreferences'],
        fixedFields: { emailNotifications: true, assignmentReminders: true, gradeNotifications: true },
        jsonKeys: ['dashboardPreferences', 'gradingPreferences']
      },
      class: {
        affectedSettings: ['classroomManagement', 'performanceAlerts'],
        fixedFields: {},
        jsonKeys: ['classroomManagement']
      },
      communication: {
        affectedSettings: ['communicationSettings', 'emailSignature', 'autoReply'],
        fixedFields: {},
        jsonKeys: ['communicationSettings']
      }
    };
    RESET_GROUPS.all = {
      affectedSettings: [
        'emailNotifications', 'dashboardPreferences', 'gradingPreferences',
        'classroomManagement', 'communicationSettings'
      ],
      fixedFields: { emailNotifications: true, assignmentReminders: true, gradeNotifications: true, attendanceAlerts: true },
      jsonKeys: ['dashboardPreferences', 'gradingPreferences', 'classroomManagement', 'communicationSettings']
    };

    const group = RESET_GROUPS[resetType] || RESET_GROUPS.all;
    resetResult.affectedSettings = group.affectedSettings;

    // Drop the JSON keys for this group so GET falls back to defaults
    const updatedPrefs = { ...prefs };
    for (const key of group.jsonKeys) delete updatedPrefs[key];

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: { ...group.fixedFields, preferences: updatedPrefs },
      create: { userId: user.id, ...group.fixedFields, preferences: updatedPrefs }
    });

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