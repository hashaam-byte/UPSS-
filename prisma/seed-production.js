// Production Seed Script
// Fixed to match combined schema field names

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const readline = require('readline');

const prisma = new PrismaClient();

// ============================================================================
// UTILITY: Prompt user for password input (hidden)
// ============================================================================
function promptPassword(label) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    process.stderr.write(`🔑 Enter password for ${label}: `);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    let password = '';

    const onData = (char) => {
      char = char.toString();

      if (char === '\n' || char === '\r' || char === '\u0004') {
        if (process.stdin.isTTY) process.stdin.setRawMode(false);
        process.stderr.write('\n');
        process.stdin.removeListener('data', onData);
        rl.close();
        resolve(password);
      } else if (char === '\u0003') {
        process.stderr.write('\n❌ Aborted.\n');
        process.exit(1);
      } else if (char === '\u007f' || char === '\b') {
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stderr.write('\b \b');
        }
      } else {
        password += char;
        process.stderr.write('*');
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      rl.question('', (answer) => {
        rl.close();
        resolve(answer);
      });
    }
  });
}

async function confirmPassword(label) {
  while (true) {
    const pass1 = await promptPassword(label);
    const pass2 = await promptPassword(`${label} (confirm)`);
    if (pass1 === pass2) {
      if (pass1.length < 8) {
        console.error('⚠️  Password must be at least 8 characters. Try again.');
        continue;
      }
      return pass1;
    }
    console.error('⚠️  Passwords do not match. Try again.');
  }
}

