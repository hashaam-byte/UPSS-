// /app/api/protected/headadmin/schools/create/route.js
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
  try {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'headadmin') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      schoolName,
      slug,
      address,
      phone,
      email,
      website,
      maxStudents,
      maxTeachers,
      allowStudentRegistration,
      requireEmailVerification,
      adminFirstName,
      adminLastName,
      adminEmail,
      adminPhone,
      adminPassword
    } = body;

    // Validate required fields
    if (!schoolName || !slug || !address || !phone || !email || 
        !adminFirstName || !adminLastName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'All required fields must be provided' },
        { status: 400 }
      );
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid school email format' },
        { status: 400 }
      );
    }
    if (!emailRegex.test(adminEmail)) {
      return NextResponse.json(
        { error: 'Invalid admin email format' },
        { status: 400 }
      );
    }

    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (adminPassword.length < 8) {
      return NextResponse.json(
        { error: 'Admin password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Check if school slug already exists
    const existingSchool = await prisma.school.findUnique({
      where: { slug }
    });
    
    if (existingSchool) {
      return NextResponse.json(
        { error: 'School slug already exists' },
        { status: 409 }
      );
    }

    // Check if admin email already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email: adminEmail.toLowerCase() }
    });
    
    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin email already exists' },
        { status: 409 }
      );
    }

    // Start a transaction to create school and admin
    const result = await prisma.$transaction(async (tx) => {
      // Create the school
      const newSchool = await tx.school.create({
        data: {
          name: schoolName.trim(),
          slug: slug.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.toLowerCase().trim(),
          website: website?.trim() || null,
          maxStudents: parseInt(maxStudents) || 1000,
          maxTeachers: parseInt(maxTeachers) || 100,
          allowStudentRegistration: Boolean(allowStudentRegistration),
          requireEmailVerification: Boolean(requireEmailVerification),
          createdBy: user.id
        }
      });

      // Hash admin password
      const passwordHash = await bcrypt.hash(adminPassword, 12);

      // Create admin user
      const newAdmin = await tx.user.create({
        data: {
          firstName: adminFirstName.trim(),
          lastName: adminLastName.trim(),
          email: adminEmail.toLowerCase().trim(),
          phone: adminPhone?.trim() || null,
          passwordHash,
          role: 'admin',
          schoolId: newSchool.id,
          isEmailVerified: true, // Auto-verify admin emails
          isActive: true
        }
      });

      // Create admin profile
      await tx.adminProfile.create({
        data: {
          userId: newAdmin.id,
          department: 'Administration'
        }
      });

      // Create default admin permissions
      const defaultPermissions = [
        {
          module: 'users',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'students',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'teachers',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'classes',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'subjects',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'timetables',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'assignments',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'results',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'reports',
          actions: ['read']
        },
        {
          module: 'settings',
          actions: ['read', 'update']
        }
      ];

      const adminProfile = await tx.adminProfile.findUnique({
        where: { userId: newAdmin.id }
      });

      await Promise.all(
        defaultPermissions.map(permission =>
          tx.adminPermission.create({
            data: {
              adminProfileId: adminProfile.id,
              module: permission.module,
              actions: permission.actions
            }
          })
        )
      );

      // Create initial invoice for the school (trial period)
      const currentDate = new Date();
      const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
      
      await tx.invoice.create({
        data: {
          schoolId: newSchool.id,
          invoiceNumber: `INV-${newSchool.slug.toUpperCase()}-${Date.now()}`,
          amount: 0, // Trial period
          description: 'Trial Period - First Month Free',
          billingPeriod: `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`,
          studentCount: 0,
          teacherCount: 1, // Admin counts as a user
          adminCount: 1,
          status: 'paid', // Mark trial as paid
          dueDate: nextMonth,
          paidAt: currentDate,
          createdBy: user.id
        }
      });

      // Create welcome notification for admin
      await tx.notification.create({
        data: {
          userId: newAdmin.id,
          title: 'Welcome to U PLUS!',
          content: `Your school "${schoolName}" has been successfully created. You can now start managing your school operations.`,
          type: 'success',
          priority: 'high'
        }
      });

      return { school: newSchool, admin: newAdmin };
    });

    // Log the creation action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'school_created',
        resource: 'school',
        resourceId: result.school.id,
        description: `Created school "${schoolName}" with admin ${adminEmail}`,
        metadata: {
          schoolSlug: slug,
          adminEmail: adminEmail
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'School created successfully',
      school: {
        id: result.school.id,
        name: result.school.name,
        slug: result.school.slug,
        email: result.school.email
      },
      admin: {
        id: result.admin.id,
        firstName: result.admin.firstName,
        lastName: result.admin.lastName,
        email: result.admin.email
      }
    });

  } catch (error) {
    console.error('Create school error:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'School slug or admin email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}