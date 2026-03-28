// Database Connection Test Script
// UPSS Phase 1 - Verify database setup

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function success(msg) {
  console.log(`${COLORS.green}✅ ${msg}${COLORS.reset}`);
}

function error(msg) {
  console.log(`${COLORS.red}❌ ${msg}${COLORS.reset}`);
}

function info(msg) {
  console.log(`${COLORS.cyan}ℹ️  ${msg}${COLORS.reset}`);
}

function section(msg) {
  console.log(`\n${COLORS.blue}${'='.repeat(60)}${COLORS.reset}`);
  console.log(`${COLORS.blue}${msg}${COLORS.reset}`);
  console.log(`${COLORS.blue}${'='.repeat(60)}${COLORS.reset}\n`);
}

async function testDatabaseConnection() {
  section('Testing Database Connection');
  
  try {
    await prisma.$connect();
    success('Successfully connected to database');
    return true;
  } catch (err) {
    error('Failed to connect to database');
    console.error(err.message);
    return false;
  }
}

async function testUserCounts() {
  section('Testing User Counts');
  
  try {
    const totalUsers = await prisma.user.count();
    const students = await prisma.studentProfile.count();
    const teachers = await prisma.teacherProfile.count();
    const admins = await prisma.adminProfile.count();
    
    info(`Total Users: ${totalUsers}`);
    info(`Students: ${students}`);
    info(`Teachers: ${teachers}`);
    info(`Admins: ${admins}`);
    
    success('User counts retrieved successfully');
    return true;
  } catch (err) {
    error('Failed to get user counts');
    console.error(err.message);
    return false;
  }
}

async function testSchoolData() {
  section('Testing School Data');
  
  try {
    const schools = await prisma.school.findMany();
    
    if (schools.length === 0) {
      error('No schools found in database');
      return false;
    }
    
    schools.forEach(school => {
      info(`School: ${school.name} (${school.slug})`);
      info(`  Status: ${school.isActive ? 'Active' : 'Inactive'}`);
      info(`  Plan: ${school.subscriptionPlan}`);
    });
    
    success(`Found ${schools.length} school(s)`);
    return true;
  } catch (err) {
    error('Failed to retrieve school data');
    console.error(err.message);
    return false;
  }
}

async function testStreams() {
  section('Testing Subject Streams');
  
  try {
    const streams = await prisma.subjectStream.findMany({
      include: {
        _count: {
          select: {
            subjectMappings: true
          }
        }
      }
    });
    
    if (streams.length === 0) {
      error('No streams found in database');
      return false;
    }
    
    streams.forEach(stream => {
      info(`Stream: ${stream.displayName} (${stream.name})`);
      info(`  Class Level: ${stream.classLevel}`);
      info(`  Electives: ${stream.minimumElectives}-${stream.maximumElectives}`);
      info(`  Subjects Mapped: ${stream._count.subjectMappings}`);
    });
    
    success(`Found ${streams.length} stream(s)`);
    return true;
  } catch (err) {
    error('Failed to retrieve stream data');
    console.error(err.message);
    return false;
  }
}

async function testSubjects() {
  section('Testing Subjects');
  
  try {
    const totalSubjects = await prisma.subject.count();
    const coreSubjects = await prisma.subject.count({
      where: { subjectType: 'CORE' }
    });
    const scienceSubjects = await prisma.subject.count({
      where: { subjectType: 'SCIENCE' }
    });
    const artsSubjects = await prisma.subject.count({
      where: { subjectType: 'ARTS' }
    });
    const commercialSubjects = await prisma.subject.count({
      where: { subjectType: 'COMMERCIAL' }
    });
    
    info(`Total Subjects: ${totalSubjects}`);
    info(`Core Subjects: ${coreSubjects}`);
    info(`Science Subjects: ${scienceSubjects}`);
    info(`Arts Subjects: ${artsSubjects}`);
    info(`Commercial Subjects: ${commercialSubjects}`);
    
    // Get sample subjects
    const samples = await prisma.subject.findMany({
      take: 5,
      select: {
        name: true,
        code: true,
        subjectType: true,
        isElectiveOption: true
      }
    });
    
    console.log('\nSample Subjects:');
    samples.forEach(subject => {
      info(`  ${subject.name} (${subject.code}) - ${subject.subjectType} ${subject.isElectiveOption ? '[Elective]' : '[Core]'}`);
    });
    
    success('Subject data retrieved successfully');
    return true;
  } catch (err) {
    error('Failed to retrieve subject data');
    console.error(err.message);
    return false;
  }
}

async function testClasses() {
  section('Testing Classes');
  
  try {
    const classes = await prisma.class.findMany({
      include: {
        _count: {
          select: {
            students: true
          }
        }
      },
      orderBy: {
        classLevel: 'asc'
      }
    });
    
    if (classes.length === 0) {
      error('No classes found in database');
      return false;
    }
    
    classes.forEach(cls => {
      info(`Class: ${cls.name} (${cls.classLevel})`);
      info(`  Students: ${cls._count.students}`);
      info(`  Stream Type: ${cls.streamType || 'N/A'}`);
    });
    
    success(`Found ${classes.length} class(es)`);
    return true;
  } catch (err) {
    error('Failed to retrieve class data');
    console.error(err.message);
    return false;
  }
}

async function testStudentSelections() {
  section('Testing Student Subject Selections');
  
  try {
    const totalStudents = await prisma.studentProfile.count();
    const withSelection = await prisma.studentProfile.count({
      where: { hasCompletedSubjectSelection: true }
    });
    const withoutSelection = await prisma.studentProfile.count({
      where: { hasCompletedSubjectSelection: false }
    });
    
    info(`Total Students: ${totalStudents}`);
    info(`With Selection: ${withSelection}`);
    info(`Without Selection: ${withoutSelection}`);
    
    // Get a sample student
    const sampleStudent = await prisma.studentProfile.findFirst({
      include: {
        user: {
          select: {
            email: true
          }
        },
        class: {
          select: {
            name: true,
            classLevel: true
          }
        }
      }
    });
    
    if (sampleStudent) {
      console.log('\nSample Student:');
      info(`  Name: ${sampleStudent.firstName} ${sampleStudent.lastName}`);
      info(`  Email: ${sampleStudent.user.email}`);
      info(`  Class: ${sampleStudent.class?.name || 'None'}`);
      info(`  Selection Complete: ${sampleStudent.hasCompletedSubjectSelection ? 'Yes' : 'No'}`);
      info(`  Current Stream: ${sampleStudent.currentStream || 'Not selected'}`);
    }
    
    success('Student selection data retrieved successfully');
    return true;
  } catch (err) {
    error('Failed to retrieve student selection data');
    console.error(err.message);
    return false;
  }
}

async function testTeacherAssignments() {
  section('Testing Teacher Assignments');
  
  try {
    const totalAssignments = await prisma.teacherSubject.count();
    
    info(`Total Teacher-Subject Assignments: ${totalAssignments}`);
    
    if (totalAssignments > 0) {
      const sampleAssignment = await prisma.teacherSubject.findFirst({
        include: {
          teacher: {
            select: {
              firstName: true,
              lastName: true
            }
          },
          subject: {
            select: {
              name: true,
              code: true
            }
          }
        }
      });
      
      if (sampleAssignment) {
        console.log('\nSample Assignment:');
        info(`  Teacher: ${sampleAssignment.teacher.firstName} ${sampleAssignment.teacher.lastName}`);
        info(`  Subject: ${sampleAssignment.subject.name} (${sampleAssignment.subject.code})`);
      }
    }
    
    success('Teacher assignment data retrieved successfully');
    return true;
  } catch (err) {
    error('Failed to retrieve teacher assignment data');
    console.error(err.message);
    return false;
  }
}

