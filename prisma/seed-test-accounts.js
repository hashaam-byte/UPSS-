// prisma/seed-test-accounts.js
//
// Focused seed script for testing login + role routing. Unlike seed.js
// (which fills teacherProfile.department with subject areas like
// "Mathematics"), this creates one teacher per actual department the
// login system checks: director, coordinator, class_teacher, subject_teacher
// — so you can confirm each one lands on its correct dashboard.
//
// Run with:  node prisma/seed-test-accounts.js
// (safe to re-run — uses upsert/skip-if-exists throughout)

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Plain `node` doesn't auto-load .env files the way `next dev` or the
// `prisma` CLI do — load one manually so DATABASE_URL etc. are available.
// Node 20.6+ ships process.loadEnvFile() for this; try common filenames
// in priority order and just move on if none exist (a real error will
// surface below anyway if DATABASE_URL truly isn't set).
for (const envFile of ['.env.local', '.env']) {
  try {
    process.loadEnvFile(envFile);
    console.log(`Loaded environment from ${envFile}`);
    break;
  } catch (e) {
    // file not found — try the next one
  }
}

const prisma = new PrismaClient();

const TEST_PASSWORD = 'Test@1234';
const HEADADMIN_EMAIL = 'hashcody63@gmail.com';
const HEADADMIN_PASSWORD = 'PASSWORD';
const PARENT_TEST_PHONE = '08077291745';

async function main() {
  console.log('Seeding test accounts...\n');
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);
  const headadminPasswordHash = await bcrypt.hash(HEADADMIN_PASSWORD, 12);

  // ---- School ----
  const school = await prisma.school.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo Secondary School',
      slug: 'demo-school',
      address: '1 Test Street, Benin City, Edo State',
      phone: '08000000000',
      email: 'info@demo-school.test',
      isActive: true,
    },
  });
  console.log(`School: ${school.name} (slug: ${school.slug})`);

  // ---- Head Admin (platform-level, not tied to the school) ----
  const existingHeadadmin = await prisma.user.findFirst({
    where: { email: HEADADMIN_EMAIL, schoolId: null },
  });
  const headadmin = existingHeadadmin
    ? await prisma.user.update({
        where: { id: existingHeadadmin.id },
        data: { passwordHash: headadminPasswordHash },
      })
    : await prisma.user.create({
        data: {
          firstName: 'Head',
          lastName: 'Admin',
          email: HEADADMIN_EMAIL,
          username: 'headadmin',
          passwordHash: headadminPasswordHash,
          role: 'HEADADMIN',
          isActive: true,
          isEmailVerified: true,
        },
      });

  // ---- School Admin ----
  const admin = await prisma.user.upsert({
    where: { email_schoolId: { email: 'admin@demo-school.test', schoolId: school.id } },
    update: {},
    create: {
      firstName: 'School',
      lastName: 'Admin',
      email: 'admin@demo-school.test',
      username: 'schooladmin',
      passwordHash,
      role: 'ADMIN',
      schoolId: school.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  // ---- Classes ----
  const jss1a = await prisma.class.upsert({
    where: { code: 'JSS1A-DEMO' },
    update: {},
    create: {
      schoolId: school.id,
      name: 'JSS1A',
      code: 'JSS1A-DEMO',
      classLevel: 'JSS1',
      section: 'A',
      academicYear: '2025/2026',
      isActive: true,
    },
  });

  // ---- Subject ----
  const mathematics = await prisma.subject.upsert({
    where: { code_schoolId: { code: 'MTH', schoolId: school.id } },
    update: {},
    create: {
      schoolId: school.id,
      name: 'Mathematics',
      code: 'MTH',
      category: 'CORE',
      classLevel: ['JSS1', 'JSS2', 'JSS3'],
      isActive: true,
    },
  });

  // ---- Teachers: one per department the login system actually checks ----
  const teacherDefs = [
    { key: 'director', email: 'director@demo-school.test', username: 'director', first: 'Dan', last: 'Director', department: 'director' },
    { key: 'coordinator', email: 'coordinator@demo-school.test', username: 'coordinator', first: 'Cara', last: 'Coordinator', department: 'coordinator' },
    { key: 'class_teacher', email: 'classteacher@demo-school.test', username: 'classteacher', first: 'Cindy', last: 'ClassTeacher', department: 'class_teacher' },
    { key: 'subject_teacher', email: 'subjectteacher@demo-school.test', username: 'subjectteacher', first: 'Sam', last: 'SubjectTeacher', department: 'subject_teacher' },
  ];

  const teachers = {};
  for (const t of teacherDefs) {
    const user = await prisma.user.upsert({
      where: { email_schoolId: { email: t.email, schoolId: school.id } },
      update: {},
      create: {
        firstName: t.first,
        lastName: t.last,
        email: t.email,
        username: t.username,
        passwordHash,
        role: 'TEACHER',
        schoolId: school.id,
        isActive: true,
        isEmailVerified: true,
      },
    });

    const profile = await prisma.teacherProfile.upsert({
      where: { userId: user.id },
      update: { department: t.department },
      create: {
        userId: user.id,
        department: t.department,
        experienceYears: 3,
      },
    });

    teachers[t.key] = { user, profile };
  }

  // Link the class_teacher to JSS1A as its coordinator/owner (matches how the class
  // dashboard resolves "my class")
  await prisma.teacherClassCoordinator.upsert({
    where: {
      teacherId_classId: {
        teacherId: teachers.class_teacher.profile.id,
        classId: jss1a.id,
      },
    },
    update: {},
    create: {
      teacherId: teachers.class_teacher.profile.id,
      classId: jss1a.id,
    },
  });

  // Link the subject_teacher to Mathematics for JSS1A
  await prisma.teacherSubject.upsert({
    where: {
      teacherId_subjectId: {
        teacherId: teachers.subject_teacher.profile.id,
        subjectId: mathematics.id,
      },
    },
    update: { classes: ['JSS1A'] },
    create: {
      teacherId: teachers.subject_teacher.profile.id,
      subjectId: mathematics.id,
      classes: ['JSS1A'],
    },
  });

  // ---- Student (with a parentPhone set, for testing the parent portal later) ----
  const studentUser = await prisma.user.upsert({
    where: { email_schoolId: { email: 'student@demo-school.test', schoolId: school.id } },
    update: {},
    create: {
      firstName: 'Sarah',
      lastName: 'Student',
      email: 'student@demo-school.test',
      username: 'sarahstudent',
      passwordHash,
      role: 'STUDENT',
      schoolId: school.id,
      isActive: true,
      isEmailVerified: true,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: studentUser.id },
    update: {
      className: 'JSS1A',
      classId: jss1a.id,
      parentPhone: PARENT_TEST_PHONE,
      parentName: 'Peter Parent',
    },
    create: {
      userId: studentUser.id,
      studentId: 'DEMO-STU-001',
      className: 'JSS1A',
      classId: jss1a.id,
      parentPhone: PARENT_TEST_PHONE,
      parentName: 'Peter Parent',
      admissionDate: new Date(),
    },
  });

  console.log('\n--- All test accounts created ---');
  console.log(`Shared password for accounts below (except Head Admin): ${TEST_PASSWORD}\n`);
  console.log('Head Admin login (no school needed):');
  console.log(`  email: ${HEADADMIN_EMAIL}`);
  console.log(`  password: ${HEADADMIN_PASSWORD}\n`);
  console.log(`School slug to select on login: ${school.slug}\n`);
  console.log('School Admin:');
  console.log('  identifier: admin@demo-school.test (or "schooladmin")\n');
  console.log('Director:');
  console.log('  identifier: director@demo-school.test (or "director")\n');
  console.log('Coordinator:');
  console.log('  identifier: coordinator@demo-school.test (or "coordinator")\n');
  console.log('Class Teacher (assigned to JSS1A):');
  console.log('  identifier: classteacher@demo-school.test (or "classteacher")\n');
  console.log('Subject Teacher (teaches Mathematics to JSS1A):');
  console.log('  identifier: subjectteacher@demo-school.test (or "subjectteacher")\n');
  console.log(`Student (in JSS1A, parentPhone ${PARENT_TEST_PHONE} — use this number to test`);
  console.log('the parent portal signup flow at /auth/parent once that migration is applied):');
  console.log('  identifier: student@demo-school.test (or "sarahstudent")\n');
  console.log('Log in at: /protected  (role selector + school dropdown)');
  console.log('For Teacher/Admin/Student, select the role, choose school "Demo Secondary School", then use the identifier above.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });