// lib/db.ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Master database connection (public schema)
export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Tenant database helper
export async function withTenant<T>(
  schema: string,
  callback: (client: PrismaClient) => Promise<T>
): Promise<T> {
  const client = new PrismaClient();
  
  try {
    // Set search path to tenant schema
    await client.$executeRawUnsafe(`SET search_path = "${schema}", public`);
    
    const result = await callback(client);
    return result;
  } finally {
    await client.$disconnect();
  }
}

// Tenant DDL script for new schools
export const TENANT_DDL = `
  -- Users table
  CREATE TABLE users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('SCHOOL_ADMIN', 'DIRECTOR', 'COORDINATOR', 'TEACHER_SUBJECT', 'TEACHER_CLASS', 'STUDENT')),
    status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'INVITED')),
    class TEXT,
    parent_email TEXT,
    subjects TEXT[],
    assigned_class TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Assignments table
  CREATE TABLE assignments (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    classes TEXT[] NOT NULL,
    subject TEXT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    file_urls TEXT[],
    auto_grade BOOLEAN DEFAULT false,
    max_score INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  -- Submissions table
  CREATE TABLE submissions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_urls TEXT[],
    text_content TEXT,
    score INTEGER,
    feedback TEXT,
    graded_at TIMESTAMP,
    submitted_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(assignment_id, student_id)
  );

  -- Results table
  CREATE TABLE results (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    exam_type TEXT NOT NULL,
    score INTEGER NOT NULL,
    max_score INTEGER NOT NULL,
    pass_mark INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Timetables table
  CREATE TABLE timetables (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    class TEXT NOT NULL,
    day TEXT NOT NULL,
    period INTEGER NOT NULL,
    subject TEXT NOT NULL,
    teacher_id TEXT REFERENCES users(id),
    status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    coordinator_id TEXT NOT NULL,
    director_feedback TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(class, day, period)
  );

  -- Messages table
  CREATE TABLE messages (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    sender_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    receiver_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    file_urls TEXT[],
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Resources table
  CREATE TABLE resources (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    subject TEXT,
    classes TEXT[],
    tags TEXT[],
    uploaded_by TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Guild sessions table
  CREATE TABLE guild_sessions (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    title TEXT NOT NULL,
    description TEXT,
    host_id TEXT NOT NULL,
    room_id TEXT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    max_participants INTEGER,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
  );

  -- Performance snapshots table
  CREATE TABLE performance_snapshots (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    type TEXT NOT NULL,
    data JSONB NOT NULL,
    computed_at TIMESTAMP DEFAULT NOW(),
    period TEXT NOT NULL
  );

  -- Create indexes
  CREATE INDEX idx_users_role ON users(role);
  CREATE INDEX idx_users_class ON users(class);
  CREATE INDEX idx_assignments_teacher ON assignments(teacher_id);
  CREATE INDEX idx_assignments_due_date ON assignments(due_date);
  CREATE INDEX idx_submissions_assignment ON submissions(assignment_id);
  CREATE INDEX idx_results_student ON results(student_id);
  CREATE INDEX idx_results_subject ON results(subject);
  CREATE INDEX idx_timetables_class ON timetables(class);
  CREATE INDEX idx_messages_sender ON messages(sender_id);
  CREATE INDEX idx_messages_receiver ON messages(receiver_id);
  CREATE INDEX idx_resources_subject ON resources(subject);
`;

// Helper to create new tenant schema
export async function createTenantSchema(schoolId: number): Promise<string> {
  const schema = `school_${schoolId}`;
  
  try {
    // Create schema
    await prisma.$executeRawUnsafe(`CREATE SCHEMA "${schema}"`);
    
    // Run DDL inside schema
    await prisma.$executeRawUnsafe(`SET search_path = "${schema}"`);
    await prisma.$executeRawUnsafe(TENANT_DDL);
    await prisma.$executeRawUnsafe(`SET search_path = public`);
    
    return schema;
  } catch (error) {
    console.error('Error creating tenant schema:', error);
    throw new Error(`Failed to create tenant schema for school ${schoolId}`);
  }
}

// Helper to get school by slug
export async function getSchoolBySlug(slug: string) {
  return await prisma.school.findUnique({
    where: { slug },
    include: {
      school_admins: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });
}

// Helper to verify school counts
export async function verifySchoolCounts(schoolId: number) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId }
  });

  if (!school) throw new Error('School not found');

  return await withTenant(school.db_schema, async (client) => {
    const studentCount = await client.$executeRaw`
      SELECT COUNT(*) FROM users WHERE role = 'STUDENT' AND status = 'ACTIVE'
    `;
    
    const teacherCount = await client.$executeRaw`
      SELECT COUNT(*) FROM users 
      WHERE role IN ('TEACHER_SUBJECT', 'TEACHER_CLASS') AND status = 'ACTIVE'
    `;

    return {
      verified_students: Number(studentCount),
      verified_teachers: Number(teacherCount)
    };
  });
}