async function testStreamMappings() {
  section('Testing Stream-Subject Mappings');
  
  try {
    const totalMappings = await prisma.subjectStreamMapping.count();
    const coreMappings = await prisma.subjectStreamMapping.count({
      where: { isCore: true }
    });
    const electiveMappings = await prisma.subjectStreamMapping.count({
      where: { isElective: true }
    });
    
    info(`Total Stream-Subject Mappings: ${totalMappings}`);
    info(`Core Subject Mappings: ${coreMappings}`);
    info(`Elective Subject Mappings: ${electiveMappings}`);
    
    // Get sample mapping
    const sampleMapping = await prisma.subjectStreamMapping.findFirst({
      include: {
        stream: {
          select: {
            displayName: true
          }
        },
        subject: {
          select: {
            name: true
          }
        }
      }
    });
    
    if (sampleMapping) {
      console.log('\nSample Mapping:');
      info(`  Stream: ${sampleMapping.stream.displayName}`);
      info(`  Subject: ${sampleMapping.subject.name}`);
      info(`  Type: ${sampleMapping.isCore ? 'Core' : 'Elective'}`);
      if (sampleMapping.electiveGroup) {
        info(`  Elective Group: ${sampleMapping.electiveGroup}`);
      }
    }
    
    success('Stream mapping data retrieved successfully');
    return true;
  } catch (err) {
    error('Failed to retrieve stream mapping data');
    console.error(err.message);
    return false;
  }
}

async function testRelationships() {
  section('Testing Database Relationships');
  
  try {
    // Test complex query with multiple relations
    const streamWithDetails = await prisma.subjectStream.findFirst({
      include: {
        subjectMappings: {
          include: {
            subject: true
          }
        }
      }
    });
    
    if (!streamWithDetails) {
      error('No stream found for relationship test');
      return false;
    }
    
    info(`Stream: ${streamWithDetails.displayName}`);
    info(`  Mapped Subjects: ${streamWithDetails.subjectMappings.length}`);
    
    const coreCount = streamWithDetails.subjectMappings.filter(m => m.isCore).length;
    const electiveCount = streamWithDetails.subjectMappings.filter(m => m.isElective).length;
    
    info(`  Core: ${coreCount}`);
    info(`  Electives: ${electiveCount}`);
    
    success('Database relationships working correctly');
    return true;
  } catch (err) {
    error('Failed to test database relationships');
    console.error(err.message);
    return false;
  }
}

async function runAllTests() {
  console.log(`${COLORS.cyan}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║       UPSS Phase 1 - Database Verification Tests          ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(`${COLORS.reset}`);
  
  const tests = [
    { name: 'Database Connection', fn: testDatabaseConnection },
    { name: 'User Counts', fn: testUserCounts },
    { name: 'School Data', fn: testSchoolData },
    { name: 'Streams', fn: testStreams },
    { name: 'Subjects', fn: testSubjects },
    { name: 'Classes', fn: testClasses },
    { name: 'Student Selections', fn: testStudentSelections },
    { name: 'Teacher Assignments', fn: testTeacherAssignments },
    { name: 'Stream Mappings', fn: testStreamMappings },
    { name: 'Relationships', fn: testRelationships },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (err) {
      error(`Test '${test.name}' threw an error:`);
      console.error(err);
      failed++;
    }
  }
  
  // Summary
  section('Test Summary');
  
  info(`Total Tests: ${tests.length}`);
  success(`Passed: ${passed}`);
  
  if (failed > 0) {
    error(`Failed: ${failed}`);
  }
  
  console.log(`\n${COLORS.cyan}${'='.repeat(60)}${COLORS.reset}\n`);
  
  if (failed === 0) {
    console.log(`${COLORS.green}🎉 All tests passed! Phase 1 database setup is complete!${COLORS.reset}\n`);
  } else {
    console.log(`${COLORS.red}⚠️  Some tests failed. Please review the errors above.${COLORS.reset}\n`);
  }
}

// Run tests
runAllTests()
  .catch((err) => {
    console.error('Fatal error running tests:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
