import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const SENIOR_SUBJECTS = {
  CORE: [
    { name: 'Mathematics', code: 'MATH' },
    { name: 'English Language', code: 'ENG' }
  ],
  SCIENCE: [
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'Biology', code: 'BIO' }
  ],
  ARTS: [
    { name: 'Literature', code: 'LIT' },
    { name: 'Christian Religious Studies', code: 'CRS' },
    { name: 'Government', code: 'GOV' }
  ],
  COMMERCIAL: [
    { name: 'Commerce', code: 'COM' },
    { name: 'Accounting', code: 'ACC' },
    { name: 'Economics', code: 'ECO' }
  ],
  VOCATIONAL: [
    { name: 'Computer Craft Practice', code: 'CCP' },
    { name: 'Cosmetology', code: 'COS' },
    { name: 'Fisheries', code: 'FISH' },
    { name: 'Garment Making', code: 'GAR' },
    { name: 'Photography', code: 'PHOT' },
    { name: 'Basic Electronics', code: 'BELE' },
    { name: 'Further Mathematics', code: 'FMATH' },
    { name: 'Geography', code: 'GEO' },
    { name: 'Office Practice', code: 'OFF' },
    { name: 'Visual Arts', code: 'VART' },
    { name: 'Agriculture', code: 'AGRIC' },
    { name: 'Auto Mechanics', code: 'AUTO' },
    { name: 'Technical Drawing', code: 'TDRAW' },
    { name: 'Tourism', code: 'TOUR' }
  ],
  GENERAL: [
    { name: 'ICT', code: 'ICT' },
    { name: 'Critical Thinking', code: 'CRIT' }
  ]
};

// All available classes including both JS and SS with their arms
const ALL_AVAILABLE_CLASSES = [
  // Junior Secondary
  'JS1', 'JS1 silver', 'JS1 diamond', 'JS1 mercury', 'JS1 platinum', 'JS1 copper', 'JS1 gold',
  'JS2', 'JS2 silver', 'JS2 diamond', 'JS2 mercury', 'JS2 platinum', 'JS2 copper', 'JS2 gold',
  'JS3', 'JS3 silver', 'JS3 diamond', 'JS3 mercury', 'JS3 platinum', 'JS3 copper', 'JS3 gold',
  // Senior Secondary
  'SS1', 'SS1 silver', 'SS1 diamond', 'SS1 mercury', 'SS1 platinum', 'SS1 copper', 'SS1 gold',
  'SS2', 'SS2 silver', 'SS2 diamond', 'SS2 mercury', 'SS2 platinum', 'SS2 copper', 'SS2 gold',
  'SS3', 'SS3 silver', 'SS3 diamond', 'SS3 mercury', 'SS3 platinum', 'SS3 copper', 'SS3 gold'
];

// Helper function to verify director access
async function verifyDirectorAccess(token) {
  if (!token) {
    throw new Error('Unauthorized');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { teacherProfile: true, school: true }
  });

  if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
    throw new Error('Access denied');
  }

  return user;
}

// Helper function to validate class names
function validateClasses(classes) {
  if (!Array.isArray(classes)) {
    return { valid: false, error: 'Classes must be an array' };
  }

  const invalidClasses = classes.filter(cls => !ALL_AVAILABLE_CLASSES.includes(cls));
  if (invalidClasses.length > 0) {
    return { 
      valid: false, 
      error: `Invalid classes: ${invalidClasses.join(', ')}. Valid classes include: JS1-JS3 and SS1-SS3 with optional arms (silver, diamond, mercury, platinum, copper, gold)` 
    };
  }

  return { valid: true };
}

// Helper function to get class stage (JS or SS)
function getClassStage(className) {
  if (className.startsWith('JS')) return 'JS';
  if (className.startsWith('SS')) return 'SS';
  return null;
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const classFilter = searchParams.get('class');

    // Build where clause based on whether class filter is provided
    let whereClause = {
      schoolId: user.schoolId,
      isActive: true
    };

    // If class filter is provided, filter subjects that apply to that class or its stage
    if (classFilter) {
      const classStage = getClassStage(classFilter);
      const classLevel = classFilter.substring(0, 3); // JS1, SS2, etc.
      
      whereClause.classes = {
        hasSome: [
          classFilter, // Exact class match
          classLevel,  // Level match (JS1, SS2)
          classStage   // Stage match (JS, SS)
        ].filter(Boolean)
      };
    }

    // Get subjects with their assigned teachers
    const subjects = await prisma.subject.findMany({
      where: whereClause,
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          },
          ...(classFilter && {
            where: {
              classes: {
                hasSome: [classFilter]
              }
            }
          })
        }
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' }
      ]
    });

    // Get unique categories from existing subjects
    const existingCategories = [...new Set(subjects.map(s => s.category))].sort();
    
    // Transform subjects data
    const transformedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      category: subject.category,
      classes: subject.classes,
      isActive: subject.isActive,
      teachers: subject.teachers.map(ts => ({
        id: ts.teacher.user.id,
        name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
        email: ts.teacher.user.email,
        classes: classFilter 
          ? ts.classes.filter(c => {
              const classStage = getClassStage(classFilter);
              const classLevel = classFilter.substring(0, 3);
              return c === classFilter || c === classLevel || c === classStage;
            })
          : ts.classes
      }))
    }));

    // Build response data
    const responseData = {
      subjects: transformedSubjects,
      categories: existingCategories,
      availableSubjects: SENIOR_SUBJECTS,
      availableClasses: ALL_AVAILABLE_CLASSES,
      totalSubjects: subjects.length,
      ...(classFilter && {
        classFilter,
        classSpecificSubjects: transformedSubjects.filter(s => 
          s.classes.some(cls => {
            const classStage = getClassStage(classFilter);
            const classLevel = classFilter.substring(0, 3);
            return cls === classFilter || cls === classLevel || cls === classStage;
          })
        ).map(s => s.name)
      })
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Director subjects error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { name, code, category, classes, teacherIds } = await request.json();

    // Validate required input
    if (!name || !code || !category || !classes || !Array.isArray(classes)) {
      return NextResponse.json({ 
        error: 'Invalid input. Name, code, category, and classes array are required.' 
      }, { status: 400 });
    }

    // Validate classes
    const classValidation = validateClasses(classes);
    if (!classValidation.valid) {
      return NextResponse.json({ error: classValidation.error }, { status: 400 });
    }

    // Check if subject with same code already exists in the school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        code: code.toUpperCase(),
        schoolId: user.schoolId
      }
    });

    if (existingSubject) {
      return NextResponse.json({ 
        error: 'A subject with this code already exists in your school.' 
      }, { status: 409 });
    }

    // Create the subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code: code.toUpperCase(),
        category,
        classes,
        schoolId: user.schoolId,
        isActive: true
      }
    });

    // Assign teachers if provided
    if (teacherIds && Array.isArray(teacherIds) && teacherIds.length > 0) {
      // Verify all teacher IDs belong to teachers in the same school
      const teachers = await prisma.user.findMany({
        where: {
          id: { in: teacherIds },
          schoolId: user.schoolId,
          role: 'teacher'
        },
        include: { teacherProfile: true }
      });

      if (teachers.length !== teacherIds.length) {
        return NextResponse.json({ 
          error: 'One or more teacher IDs are invalid or not from your school.' 
        }, { status: 400 });
      }

      // Create teacher-subject assignments
      const teacherAssignments = teacherIds.map(teacherId => {
        // Find the corresponding teacher profile ID
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher?.teacherProfile?.id) {
          throw new Error(`Teacher profile not found for user ID: ${teacherId}`);
        }

        return prisma.teacherSubject.create({
          data: {
            teacherId: teacher.teacherProfile.id, // Use teacher profile ID, not user ID
            subjectId: subject.id,
            classes: classes // Assign to all classes the subject covers
          }
        });
      });

      await Promise.all(teacherAssignments);
    }

    // Fetch the created subject with teacher assignments
    const createdSubject = await prisma.subject.findUnique({
      where: { id: subject.id },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject created successfully',
      data: {
        id: createdSubject.id,
        name: createdSubject.name,
        code: createdSubject.code,
        category: createdSubject.category,
        classes: createdSubject.classes,
        isActive: createdSubject.isActive,
        teachers: createdSubject.teachers.map(ts => ({
          id: ts.teacher.user.id,
          name: `${ts.teacher.user.firstName} ${ts.teacher.user.lastName}`,
          email: ts.teacher.user.email,
          classes: ts.classes
        }))
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create subject error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('id');
    const { name, code, category, classes, teacherIds, isActive } = await request.json();

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    // Verify subject belongs to the director's school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId
      }
    });

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Validate classes if provided
    if (classes) {
      const classValidation = validateClasses(classes);
      if (!classValidation.valid) {
        return NextResponse.json({ error: classValidation.error }, { status: 400 });
      }
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(name && { name }),
        ...(code && { code: code.toUpperCase() }),
        ...(category && { category }),
        ...(classes && { classes }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });

    // Update teacher assignments if provided
    if (teacherIds && Array.isArray(teacherIds)) {
      // Remove existing assignments
      await prisma.teacherSubject.deleteMany({
        where: { subjectId: subjectId }
      });

      // Add new assignments
      if (teacherIds.length > 0) {
        // Get teacher profile IDs for the provided user IDs
        const teachers = await prisma.user.findMany({
          where: {
            id: { in: teacherIds },
            schoolId: user.schoolId,
            role: 'teacher'
          },
          include: { teacherProfile: true }
        });

        const teacherAssignments = teachers
          .filter(t => t.teacherProfile?.id)
          .map(teacher => 
            prisma.teacherSubject.create({
              data: {
                teacherId: teacher.teacherProfile.id,
                subjectId: subjectId,
                classes: classes || existingSubject.classes
              }
            })
          );

        await Promise.all(teacherAssignments);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Subject updated successfully',
      data: updatedSubject
    });

  } catch (error) {
    console.error('Update subject error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const subjectId = searchParams.get('id');

    if (!subjectId) {
      return NextResponse.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    // Verify subject belongs to the director's school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        schoolId: user.schoolId
      }
    });

    if (!existingSubject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 });
    }

    // Delete teacher assignments first
    await prisma.teacherSubject.deleteMany({
      where: { subjectId: subjectId }
    });

    // Delete the subject
    await prisma.subject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({
      success: true,
      message: 'Subject deleted successfully'
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}