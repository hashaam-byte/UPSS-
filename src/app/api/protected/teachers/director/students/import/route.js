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
  const classCode = className?.replace(/[^A-Z0-9]/g, '') || 'GEN';
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
    
    // Get only unassigned students from the SAME SCHOOL (those without proper class assignments)
    const students = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId, // CRITICAL: Only students from director's school
        role: 'student',
        isActive: true,
        OR: [
          {
            studentProfile: {
              className: null
            }
          },
          {
            studentProfile: {
              className: {
                in: ['', 'Not assigned']
              }
            }
          },
          {
            studentProfile: null // No profile created yet
          }
        ]
      },
      include: {
        studentProfile: true
      },
      orderBy: [
        { createdAt: 'desc' },
        { firstName: 'asc' },
        { lastName: 'asc' }
      ]
    });

    // Get all classes in the school for reference
    const allStudentsWithClasses = await prisma.user.findMany({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        studentProfile: {
          className: {
            not: null,
            notIn: ['', 'Not assigned']
          }
        }
      },
      select: {
        studentProfile: {
          select: {
            className: true
          }
        }
      }
    });

    const availableClasses = [...new Set(
      allStudentsWithClasses
        .map(s => s.studentProfile?.className)
        .filter(Boolean)
    )].sort();

    // Get import statistics
    const totalStudents = await prisma.user.count({
      where: {
        schoolId: user.schoolId,
        role: 'student'
      }
    });

    const recentImports = await prisma.user.count({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      }
    });

    const assignedStudents = await prisma.user.count({
      where: {
        schoolId: user.schoolId,
        role: 'student',
        studentProfile: {
          className: {
            not: null,
            notIn: ['', 'Not assigned']
          }
        }
      }
    });

    const stats = {
      totalStudents,
      recentImports,
      pendingAssignment: students.length,
      assignedStudents,
      classCounts: availableClasses.map(className => ({
        className,
        count: allStudentsWithClasses.filter(s => s.studentProfile?.className === className).length
      }))
    };

    return NextResponse.json({
      success: true,
      data: {
        students: students.map(student => ({
          id: student.id,
          fullName: `${student.firstName} ${student.lastName}`,
          email: student.email,
          phone: student.phone,
          studentId: student.studentProfile?.studentId,
          className: student.studentProfile?.className || 'Not assigned',
          admissionDate: student.studentProfile?.admissionDate,
          parentName: student.studentProfile?.parentName,
          parentPhone: student.studentProfile?.parentPhone,
          parentEmail: student.studentProfile?.parentEmail,
          createdAt: student.createdAt,
          dateOfBirth: student.dateOfBirth,
          gender: student.gender,
          address: student.address
        })),
        availableClasses,
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
            '',
            '',
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
      return NextResponse.json(
        { error: "Students array is required and cannot be empty" },
        { status: 400 }
      );
    }

    const results = {
      successful: [],
      failed: [],
      duplicates: [],
      warnings: []
    };

    const existingCount = await prisma.user.count({
      where: { schoolId: user.schoolId, role: "student" }
    });

    for (let i = 0; i < students.length; i++) {
      const studentData = students[i];

      try {
        // Validate required fields
        if (!studentData.firstName && !studentData.fullName) {
          results.failed.push({
            row: i + 1,
            data: studentData,
            error: "Missing required field: firstName or fullName"
          });
          continue;
        }

        if (!studentData.email) {
          results.failed.push({
            row: i + 1,
            data: studentData,
            error: "Missing required field: email"
          });
          continue;
        }

        // Handle name parsing
        let firstName = studentData.firstName || '';
        let lastName = studentData.lastName || '';

        if (!firstName && studentData.fullName) {
          const parts = studentData.fullName.trim().split(' ');
          firstName = parts[0] || '';
          lastName = parts.slice(1).join(' ') || '';
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(studentData.email)) {
          results.failed.push({
            row: i + 1,
            data: studentData,
            error: "Invalid email format"
          });
          continue;
        }

        // Check for duplicate email within this school ONLY
        const existingUser = await prisma.user.findFirst({
          where: {
            email: studentData.email,
            schoolId: user.schoolId // CRITICAL: Only check within same school
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
              error: "Email already exists in school"
            });
            continue;
          }
        }

        // Generate password
        const defaultPassword = options.defaultPassword || generateDefaultPassword();
        const passwordHash = await bcrypt.hash(defaultPassword, 10);

        // Generate student ID if not provided
        let studentId = studentData.studentId;
        if (!studentId) {
          studentId = generateStudentId(
            user.school,
            studentData.className || 'GEN',
            existingCount + i + 1
          );
        }

        // Validate date of birth if provided
        let dateOfBirth = null;
        if (studentData.dateOfBirth) {
          const dob = new Date(studentData.dateOfBirth);
          if (isNaN(dob.getTime())) {
            results.warnings.push({
              row: i + 1,
              message: "Invalid date of birth format, skipping field"
            });
          } else {
            dateOfBirth = dob;
          }
        }

        // Validate gender if provided
        let gender = null;
        if (studentData.gender) {
          const validGenders = ['male', 'female', 'other'];
          if (validGenders.includes(studentData.gender.toLowerCase())) {
            gender = studentData.gender.toLowerCase();
          } else {
            results.warnings.push({
              row: i + 1,
              message: "Invalid gender value, skipping field"
            });
          }
        }

        // Create or update user
        let createdUser;
        if (existingUser && options.updateDuplicates) {
          createdUser = await prisma.user.update({
            where: { id: existingUser.id },
            data: {
              firstName,
              lastName,
              email: studentData.email,
              phone: studentData.phone || existingUser.phone,
              address: studentData.address || existingUser.address,
              dateOfBirth: dateOfBirth || existingUser.dateOfBirth,
              gender: gender || existingUser.gender,
              isActive: true,
              updatedAt: new Date()
            }
          });
        } else {
          createdUser = await prisma.user.create({
            data: {
              firstName,
              lastName,
              email: studentData.email,
              phone: studentData.phone,
              address: studentData.address,
              dateOfBirth,
              gender,
              passwordHash,
              role: "student",
              schoolId: user.schoolId,
              isActive: true
            }
          });
        }

        // Create/update student profile - Leave className empty for assignment later
        const profileData = {
          studentId,
          className: studentData.className || null, // Allow empty className for later assignment
          section: studentData.section,
          parentName: studentData.parentName,
          parentPhone: studentData.parentPhone,
          parentEmail: studentData.parentEmail,
          admissionDate: studentData.admissionDate ? new Date(studentData.admissionDate) : new Date()
        };

        await prisma.studentProfile.upsert({
          where: { userId: createdUser.id },
          update: profileData,
          create: {
            userId: createdUser.id,
            ...profileData
          }
        });

        results.successful.push({
          row: i + 1,
          user: {
            id: createdUser.id,
            name: `${firstName} ${lastName}`,
            email: createdUser.email,
            studentId,
            hasClassAssignment: Boolean(studentData.className),
            defaultPassword: options.includePasswords ? defaultPassword : "[hidden]"
          }
        });

      } catch (error) {
        console.error(`Error processing student ${i + 1}:`, error);
        results.failed.push({
          row: i + 1,
          data: studentData,
          error: error.message || "Unknown error occurred"
        });
      }
    }

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
          passwordList: results.successful.map((s) => ({
            name: s.user.name,
            email: s.user.email,
            password: s.user.defaultPassword
          }))
        })
      }
    });

  } catch (error) {
    console.error("Students import POST error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Access denied") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// New endpoint to assign class to a student
export async function PUT(request) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    const user = await verifyDirectorAccess(token);
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const { className, section } = await request.json();

    if (!studentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
    }

    if (!className) {
      return NextResponse.json({ error: 'Class name is required' }, { status: 400 });
    }

    // Verify student exists and belongs to school
    const student = await prisma.user.findFirst({
      where: {
        id: studentId,
        schoolId: user.schoolId,
        role: 'student'
      },
      include: {
        studentProfile: true
      }
    });

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Update student profile with class assignment
    const updatedProfile = await prisma.studentProfile.upsert({
      where: { userId: studentId },
      update: {
        className,
        section: section || null
      },
      create: {
        userId: studentId,
        className,
        section: section || null,
        admissionDate: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Student class assigned successfully',
      data: {
        studentId,
        className,
        section
      }
    });

  } catch (error) {
    console.error("Student class assignment error:", error);

    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Access denied") {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