async function main() {
  console.log('🌱 Starting Production Database Seeding...\n');

  // ============================================================================
  // 0. CLEAR DATABASE (correct foreign key order)
  // ============================================================================
  console.log('🗑️  Clearing existing database...');

  await prisma.subjectStreamMapping.deleteMany({});
  await prisma.studentSelectedSubject.deleteMany({});
  await prisma.subjectSelectionHistory.deleteMany({});
  await prisma.studentSubjectSelection.deleteMany({});
  await prisma.subjectPrerequisite.deleteMany({});
  await prisma.subjectStream.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.academicTerm.deleteMany({});
  await prisma.adminProfile.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.studentProfile.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.userSettings.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.school.deleteMany({});

  console.log('✅ Database cleared.\n');

  // ============================================================================
  // COLLECT ALL PASSWORDS UPFRONT
  // ============================================================================
  console.log('📋 Please set passwords for all accounts before seeding begins:\n');

  const headAdminPassword   = await confirmPassword('Head Admin (hashcody63@gmail.com)');
  const schoolAdminPassword = await confirmPassword('School Admin (admin@test.edu)');
  const directorPassword    = await confirmPassword('Directors (JS & SS — shared password)');

  console.log('\n✅ All passwords collected. Starting seed...\n');

  // ============================================================================
  // 1. CREATE HEAD ADMIN
  // ============================================================================
  console.log('1️⃣  Creating Head Admin...');

  const hashedHeadAdminPassword = await bcrypt.hash(headAdminPassword, 10);

  // email is NOT a standalone unique field anymore (it's compound with schoolId)
  // so we use findFirst + create/update pattern instead of upsert
  const existingHeadAdmin = await prisma.user.findFirst({
    where: { email: 'hashcody63@gmail.com' },
  });

  const headAdmin = existingHeadAdmin
    ? await prisma.user.update({
        where: { id: existingHeadAdmin.id },
        data: {
          passwordHash: hashedHeadAdminPassword,  // ✅ passwordHash not password
          role: 'HEADADMIN',                       // ✅ uppercase to match enum
          isEmailVerified: true,
          isActive: true,
        },
      })
    : await prisma.user.create({
        data: {
          firstName: 'Head',                       // ✅ required field
          lastName: 'ADMIN',                       // ✅ required field
          email: 'hashcody63@gmail.com',
          passwordHash: hashedHeadAdminPassword,   // ✅ passwordHash not password
          role: 'HEADADMIN',                       // ✅ uppercase to match enum
          isEmailVerified: true,
          isActive: true,
          // schoolId is null for head admin — that's correct
        },
      });

  console.log('✅ Head Admin created:', headAdmin.email);

  // ============================================================================
  // 2. CREATE FIRST SCHOOL
  // ============================================================================
  console.log('\n2️⃣  Creating First School...');

  const firstSchool = await prisma.school.upsert({
    where: { slug: 'demo' },                       // ✅ slug must match what's in create
    update: {},
    create: {
      name: 'Demo High School',
      slug: 'demo',
      email: 'info@test.edu',
      phone: '+234-123-456-7891',
      address: 'Your School Address',
      subscriptionPlan: 'premium',
      subscriptionExpiresAt: new Date('2027-12-31'), // ✅ subscriptionExpiresAt not subscriptionExpiry
      isActive: true,
      maxStudents: 1000,
      maxTeachers: 100,
    },
  });

  console.log('✅ School created:', firstSchool.name);

  // ============================================================================
  // 3. CREATE CURRENT ACADEMIC TERM
  // ============================================================================
  console.log('\n3️⃣  Creating Academic Term...');

  const currentYear = new Date().getFullYear();
  const nextYear = currentYear + 1;
  const termName = `First Term ${currentYear}/${nextYear}`;

  const academicTerm = await prisma.academicTerm.upsert({
    where: {
      schoolId_name: {                             // ✅ matches @@unique([schoolId, name])
        schoolId: firstSchool.id,
        name: termName,
      },
    },
    update: {},
    create: {
      schoolId: firstSchool.id,
      name: termName,
      shortName: '1st Term',                       // ✅ required field in schema
      academicYear: `${currentYear}/${nextYear}`,  // ✅ required field in schema
      startDate: new Date(`${currentYear}-09-15`),
      endDate: new Date(`${currentYear}-12-20`),
      isCurrent: true,
      isActive: true,
    },
  });

  console.log('✅ Academic Term created:', academicTerm.name);

  // ============================================================================
  // 4. CREATE SUBJECT STREAMS
  // ============================================================================
  console.log('\n4️⃣  Creating Subject Streams...');

  const streams = [
    {
      name: 'SCIENCE',
      displayName: 'Science Stream',
      description: 'Natural sciences, engineering, medicine, and technology',
      classLevel: 'SS',
      minimumElectives: 2,
      maximumElectives: 3,
    },
    {
      name: 'ARTS',
      displayName: 'Arts Stream',
      description: 'Humanities, languages, creative fields, and social sciences',
      classLevel: 'SS',
      minimumElectives: 2,
      maximumElectives: 4,
    },
    {
      name: 'COMMERCIAL',
      displayName: 'Commercial Stream',
      description: 'Business, economics, commerce, and entrepreneurship',
      classLevel: 'SS',
      minimumElectives: 2,
      maximumElectives: 3,
    },
  ];

  const createdStreams = {};

  for (const streamData of streams) {
    const stream = await prisma.subjectStream.upsert({
      where: {
        schoolId_name_classLevel: {
          schoolId: firstSchool.id,
          name: streamData.name,
          classLevel: streamData.classLevel,
        },
      },
      update: {},
      create: {
        schoolId: firstSchool.id,
        ...streamData,
      },
    });

    createdStreams[streamData.name] = stream;
    console.log(`✅ Stream: ${stream.displayName}`);
  }

  // ============================================================================
  // 5. CREATE CORE SUBJECTS
  // ============================================================================
  console.log('\n5️⃣  Creating Core Subjects...');

  const coreSubjects = [
    {
      name: 'English Language',
      code: 'ENG-JS',
      description: 'English Language for Junior Secondary',
      category: 'CORE',                            // ✅ category not subjectType
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Mathematics',
      code: 'MTH-JS',
      description: 'Mathematics for Junior Secondary',
      category: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Basic Science',
      code: 'BSC-JS',
      description: 'Basic Science for Junior Secondary',
      category: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Basic Technology',
      code: 'BTC-JS',
      description: 'Basic Technology for Junior Secondary',
      category: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Social Studies',
      code: 'SST-JS',
      description: 'Social Studies for Junior Secondary',
      category: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Civic Education',
      code: 'CVC-JS',
      description: 'Civic Education for Junior Secondary',
      category: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'English Language',
      code: 'ENG-SS',
      description: 'English Language for Senior Secondary',
      category: 'CORE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
    },
    {
      name: 'Mathematics',
      code: 'MTH-SS',
      description: 'Mathematics for Senior Secondary',
      category: 'CORE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
    },
    {
      name: 'Civic Education',
      code: 'CVC-SS',
      description: 'Civic Education for Senior Secondary',
      category: 'CORE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
    },
  ];

  for (const subjectData of coreSubjects) {
    const subject = await prisma.subject.upsert({
      where: {
        code_schoolId: {
          schoolId: firstSchool.id,
          code: subjectData.code,
        },
      },
      update: {},
      create: {
        schoolId: firstSchool.id,
        ...subjectData,
      },
    });
    console.log(`✅ Core: ${subject.name} (${subject.code})`);
  }

  // ============================================================================
  // 6. CREATE SCIENCE STREAM SUBJECTS
  // ============================================================================
  console.log('\n6️⃣  Creating Science Stream Subjects...');

  const scienceSubjects = [
    {
      name: 'Biology',
      code: 'BIO-SS',
      description: 'Biology for Science Stream',
      category: 'SCIENCE',                         // ✅ category not subjectType
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true,
    },
    {
      name: 'Chemistry',
      code: 'CHM-SS',
      description: 'Chemistry for Science Stream',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true,
    },
    {
      name: 'Physics',
      code: 'PHY-SS',
      description: 'Physics for Science Stream',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true,
    },
    {
      name: 'Further Mathematics',
      code: 'FMATH-SS',
      description: 'Advanced Mathematics',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Agricultural Science',
      code: 'AGR-SS',
      description: 'Agricultural Science',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Computer Science',
      code: 'CMP-SS-SCI',
      description: 'Computer Science for Science Stream',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Technical Drawing',
      code: 'TDR-SS',
      description: 'Technical Drawing',
      category: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
  ];

  for (const subjectData of scienceSubjects) {
    const { _isCore, ...subjectFields } = subjectData;

    const subject = await prisma.subject.create({
      data: { schoolId: firstSchool.id, ...subjectFields },
    });

    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['SCIENCE'].id,
        subjectId: subject.id,
        isCore: _isCore || false,
        isElective: subjectData.isElectiveOption || false,
        electiveGroup: subjectData.electiveGroup || null,
      },
    });

    console.log(`✅ Science: ${subject.name}`);
  }

  // ============================================================================
  // 7. CREATE ARTS STREAM SUBJECTS
  // ============================================================================
  console.log('\n7️⃣  Creating Arts Stream Subjects...');

  const artsSubjects = [
    {
      name: 'Literature in English',
      code: 'LIT-SS',
      description: 'Literature in English',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      _isCore: true,
    },
    {
      name: 'Government',
      code: 'GOV-SS',
      description: 'Government',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      _isCore: true,
    },
    {
      name: 'Christian Religious Studies',
      code: 'CRS-SS',
      description: 'Christian Religious Studies',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_A',
    },
    {
      name: 'Islamic Studies',
      code: 'IRS-SS',
      description: 'Islamic Studies',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_A',
    },
    {
      name: 'History',
      code: 'HIS-SS',
      description: 'History',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Fine Arts',
      code: 'FNA-SS',
      description: 'Fine Arts',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Music',
      code: 'MUS-SS',
      description: 'Music',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Geography',
      code: 'GEO-SS',
      description: 'Geography',
      category: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS', 'COMMERCIAL'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
  ];

  for (const subjectData of artsSubjects) {
    const { _isCore, ...subjectFields } = subjectData;

    const subject = await prisma.subject.create({
      data: { schoolId: firstSchool.id, ...subjectFields },
    });

    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['ARTS'].id,
        subjectId: subject.id,
        isCore: _isCore || false,
        isElective: subjectData.isElectiveOption || false,
        electiveGroup: subjectData.electiveGroup || null,
      },
    });

    console.log(`✅ Arts: ${subject.name}`);
  }

  // ============================================================================
  // 8. CREATE COMMERCIAL STREAM SUBJECTS
  // ============================================================================
  console.log('\n8️⃣  Creating Commercial Stream Subjects...');

  const commercialSubjects = [
    {
      name: 'Economics',
      code: 'ECO-SS',
      description: 'Economics',
      category: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true,
    },
    {
      name: 'Commerce',
      code: 'COM-SS',
      description: 'Commerce',
      category: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true,
    },
    {
      name: 'Accounting',
      code: 'ACC-SS',
      description: 'Financial Accounting',
      category: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true,
    },
    {
      name: 'Business Studies',
      code: 'BUS-SS',
      description: 'Business Studies',
      category: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      isElectiveOption: true,
      electiveGroup: 'COMMERCIAL_ELECTIVE',
    },
  ];

  for (const subjectData of commercialSubjects) {
    const { _isCore, ...subjectFields } = subjectData;

    const subject = await prisma.subject.create({
      data: { schoolId: firstSchool.id, ...subjectFields },
    });

    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['COMMERCIAL'].id,
        subjectId: subject.id,
        isCore: _isCore || false,
        isElective: subjectData.isElectiveOption || false,
        electiveGroup: subjectData.electiveGroup || null,
      },
    });

    console.log(`✅ Commercial: ${subject.name}`);
  }

  // ============================================================================
  // 9. CREATE SCHOOL ADMIN
  // ============================================================================
  console.log('\n9️⃣  Creating School Admin...');

  const hashedAdminPassword = await bcrypt.hash(schoolAdminPassword, 10);

  const adminUser = await prisma.user.create({
    data: {
      firstName: 'School',                         // ✅ required
      lastName: 'Administrator',                   // ✅ required
      email: 'admin@test.edu',
      passwordHash: hashedAdminPassword,           // ✅ passwordHash not password
      role: 'ADMIN',                               // ✅ uppercase enum
      schoolId: firstSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  await prisma.adminProfile.create({
    data: {
      user: { connect: { id: adminUser.id } },
      firstName: 'School',
      lastName: 'Administrator',
      phone: '+234-000-899-0978',
    },
  });

  console.log('✅ Admin created: admin@test.edu');

  // ============================================================================
  // 10. CREATE DIRECTORS
  // ============================================================================
  console.log('\n🔟 Creating Directors...');

  const hashedDirectorPassword = await bcrypt.hash(directorPassword, 10);

  // JS Director
  const jsDirectorUser = await prisma.user.create({
    data: {
      firstName: 'JS',                             // ✅ required
      lastName: 'Director',                        // ✅ required
      email: 'js.director@test.edu',
      passwordHash: hashedDirectorPassword,        // ✅ passwordHash not password
      role: 'TEACHER',                             // ✅ uppercase enum
      schoolId: firstSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  await prisma.teacherProfile.create({
    data: {
      user: { connect: { id: jsDirectorUser.id } },
      firstName: 'JS',
      lastName: 'Director',
      employeeId: 'DIR-JS-001',
      department: 'Junior Secondary',
      teacherRole: 'DIRECTOR',
      levelSpecialization: 'JUNIOR',
      qualification: 'M.Ed',
      experienceYears: 15,
    },
  });

  console.log('✅ JS Director created');

  // SS Director
  const ssDirectorUser = await prisma.user.create({
    data: {
      firstName: 'SS',                             // ✅ required
      lastName: 'Director',                        // ✅ required
      email: 'ss.director@test.edu',
      passwordHash: hashedDirectorPassword,        // ✅ passwordHash not password
      role: 'TEACHER',                             // ✅ uppercase enum
      schoolId: firstSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  await prisma.teacherProfile.create({
    data: {
      user: { connect: { id: ssDirectorUser.id } },
      firstName: 'SS',
      lastName: 'Director',
      employeeId: 'DIR-SS-001',
      department: 'Senior Secondary',
      teacherRole: 'DIRECTOR',
      levelSpecialization: 'SENIOR',
      canTeachStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
      qualification: 'Ph.D',
      experienceYears: 20,
    },
  });

  console.log('✅ SS Director created');

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Production Seeding Complete!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 PRODUCTION SETUP COMPLETE');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Head Admin:   hashcody63@gmail.com       (password: as entered)`);
  console.log(`✅ School:       ${firstSchool.name}`);
  console.log(`✅ Admin:        admin@test.edu             (password: as entered)`);
  console.log(`✅ JS Director:  js.director@test.edu       (password: as entered)`);
  console.log(`✅ SS Director:  ss.director@test.edu       (password: as entered)`);
  console.log(`✅ Streams:      3 (Science, Arts, Commercial)`);
  console.log(`✅ Subjects:     All core and stream subjects created`);
  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Update school details with actual information');
  console.log('2. Update email addresses to real ones');
  console.log('3. Create classes for your academic year');
  console.log('4. Add teachers and students');
  console.log('═══════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });