// scripts/seed.js - Database seeding script
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Create sample school
    const school = await prisma.school.upsert({
      where: { slug: 'demo-school' },
      update: {},
      create: {
        name: 'Demo High School',
        slug: 'demo-school',
        address: '123 Education Street, Learning City, LC 12345',
        phone: '+1-555-123-4567',
        email: 'info@demo-school.edu',
        website: 'https://demo-school.edu',
        subscriptionPlan: 'premium',
        subscriptionIsActive: true,
        allowStudentRegistration: true,
        requireEmailVerification: false,
        maxStudents: 5000,
        maxTeachers: 200
      }
    });

    console.log('✅ Created demo school:', school.name);

    // Hash password for demo users
    const passwordHash = await bcrypt.hash('Password123!', 12);

    // Create demo admin user
    const adminUser = await prisma.user.upsert({
      where: {
        email_schoolId: {
          email: 'admin@demo-school.edu',
          schoolId: school.id, // use dynamic school.id
        }
      },
      update: {},
      create: {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@demo-school.edu',
        username: 'admin',
        passwordHash: passwordHash,
        role: 'admin',
        schoolId: school.id,
        isActive: true,
        isEmailVerified: true
      }
    });

    // Create admin profile
    await prisma.adminProfile.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
        employeeId: 'EMP001',
        department: 'Administration'
      }
    });

    console.log('✅ Created demo admin user');

    // Create demo teacher user
    const teacherUser = await prisma.user.upsert({
      where: {
        email_schoolId: {
          email: 'teacher@demo-school.edu',
          schoolId: school.id,
        }
      },
      update: {},
      create: {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'teacher@demo-school.edu',
        username: 'jsmith',
        passwordHash: passwordHash,
        role: 'teacher',
        schoolId: school.id,
        isActive: true,
        isEmailVerified: true
      }
    });

    // Create teacher profile
    await prisma.teacherProfile.upsert({
      where: { userId: teacherUser.id },
      update: {},
      create: {
        userId: teacherUser.id,
        employeeId: 'TCH001',
        department: 'Mathematics',
        subjects: ['Algebra', 'Calculus', 'Statistics'],
        qualification: 'MSc Mathematics',
        experienceYears: 8,
        joiningDate: new Date('2020-08-15')
      }
    });

    console.log('✅ Created demo teacher user');

    // Create demo student user
    const studentUser = await prisma.user.upsert({
      where: {
        email_schoolId: {
          email: 'student@demo-school.edu',
          schoolId: school.id,
        }
      },
      update: {},
      create: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'student@demo-school.edu',
        username: 'johndoe',
        passwordHash: passwordHash,
        role: 'student',
        schoolId: school.id,
        isActive: true,
        isEmailVerified: true
      }
    });

    // Create student profile
    await prisma.studentProfile.upsert({
      where: { userId: studentUser.id },
      update: {},
      create: {
        userId: studentUser.id,
        studentId: 'STU001',
        className: '12',
        section: 'A',
        admissionDate: new Date('2021-09-01'),
        parentName: 'Robert Doe',
        parentPhone: '+1-555-987-6543',
        parentEmail: 'robert.doe@email.com'
      }
    });

    console.log('✅ Created demo student user');

    console.log('🎉 Database seeded successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('Admin: admin@demo-school.edu / Password123!');
    console.log('Teacher: teacher@demo-school.edu / Password123!');
    console.log('Student: student@demo-school.edu / Password123!');
    console.log('School Slug: demo-school');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
