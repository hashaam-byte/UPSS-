// src/app/api/protected/admin/users/import/route.js
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const user = await requireAuth(['admin']);
    
    const formData = await request.formData();
    const file = formData.get('file');
    const role = formData.get('role');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file content
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      return NextResponse.json({ error: 'CSV file is empty or invalid' }, { status: 400 });
    }

    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Validate required headers based on role
    const requiredHeaders = ['firstName', 'lastName', 'email', 'username', 'password'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    
    if (missingHeaders.length > 0) {
      return NextResponse.json({
        error: `Missing required headers: ${missingHeaders.join(', ')}`
      }, { status: 400 });
    }

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each data row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const userData = {};
        
        headers.forEach((header, index) => {
          userData[header] = values[index] || null;
        });

        // Validate required fields
        if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Missing required fields`);
          continue;
        }

        // Check if user exists
        const existingUser = await prisma.user.findFirst({
          where: {
            email: userData.email,
            schoolId: user.schoolId
          }
        });

        if (existingUser) {
          results.failed++;
          results.errors.push(`Row ${i + 1}: Email ${userData.email} already exists`);
          continue;
        }

        // Hash password
        const passwordHash = await bcrypt.hash(userData.password, 10);

        // Create user in transaction
        await prisma.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              firstName: userData.firstName,
              lastName: userData.lastName,
              email: userData.email,
              username: userData.username || userData.email.split('@')[0],
              passwordHash,
              role: role,
              phone: userData.phone || null,
              dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
              address: userData.address || null,
              gender: userData.gender || null,
              schoolId: user.schoolId,
              isActive: true,
              isEmailVerified: false
            }
          });

          // Create role-specific profile
          if (role === 'student') {
            await tx.studentProfile.create({
              data: {
                userId: newUser.id,
                className: userData.className || null,
                section: userData.section || null,
                parentName: userData.parentName || null,
                parentPhone: userData.parentPhone || null,
                parentEmail: userData.parentEmail || null
              }
            });
          } else if (role === 'teacher') {
            const teacherProfile = await tx.teacherProfile.create({
              data: {
                userId: newUser.id,
                department: userData.teacherType || 'subject_teacher',
                qualification: userData.qualification || null,
                experienceYears: userData.experienceYears ? parseInt(userData.experienceYears) : 0
              }
            });

            // Handle coordinator classes
            if (userData.teacherType === 'coordinator' && userData.coordinatorClasses) {
              const classes = userData.coordinatorClasses.split(';').map(c => c.trim()).filter(Boolean);
              
              for (const className of classes) {
                let subject = await tx.subject.findFirst({
                  where: {
                    schoolId: user.schoolId,
                    name: `${className} Coordination`,
                    category: 'CORE'
                  }
                });

                if (!subject) {
                  subject = await tx.subject.create({
                    data: {
                      name: `${className} Coordination`,
                      code: `COORD_${className}`,
                      category: 'CORE',
                      classes: [className],
                      schoolId: user.schoolId,
                      isActive: true
                    }
                  });
                }

                await tx.teacherSubject.create({
                  data: {
                    teacherId: teacherProfile.id,
                    subjectId: subject.id,
                    classes: [className]
                  }
                });
              }
            }

            // Handle class teacher arms
            if (userData.teacherType === 'class_teacher' && userData.classTeacherArms) {
              const arms = userData.classTeacherArms.split(';').map(a => a.trim()).filter(Boolean);
              
              for (const arm of arms) {
                let subject = await tx.subject.findFirst({
                  where: {
                    schoolId: user.schoolId,
                    name: `${arm} Class Management`,
                    category: 'CORE'
                  }
                });

                if (!subject) {
                  subject = await tx.subject.create({
                    data: {
                      name: `${arm} Class Management`,
                      code: `CLASS_${arm.replace(/\s+/g, '_')}`,
                      category: 'CORE',
                      classes: [arm],
                      schoolId: user.schoolId,
                      isActive: true
                    }
                  });
                }

                await tx.teacherSubject.create({
                  data: {
                    teacherId: teacherProfile.id,
                    subjectId: subject.id,
                    classes: [arm]
                  }
                });
              }
            }
          } else if (role === 'admin') {
            await tx.adminProfile.create({
              data: {
                userId: newUser.id
              }
            });
          }
        });

        results.success++;
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      ...results
    });

  } catch (error) {
    if (error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    if (error.message === 'Access denied') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    console.error('CSV import error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
