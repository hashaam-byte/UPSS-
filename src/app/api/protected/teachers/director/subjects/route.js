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

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true, school: true }
    });

    if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const className = searchParams.get('class'); // SS1, SS2, or SS3

    // Get all subjects for the specified class or all senior classes
    const subjects = await prisma.subject.findMany({
      where: {
        schoolId: user.schoolId,
        isActive: true,
        ...(className && { classes: { has: className } })
      },
      include: {
        teachers: {
          include: {
            teacher: {
              include: {
                user: {
                  select: {
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
      data: {
        subjects,
        categories: Object.keys(SENIOR_SUBJECTS),
        availableSubjects: SENIOR_SUBJECTS
      }
    });

  } catch (error) {
    console.error('Director subjects error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { name, code, category, classes, teacherIds } = await request.json();

    // Validate input
    if (!name || !code || !category || !classes || !Array.isArray(classes)) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { teacherProfile: true }
    });

    if (!user || user.role !== 'teacher' || user.teacherProfile?.department !== 'director') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        category,
        classes,
        schoolId: user.schoolId
      }
    });

    // Assign teachers if provided
    if (teacherIds && Array.isArray(teacherIds)) {
      await Promise.all(teacherIds.map(teacherId =>
        prisma.teacherSubject.create({
          data: {
            teacherId,
            subjectId: subject.id,
            classes
          }
        })
      ));
    }

    return NextResponse.json({
      success: true,
      data: subject
    });

  } catch (error) {
    console.error('Create subject error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
