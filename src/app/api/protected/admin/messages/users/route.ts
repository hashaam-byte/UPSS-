import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth(['admin']);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, get all users that the admin has already chatted with
    const existingMessages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: user.id },
          { toUserId: user.id }
        ],
        schoolId: user.schoolId
      },
      select: {
        fromUserId: true,
        toUserId: true
      }
    });

    // Extract unique user IDs that admin has chatted with
    const chattedUserIds = new Set<string>();
    existingMessages.forEach(message => {
      if (message.fromUserId !== user.id) {
        chattedUserIds.add(message.fromUserId);
      }
      if (message.toUserId !== user.id) {
        chattedUserIds.add(message.toUserId);
      }
    });

    // Fetch all users EXCEPT those already chatted with
    const availableUsers = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        id: {
          not: user.id, // Exclude current user
          notIn: Array.from(chattedUserIds) // Exclude users already chatted with
        },
        role: {
          in: ['teacher', 'admin', 'student']
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        teacherProfile: {
          select: {
            coordinatorClass: true,
            department: true,
            employeeId: true,
            teacherSubjects: {
              include: {
                subject: {
                  select: {
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        },
        studentProfile: {
          select: {
            className: true,
            section: true,
            studentId: true,
            department: true
          }
        },
        adminProfile: {
          select: {
            department: true,
            employeeId: true
          }
        }
      },
      orderBy: [
        { role: 'asc' }, // Sort by role: admin, student, teacher
        { firstName: 'asc' }
      ]
    });

    // Also return users already chatted with for reference (optional)
    const existingContacts = await prisma.user.findMany({
      where: {
        id: {
          in: Array.from(chattedUserIds)
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        avatar: true,
        teacherProfile: {
          select: {
            coordinatorClass: true,
            department: true,
            teacherSubjects: {
              include: {
                subject: {
                  select: {
                    name: true
                  }
                }
              }
            }
          }
        },
        studentProfile: {
          select: {
            className: true,
            section: true
          }
        },
        adminProfile: {
          select: {
            department: true
          }
        }
      },
      orderBy: [
        { role: 'asc' },
        { firstName: 'asc' }
      ]
    });

    return NextResponse.json({ 
      success: true, 
      availableUsers, // Users you haven't chatted with
      existingContacts, // Users you've already chatted with
      totalAvailable: availableUsers.length,
      totalExisting: existingContacts.length
    });
  } catch (error) {
    console.error('Error fetching available users:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch available users',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}