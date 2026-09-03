// U-Plus - Comprehensive Seed Script
// This script populates the database with initial data for testing

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Phase 1 Database Seeding...\n');

  // ============================================================================
  // 1. CREATE HEAD ADMIN
  // ============================================================================
  console.log('1️⃣ Creating Head Admin...');
  
  const hashedHeadAdminPassword = await bcrypt.hash('HeadAdmin@123', 10);
  
  const headAdmin = await prisma.user.upsert({
    where: { email: 'headadmin@uplus.com' },
    update: {},
    create: {
      firstName: 'Head',
      lastName: 'ADMIN',
      email: 'headadmin@uplus.com',
      passwordHash: hashedHeadAdminPassword,
      role: 'HEADADMIN',
      isEmailVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Head Admin created:', headAdmin.email);

  // ============================================================================
  // 2. CREATE DEMO SCHOOL
  // ============================================================================
  console.log('\n2️⃣ Creating Demo School...');
  
  const demoSchool = await prisma.school.upsert({
    where: { slug: 'demo-school' },
    update: {},
    create: {
      name: 'Demo High School',
      slug: 'demo-school',
      email: 'info@demoschool.edu',
      phone: '+234-800-123-4567',
      address: '123 Education Street, Lagos, Nigeria',
      subscriptionPlan: 'premium',
      subscriptionExpiry: new Date('2026-12-31'),
      isActive: true,
      maxStudents: 500,
      maxTeachers: 50,
    },
  });

  console.log('✅ Demo School created:', demoSchool.name);

  // ============================================================================
  // 3. CREATE ACADEMIC TERM
  // ============================================================================
  console.log('\n3️⃣ Creating Academic Term...');
  
  const academicTerm = await prisma.academicTerm.upsert({
    where: { 
      schoolId_name: {
        schoolId: demoSchool.id,
        name: 'First Term 2025/2026'
      }
    },
    update: {},
    create: {
      schoolId: demoSchool.id,
      name: 'First Term 2025/2026',
      startDate: new Date('2025-09-15'),
      endDate: new Date('2025-12-20'),
      isCurrent: true,
    },
  });

  console.log('✅ Academic Term created:', academicTerm.name);

  // ============================================================================
  // 4. CREATE STREAMS FOR SENIOR SECONDARY
  // ============================================================================
  console.log('\n4️⃣ Creating Subject Streams...');
  
  const streams = [
    {
      name: 'SCIENCE',
      displayName: 'Science Stream',
      description: 'For students interested in natural sciences, engineering, and medicine',
      classLevel: 'SS',
      minimumElectives: 2,
      maximumElectives: 3,
    },
    {
      name: 'ARTS',
      displayName: 'Arts Stream',
      description: 'For students interested in humanities, languages, and creative fields',
      classLevel: 'SS',
      minimumElectives: 2,
      maximumElectives: 4,
    },
    {
      name: 'COMMERCIAL',
      displayName: 'Commercial Stream',
      description: 'For students interested in business, economics, and commerce',
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
          schoolId: demoSchool.id,
          name: streamData.name,
          classLevel: streamData.classLevel,
        },
      },
      update: {},
      create: {
        schoolId: demoSchool.id,
        ...streamData,
      },
    });
    
    createdStreams[streamData.name] = stream;
    console.log(`✅ Stream created: ${stream.displayName}`);
  }

  // ============================================================================
  // 5. CREATE CORE SUBJECTS (All Levels)
  // ============================================================================
  console.log('\n5️⃣ Creating Core Subjects...');
  
  const coreSubjects = [
    // JS Core Subjects
    {
      name: 'English Language',
      code: 'ENG-JS',
      description: 'English Language for Junior Secondary',
      subjectType: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Mathematics',
      code: 'MTH-JS',
      description: 'Mathematics for Junior Secondary',
      subjectType: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Basic Science',
      code: 'BSC-JS',
      description: 'Basic Science for Junior Secondary',
      subjectType: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Basic Technology',
      code: 'BTC-JS',
      description: 'Basic Technology for Junior Secondary',
      subjectType: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    {
      name: 'Social Studies',
      code: 'SST-JS',
      description: 'Social Studies for Junior Secondary',
      subjectType: 'CORE',
      classLevel: ['JS1', 'JS2', 'JS3'],
      eligibleStreams: [],
    },
    
    // SS Core Subjects (Common to All Streams)
    {
      name: 'English Language',
      code: 'ENG-SS',
      description: 'English Language for Senior Secondary',
      subjectType: 'CORE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
    },
    {
      name: 'Mathematics',
      code: 'MTH-SS',
      description: 'Mathematics for Senior Secondary',
      subjectType: 'CORE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
    },
  ];

  const createdCoreSubjects = [];
  
  for (const subjectData of coreSubjects) {
    const subject = await prisma.subject.upsert({
      where: {
        schoolId_code: {
          schoolId: demoSchool.id,
          code: subjectData.code,
        },
      },
      update: {},
      create: {
        schoolId: demoSchool.id,
        ...subjectData,
      },
    });
    
    createdCoreSubjects.push(subject);
    console.log(`✅ Core Subject: ${subject.name} (${subject.code})`);
  }

  // ============================================================================
  // 6. CREATE SCIENCE STREAM SUBJECTS
  // ============================================================================
  console.log('\n6️⃣ Creating Science Stream Subjects...');
  
  const scienceSubjects = [
    // Science Core (Stream-specific) - Note: _isCore is a metadata flag, not a model property
    {
      name: 'Biology',
      code: 'BIO-SS',
      description: 'Biology for Science Stream',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true, // Metadata for stream mapping
    },
    {
      name: 'Chemistry',
      code: 'CHM-SS',
      description: 'Chemistry for Science Stream',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true, // Metadata for stream mapping
    },
    {
      name: 'Physics',
      code: 'PHY-SS',
      description: 'Physics for Science Stream',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      _isCore: true, // Metadata for stream mapping
    },
    
    // Science Electives
    {
      name: 'Further Mathematics',
      code: 'FMATH-SS',
      description: 'Advanced Mathematics',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Agricultural Science',
      code: 'AGR-SS',
      description: 'Agricultural Science',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Computer Science',
      code: 'CMP-SS-SCI',
      description: 'Computer Science for Science Stream',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
    {
      name: 'Technical Drawing',
      code: 'TDR-SS',
      description: 'Technical Drawing',
      subjectType: 'SCIENCE',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['SCIENCE'],
      isElectiveOption: true,
      electiveGroup: 'SCIENCE_ELECTIVE',
    },
  ];

  const createdScienceSubjects = [];
  
  for (const subjectData of scienceSubjects) {
    // Extract metadata flags
    const { _isCore, ...subjectFields } = subjectData;
    
    const subject = await prisma.subject.create({
      data: {
        schoolId: demoSchool.id,
        ...subjectFields,
      },
    });
    
    createdScienceSubjects.push(subject);
    
    // Map to Science Stream
    const isCore = _isCore || false;
    const isElective = subjectData.isElectiveOption || false;
    
    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['SCIENCE'].id,
        subjectId: subject.id,
        isCore: isCore,
        isElective: isElective,
        electiveGroup: subjectData.electiveGroup,
      },
    });
    
    console.log(`✅ Science Subject: ${subject.name} (${isCore ? 'Core' : 'Elective'})`);
  }

  // ============================================================================
  // 7. CREATE ARTS STREAM SUBJECTS
  // ============================================================================
  console.log('\n7️⃣ Creating Arts Stream Subjects...');
  
  const artsSubjects = [
    // Arts Core (Stream-specific)
    {
      name: 'Literature in English',
      code: 'LIT-SS',
      description: 'Literature in English',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      _isCore: true, // Metadata for stream mapping
    },
    {
      name: 'Government',
      code: 'GOV-SS',
      description: 'Government',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      _isCore: true, // Metadata for stream mapping
    },
    
    // Arts Electives
    {
      name: 'Christian Religious Studies',
      code: 'CRS-SS',
      description: 'Christian Religious Studies',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_A',
    },
    {
      name: 'Islamic Studies',
      code: 'IRS-SS',
      description: 'Islamic Studies',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_A',
    },
    {
      name: 'History',
      code: 'HIS-SS',
      description: 'History',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Fine Arts',
      code: 'FNA-SS',
      description: 'Fine Arts',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Music',
      code: 'MUS-SS',
      description: 'Music',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'French',
      code: 'FRE-SS',
      description: 'French Language',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
    {
      name: 'Geography',
      code: 'GEO-SS',
      description: 'Geography',
      subjectType: 'ARTS',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['ARTS', 'COMMERCIAL'],
      isElectiveOption: true,
      electiveGroup: 'ARTS_ELECTIVE_B',
    },
  ];

  const createdArtsSubjects = [];
  
  for (const subjectData of artsSubjects) {
    // Extract metadata flags
    const { _isCore, ...subjectFields } = subjectData;
    
    const subject = await prisma.subject.create({
      data: {
        schoolId: demoSchool.id,
        ...subjectFields,
      },
    });
    
    createdArtsSubjects.push(subject);
    
    const isCore = _isCore || false;
    const isElective = subjectData.isElectiveOption || false;
    
    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['ARTS'].id,
        subjectId: subject.id,
        isCore: isCore,
        isElective: isElective,
        electiveGroup: subjectData.electiveGroup,
      },
    });
    
    console.log(`✅ Arts Subject: ${subject.name} (${isCore ? 'Core' : 'Elective'})`);
  }

  // ============================================================================
  // 8. CREATE COMMERCIAL STREAM SUBJECTS
  // ============================================================================
  console.log('\n8️⃣ Creating Commercial Stream Subjects...');
  
  const commercialSubjects = [
    // Commercial Core (Stream-specific)
    {
      name: 'Economics',
      code: 'ECO-SS',
      description: 'Economics',
      subjectType: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true, // Metadata for stream mapping
    },
    {
      name: 'Commerce',
      code: 'COM-SS',
      description: 'Commerce',
      subjectType: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true, // Metadata for stream mapping
    },
    {
      name: 'Accounting',
      code: 'ACC-SS',
      description: 'Accounting',
      subjectType: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      _isCore: true, // Metadata for stream mapping
    },
    
    // Commercial Electives
    {
      name: 'Business Studies',
      code: 'BUS-SS',
      description: 'Business Studies',
      subjectType: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      isElectiveOption: true,
      electiveGroup: 'COMMERCIAL_ELECTIVE',
    },
    {
      name: 'Computer Science',
      code: 'CMP-SS-COM',
      description: 'Computer Science for Commercial Stream',
      subjectType: 'COMMERCIAL',
      classLevel: ['SS1', 'SS2', 'SS3'],
      eligibleStreams: ['COMMERCIAL'],
      isElectiveOption: true,
      electiveGroup: 'COMMERCIAL_ELECTIVE',
    },
  ];

  const createdCommercialSubjects = [];
  
  for (const subjectData of commercialSubjects) {
    // Extract metadata flags
    const { _isCore, ...subjectFields } = subjectData;
    
    const subject = await prisma.subject.create({
      data: {
        schoolId: demoSchool.id,
        ...subjectFields,
      },
    });
    
    createdCommercialSubjects.push(subject);
    
    const isCore = _isCore || false;
    const isElective = subjectData.isElectiveOption || false;
    
    await prisma.subjectStreamMapping.create({
      data: {
        streamId: createdStreams['COMMERCIAL'].id,
        subjectId: subject.id,
        isCore: isCore,
        isElective: isElective,
        electiveGroup: subjectData.electiveGroup,
      },
    });
    
    console.log(`✅ Commercial Subject: ${subject.name} (${isCore ? 'Core' : 'Elective'})`);
  }

  // ============================================================================
  // 9. CREATE DEMO USERS (Admin, Directors, Teachers, Students)
  // ============================================================================
  console.log('\n9️⃣ Creating Demo Users...');
  
  const defaultPassword = await bcrypt.hash('Demo@123', 10);

  // School Admin
  const adminUser = await prisma.user.create({
    data: {
      firstName: 'School',
      lastName: 'Administrator',
      email: 'admin@demoschool.edu',
      passwordHash: defaultPassword,
      role: 'ADMIN',
      schoolId: demoSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  await prisma.adminProfile.create({
    data: {
      userId: adminUser.id,
      schoolId: demoSchool.id,
      firstName: 'School',
      lastName: 'Administrator',
      phone: '+234-800-111-2222',
    },
  });
  
  console.log('✅ Admin created: admin@demoschool.edu');

  // JS Director
  const jsDirectorUser = await prisma.user.create({
    data: {
      firstName: 'James',
      lastName: 'Director',
      email: 'js.director@demoschool.edu',
      passwordHash: defaultPassword,
      role: 'TEACHER',
      schoolId: demoSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const jsDirectorProfile = await prisma.teacherProfile.create({
    data: {
      userId: jsDirectorUser.id,
      schoolId: demoSchool.id,
      firstName: 'James',
      lastName: 'Director',
      employeeId: 'TCH-JS-DIR-001',
      department: 'Junior Secondary',
      teacherRole: 'DIRECTOR',
      levelSpecialization: 'JUNIOR',
      qualifications: 'M.Ed in Education Management',
      experienceYears: 15,
    },
  });
  
  console.log('✅ JS Director created: js.director@demoschool.edu');

  // SS Director
  const ssDirectorUser = await prisma.user.create({
    data: {
      firstName: 'Sarah',
      lastName: 'Director',
      email: 'ss.director@demoschool.edu',
      passwordHash: defaultPassword,
      role: 'TEACHER',
      schoolId: demoSchool.id,
      isEmailVerified: true,
      isActive: true,
    },
  });

  const ssDirectorProfile = await prisma.teacherProfile.create({
    data: {
      userId: ssDirectorUser.id,
      schoolId: demoSchool.id,
      firstName: 'Sarah',
      lastName: 'Director',
      employeeId: 'TCH-SS-DIR-001',
      department: 'Senior Secondary',
      teacherRole: 'DIRECTOR',
      levelSpecialization: 'SENIOR',
      canTeachStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
      qualifications: 'Ph.D in Educational Leadership',
      experienceYears: 20,
    },
  });
  
  console.log('✅ SS Director created: ss.director@demoschool.edu');

  // ============================================================================
  // 10. CREATE CLASSES
  // ============================================================================
  console.log('\n🔟 Creating Classes...');
  
  const classes = [
    // Junior Secondary
    { name: 'JS1A', classLevel: 'JS1', section: 'A', academicYear: '2025/2026' },
    { name: 'JS2A', classLevel: 'JS2', section: 'A', academicYear: '2025/2026' },
    { name: 'JS3A', classLevel: 'JS3', section: 'A', academicYear: '2025/2026' },
    
    // Senior Secondary
    { name: 'SS1A', classLevel: 'SS1', section: 'A', academicYear: '2025/2026', streamType: 'MIXED' },
    { name: 'SS2A', classLevel: 'SS2', section: 'A', academicYear: '2025/2026', streamType: 'MIXED' },
    { name: 'SS3A', classLevel: 'SS3', section: 'A', academicYear: '2025/2026', streamType: 'MIXED' },
  ];

  const createdClasses = {};
  
  for (const classData of classes) {
    const classRecord = await prisma.class.create({
      data: {
        schoolId: demoSchool.id,
        ...classData,
        capacity: 40,
      },
    });
    
    createdClasses[classData.name] = classRecord;
    console.log(`✅ Class created: ${classRecord.name}`);
  }

  // ============================================================================
  // 11. CREATE DEMO TEACHERS
  // ============================================================================
  console.log('\n1️⃣1️⃣ Creating Demo Teachers...');
  
  const teachers = [
    { firstName: 'John', lastName: 'Smith', email: 'john.smith@demoschool.edu', department: 'Mathematics' },
    { firstName: 'Mary', lastName: 'Johnson', email: 'mary.johnson@demoschool.edu', department: 'English' },
    { firstName: 'David', lastName: 'Williams', email: 'david.williams@demoschool.edu', department: 'Science' },
    { firstName: 'Lisa', lastName: 'Brown', email: 'lisa.brown@demoschool.edu', department: 'Arts' },
    { firstName: 'Michael', lastName: 'Davis', email: 'michael.davis@demoschool.edu', department: 'Commerce' },
  ];

  const createdTeachers = [];
  
  for (let i = 0; i < teachers.length; i++) {
    const teacherData = teachers[i];
    
    const teacherUser = await prisma.user.create({
      data: {
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        email: teacherData.email,
        passwordHash: defaultPassword,
        role: 'TEACHER',
        schoolId: demoSchool.id,
        isEmailVerified: true,
        isActive: true,
      },
    });

    const teacherProfile = await prisma.teacherProfile.create({
      data: {
        userId: teacherUser.id,
        schoolId: demoSchool.id,
        firstName: teacherData.firstName,
        lastName: teacherData.lastName,
        employeeId: `TCH-${String(i + 1).padStart(3, '0')}`,
        department: teacherData.department,
        teacherRole: 'SUBJECT_TEACHER',
        levelSpecialization: 'BOTH',
        canTeachStreams: ['SCIENCE', 'ARTS', 'COMMERCIAL'],
        experienceYears: 5 + i,
      },
    });
    
    createdTeachers.push(teacherProfile);
    console.log(`✅ Teacher created: ${teacherData.firstName} ${teacherData.lastName}`);
  }

  // ============================================================================
  // 12. CREATE DEMO STUDENTS
  // ============================================================================
  console.log('\n1️⃣2️⃣ Creating Demo Students...');
  
  const studentClasses = ['SS1A', 'SS2A', 'SS3A'];
  
  for (let classIndex = 0; classIndex < studentClasses.length; classIndex++) {
    const className = studentClasses[classIndex];
    const classRecord = createdClasses[className];
    
    // Create 5 students per class
    for (let i = 1; i <= 5; i++) {
      const studentNum = (classIndex * 5) + i;
      
      const studentUser = await prisma.user.create({
        data: {
          firstName: `Student${studentNum}`,
          lastName: `Test${studentNum}`,
          email: `student${studentNum}@demoschool.edu`,
          passwordHash: defaultPassword,
          role: 'STUDENT',
          schoolId: demoSchool.id,
          isEmailVerified: true,
          isActive: true,
        },
      });

      await prisma.studentProfile.create({
        data: {
          userId: studentUser.id,
          schoolId: demoSchool.id,
          firstName: `Student${studentNum}`,
          lastName: 'Demo',
          studentId: `STD-${String(studentNum).padStart(4, '0')}`,
          classId: classRecord.id,
          dateOfBirth: new Date('2010-01-15'),
          gender: i % 2 === 0 ? 'Male' : 'Female',
          guardianName: `Parent of Student${studentNum}`,
          guardianPhone: `+234-800-${String(studentNum).padStart(3, '0')}-0000`,
          guardianEmail: `parent${studentNum}@example.com`,
          hasCompletedSubjectSelection: false,
        },
      });
      
      console.log(`✅ Student created: student${studentNum}@demoschool.edu (${className})`);
    }
  }

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('\n🎉 Phase 1 Seeding Complete!\n');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📊 SEEDING SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`✅ Head Admin: headadmin@uplus.com (Password: HeadAdmin@123)`);
  console.log(`✅ School: ${demoSchool.name}`);
  console.log(`✅ Admin: admin@demoschool.edu (Password: Demo@123)`);
  console.log(`✅ JS Director: js.director@demoschool.edu (Password: Demo@123)`);
  console.log(`✅ SS Director: ss.director@demoschool.edu (Password: Demo@123)`);
  console.log(`✅ Teachers: 5 teachers created (Password: Demo@123)`);
  console.log(`✅ Students: 15 students created (Password: Demo@123)`);
  console.log(`✅ Classes: 6 classes (JS1A, JS2A, JS3A, SS1A, SS2A, SS3A)`);
  console.log(`✅ Streams: 3 streams (Science, Arts, Commercial)`);
  console.log(`✅ Subjects: ${coreSubjects.length + scienceSubjects.length + artsSubjects.length + commercialSubjects.length} subjects created`);
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