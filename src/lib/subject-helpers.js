// src/lib/subject-helpers.js
import { prisma } from '@/lib/prisma';

/**
 * Validates that a teacher has access to a specific subject
 * @param {string} teacherId - Teacher's user ID
 * @param {string} subjectId - Actual Subject ID (not TeacherSubject ID)
 * @returns {Promise<Object>} TeacherSubject record with subject details
 * @throws {Error} If teacher doesn't have access
 */
export async function validateTeacherSubjectAccess(teacherId, subjectId) {
  // Get teacher profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacherId },
    select: { id: true }
  });

  if (!teacherProfile) {
    throw new Error('Teacher profile not found');
  }

  // Check access
  const access = await prisma.teacherSubject.findFirst({
    where: {
      teacherId: teacherProfile.id,
      subjectId: subjectId, // Always expect actual Subject.id
      subject: { 
        isActive: true,
        schoolId: { not: null } // Ensure subject belongs to a school
      }
    },
    include: {
      subject: {
        select: {
          id: true,
          name: true,
          code: true,
          category: true,
          schoolId: true,
          isActive: true
        }
      }
    }
  });

  if (!access) {
    throw new Error('You do not have access to this subject');
  }

  return access;
}

/**
 * Gets all subjects a teacher can teach
 * @param {string} teacherId - Teacher's user ID
 * @param {string} schoolId - School ID
 * @returns {Promise<Array>} List of subjects with proper IDs
 */
export async function getTeacherSubjects(teacherId, schoolId) {
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacherId },
    include: {
      teacherSubjects: {
        where: {
          subject: {
            schoolId: schoolId,
            isActive: true
          }
        },
        include: {
          subject: {
            select: {
              id: true,
              name: true,
              code: true,
              category: true,
              classes: true,
              isActive: true
            }
          }
        }
      }
    }
  });

  if (!teacherProfile) {
    return [];
  }

  // Return subjects with ACTUAL Subject.id
  return teacherProfile.teacherSubjects.map(ts => ({
    // Store both IDs for reference but use subjectId as primary
    teacherSubjectId: ts.id, // Keep for reference
    id: ts.subject.id,        // ACTUAL Subject ID - use this everywhere
    subjectId: ts.subject.id, // Alias for clarity
    name: ts.subject.name,
    code: ts.subject.code,
    category: ts.subject.category,
    classes: ts.classes, // Classes this teacher teaches for this subject
    availableClasses: ts.subject.classes, // All classes the subject is available for
    isActive: ts.subject.isActive
  }));
}

/**
 * Standardizes test type to valid AssignmentType enum
 * @param {string} testType - Frontend test type
 * @returns {string} Valid AssignmentType enum value
 */
export function mapTestTypeToAssignmentType(testType) {
  const mapping = {
    'test': 'exam',
    'exam': 'exam',
    'quiz': 'quiz',
    'assessment': 'exam',
    'examination': 'exam'
  };
  
  return mapping[testType?.toLowerCase()] || 'exam';
}

/**
 * Standardizes status to valid AssignmentStatus enum
 * @param {string} status - Frontend status
 * @returns {string} Valid AssignmentStatus enum value
 */
export function mapStatusToAssignmentStatus(status) {
  const mapping = {
    'published': 'active',
    'active': 'active',
    'draft': 'draft',
    'closed': 'closed',
    'cancelled': 'cancelled'
  };
  
  return mapping[status?.toLowerCase()] || 'draft';
}

/**
 * Gets all unique classes from teacher's subjects
 * @param {string} teacherId - Teacher's user ID
 * @returns {Promise<Array<string>>} List of unique class names
 */
export async function getTeacherClasses(teacherId) {
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: teacherId },
    include: {
      teacherSubjects: {
        select: {
          classes: true
        }
      }
    }
  });

  if (!teacherProfile) {
    return [];
  }

  // Flatten and deduplicate classes
  const allClasses = teacherProfile.teacherSubjects.flatMap(ts => ts.classes);
  return [...new Set(allClasses)].sort();
}