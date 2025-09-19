import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

// Generate student ID
function generateStudentId(school, className, index) {
  const year = new Date().getFullYear().toString().slice(-2);
  const schoolCode = school.name.substring(0, 3).toUpperCase();
  const classCode = className.replace(/[^A-Z0-9]/g, '');
  return `${schoolCode}${year}${classCode}${String(index).padStart(3, '0')}`;
}

// Generate default password
function generateDefaultPassword() {
  return Math.random().toString(36).slice(-8);
}

export async function GET(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    
    // Get all students in the school for reference
    const students = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        isActive: true
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get available classes in the school
    const classes = [...new Set(
      students
        .map(s => s.studentProfile?.className)
        .filter(Boolean)
    )].sort();

    // Get import statistics
    const stats = {
      totalStudents: students.length,
      recentImports: await prisma.user.count({
        where: {
          schoolId: user.schoolId,
          role: 'student',
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      classCounts: classes.map(className => ({
        className,
        count: students.filter(s => s.studentProfile?.className === className).length
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        students: students.map(student => ({
          id: student.id,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          studentId: student.studentProfile?.studentId,
          className: student.studentProfile?.className,
          admissionDate: student.studentProfile?.admissionDate,
          parentName: student.studentProfile?.parentName,
          parentPhone: student.studentProfile?.parentPhone,
          createdAt: student.createdAt
        })),
        availableClasses: classes,
        importStats: stats,
        sampleCsvFormat: {
          headers: [
            'firstName',
            'lastName', 
            'email',
            'phone',
            'dateOfBirth',
            'gender',
            'address',
            'className',
            'section',
            'parentName',
            'parentPhone',
            'parentEmail'
          ],
          sampleRow: [
            'John',
            'Doe',
            'john.doe@example.com',
            '+2341234567890',
            '2005-06-15',
            'male',
            '123 Main St, Lagos',
            'SS1A',
            'A',
            'Jane Doe',
            '+2340987654321',
            'jane.doe@example.com'
          ]
        }
      }
    });

  } catch (error) {
    console.error('Students import GET error:', error);
    
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
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;
    
    const user = await verifyDirectorAccess(token);
    const { students, options = {} } = await request.json();

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ 
        error: 'Students array is required and cannot be empty' 
      }, { status: 400 });
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: [],
      warnings: []
    };

    // Get existing student count for ID generation
    const existingCount = await prisma.user.count({
      where: { schoolId: user.schoolId, role: 'student' }
    });

    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];
      
      try {
        // Validate required fields
        if (!studentData.firstName || !studentData.lastName || !studentData.email) {
          results.failed.push({
            row: i + 1,
            data: studentData,
            error: 'Missing required fields: firstName, lastName, email'
          });
          continue;
        }

        // Check for duplicate email within school
        const existingUser = await prisma.user.findFirst({
          where: {
            email: studentData.email,
            schoolId: user.schoolId
          }
        });

        if (existingUser) {
          results.duplicates.push({
            row: i + 1,
            data: studentData,
            existingUser: {
              id: existingUser.id,
              name: `${existingUser.firstName} ${existingUser.lastName}`,
              role: existingUser.role
            }
          });
          
          if (options.skipDuplicates) {
            continue;
          } else if (!options.updateDuplicates) {
            results.failed.push({
              row: i + 1,
              data: studentData,
              error: 'Email already exists in school'
            });
            continue;
          }
        }

        // Generate password
        const defaultPassword = options.defaultPassword || generateDefaultPassword();
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Generate student ID if not provided
        const studentId = studentData.studentId || 
          generateStudentId(user.school, studentData.className || 'GEN', existingCount + i + 1);

        // Create or update user
        let createdUser;
        if (existingUser && options.updateDuplicates) {
          createdUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              phone: studentData.phone,
              address: studentData.address,
              dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
              gender: studentData.gender?.toLowerCase() || null
            }
          });
        } else {
          createdUser = await prisma.user.create({
            data: {
              firstName: studentData.firstName,
              lastName: studentData.lastName,
              email: studentData.email,
              passwordHash,
              role: 'student',
              schoolId: user.schoolId,
              phone: studentData.phone,
              address: studentData.address,
              dateOfBirth: studentData.dateOfBirth ? new Date(studentData.dateOfBirth) : null,
              gender: studentData.gender?.toLowerCase() || null,
              isActive: true
            }
          });
        }

        // Create or update student profile
        await prisma.studentProfile.upsert({
          where: { userId: createdUser.id },
          update: {
            studentId,
            className: studentData.className,
            section: studentData.section,
            parentName: studentData.parentName,
            parentPhone: studentData.parentPhone,
            parentEmail: studentData.parentEmail,
            admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate) : new Date()
          },
          create: {
            userId: createdUser.id,
            studentId,
            className: studentData.className,
            section: studentData.section,
            parentName: studentData.parentName,
            parentPhone: studentData.parentPhone,
            parentEmail: studentData.parentEmail,
            admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate) : new Date()
          }
        });

        results.successful.push({
          row: i + 1,
          user: {
            id: createdUser.id,
            name: `${createdUser.firstName} ${createdUser.lastName}`,
            email: createdUser.email,
            studentId,
            defaultPassword: options.includePasswords ? defaultPassword : '[hidden]'
          }
        });

      } catch (error) {
        console.error(`Error processing student ${i + 1}:`, error);
        results.failed.push({
          row: i + 1,
          data: studentData,
          error: error.message
        });
      }
    }

    // Generate import summary
    const summary = {
      totalProcessed: students.length,
      successful: results.successful.length,
      failed: results.failed.length,
      duplicates: results.duplicates.length,
      warnings: results.warnings.length
    };

    return NextResponse.json({
      success: true,
      message: `Import completed. ${summary.successful} students imported successfully.`,
      data: {
        summary,
        results,
        ...(options.includePasswords && {
          passwordList: results.successful.map(s => ({
            name: s.user.name,
            email: s.user.email,
            password: s.user.defaultPassword
          }))
        })
      }
    });

  } catch (error) {
    console.error('Students import POST error:', error);
    
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}