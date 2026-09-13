-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('HEADADMIN', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT');

-- CreateEnum
CREATE TYPE "TeacherRole" AS ENUM ('DIRECTOR', 'COORDINATOR', 'SUBJECT_TEACHER');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('male', 'female', 'other');

-- CreateEnum
CREATE TYPE "OtpPurpose" AS ENUM ('IDENTITY_VERIFICATION', 'PASSWORD_RESET', 'CHILD_PASSWORD_RESET');

-- CreateEnum
CREATE TYPE "SubjectCategory" AS ENUM ('CORE', 'SCIENCE', 'ARTS', 'COMMERCIAL', 'VOCATIONAL', 'ELECTIVE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('pending', 'paid', 'overdue', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('direct', 'broadcast', 'system', 'announcement');

-- CreateEnum
CREATE TYPE "MessagePriority" AS ENUM ('low', 'normal', 'high', 'urgent');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('info', 'success', 'warning', 'error', 'system');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('pending', 'approved', 'rejected', 'revision_requested');

-- CreateEnum
CREATE TYPE "AssignmentType" AS ENUM ('homework', 'project', 'quiz', 'exam', 'essay', 'lab_report', 'presentation', 'research', 'classwork');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('draft', 'active', 'closed', 'cancelled');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('submitted', 'graded', 'returned', 'late', 'missing');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('present', 'absent', 'late', 'excused', 'partial');

-- CreateEnum
CREATE TYPE "AssessmentType" AS ENUM ('test', 'exam', 'quiz', 'assignment', 'project', 'midterm', 'final', 'continuous_assessment', 'practical');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('performance_concern', 'attendance_issue', 'behavioral_issue', 'parent_meeting_required', 'academic_support_needed', 'commendation', 'disciplinary_action');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('active', 'in_progress', 'resolved', 'escalated');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('class', 'exam', 'meeting', 'event', 'deadline', 'reminder', 'parent_meeting');

-- CreateEnum
CREATE TYPE "AccessLevel" AS ENUM ('public', 'school', 'class', 'teacher_only', 'admin_only');

-- CreateEnum
CREATE TYPE "CommunicationType" AS ENUM ('academic_concern', 'behavioral_issue', 'attendance_alert', 'positive_feedback', 'meeting_request', 'general_update', 'emergency_contact');

-- CreateEnum
CREATE TYPE "CommunicationMethod" AS ENUM ('email', 'sms', 'phone_call', 'in_person', 'video_call', 'letter');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('draft', 'sent', 'delivered', 'read', 'responded', 'failed');

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('draft', 'published', 'scheduled', 'expired', 'archived');

-- CreateEnum
CREATE TYPE "StudentFeeStatus" AS ENUM ('pending', 'partial', 'paid', 'overdue', 'waived');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('paystack');

-- CreateTable
CREATE TABLE "schools" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "logo" VARCHAR(500),
    "website" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "theme_color" VARCHAR(7),
    "subscription_plan" TEXT NOT NULL DEFAULT 'trial',
    "subscription_expires_at" TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
    "subscription_is_active" BOOLEAN NOT NULL DEFAULT true,
    "allow_student_registration" BOOLEAN NOT NULL DEFAULT false,
    "require_email_verification" BOOLEAN NOT NULL DEFAULT true,
    "max_students" INTEGER NOT NULL DEFAULT 1000,
    "max_teachers" INTEGER NOT NULL DEFAULT 100,
    "custom_next_payment_days" INTEGER,
    "recurring_payment_months" INTEGER,
    "one_week_warning_sent_at" TIMESTAMPTZ,
    "final_warning_sent_at" TIMESTAMPTZ,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "username" VARCHAR(100),
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL,
    "school_id" UUID,
    "avatar" VARCHAR(500),
    "date_of_birth" DATE,
    "phone" VARCHAR(20),
    "address" TEXT,
    "gender" "Gender",
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_email_verified" BOOLEAN NOT NULL DEFAULT false,
    "policy_accepted_at" TIMESTAMPTZ,
    "email_verification_token" VARCHAR(255),
    "password_reset_token" VARCHAR(255),
    "password_reset_expires" TIMESTAMPTZ,
    "last_login" TIMESTAMPTZ,
    "login_attempts" INTEGER NOT NULL DEFAULT 0,
    "lock_until" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "hashed_token" VARCHAR(255),
    "user_agent" TEXT,
    "ip_address" INET,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "used_at" TIMESTAMPTZ,
    "ip_address" INET,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "student_id" VARCHAR(50),
    "class_name" VARCHAR(50),
    "section" VARCHAR(10),
    "department" VARCHAR(50),
    "admission_date" DATE,
    "middle_name" VARCHAR(100),
    "date_of_birth" DATE,
    "gender" VARCHAR(20),
    "class_id" UUID,
    "blood_group" VARCHAR(5),
    "allergies" TEXT,
    "emergency_contact" TEXT,
    "profile_image" VARCHAR(500),
    "address" TEXT,
    "has_completed_subject_selection" BOOLEAN NOT NULL DEFAULT false,
    "current_stream" VARCHAR(20),
    "parent_name" VARCHAR(200),
    "parent_phone" VARCHAR(20),
    "parent_email" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "parent_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_student_links" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "parent_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "relationship" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "parent_student_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" VARCHAR(20) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "purpose" "OtpPurpose" NOT NULL,
    "school_id" UUID,
    "student_id" UUID,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "consumed_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limit_attempts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "key" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rate_limit_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "employee_id" VARCHAR(50),
    "department" VARCHAR(100),
    "qualification" VARCHAR(255),
    "experience_years" INTEGER NOT NULL DEFAULT 0,
    "joining_date" DATE,
    "coordinatorClass" VARCHAR(10),
    "teacher_role" "TeacherRole" NOT NULL DEFAULT 'SUBJECT_TEACHER',
    "level_specialization" VARCHAR(20),
    "can_teach_streams" TEXT[],
    "profile_image" VARCHAR(500),
    "phone" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_profiles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "employee_id" VARCHAR(50),
    "department" VARCHAR(100),
    "phone" VARCHAR(20),
    "profile_image" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admin_permissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "admin_profile_id" UUID NOT NULL,
    "module" VARCHAR(50) NOT NULL,
    "actions" TEXT[],
    "can_create" BOOLEAN NOT NULL DEFAULT false,
    "can_read" BOOLEAN NOT NULL DEFAULT true,
    "can_update" BOOLEAN NOT NULL DEFAULT false,
    "can_delete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "email_notifications" BOOLEAN NOT NULL DEFAULT true,
    "push_notifications" BOOLEAN NOT NULL DEFAULT true,
    "sms_notifications" BOOLEAN NOT NULL DEFAULT false,
    "assignment_reminders" BOOLEAN NOT NULL DEFAULT true,
    "grade_notifications" BOOLEAN NOT NULL DEFAULT true,
    "attendance_alerts" BOOLEAN NOT NULL DEFAULT true,
    "profile_visibility" BOOLEAN NOT NULL DEFAULT true,
    "show_performance" BOOLEAN NOT NULL DEFAULT false,
    "theme" VARCHAR(20) NOT NULL DEFAULT 'light',
    "language" VARCHAR(10) NOT NULL DEFAULT 'en',
    "preferences" JSONB DEFAULT '{}',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "class_level" VARCHAR(10) NOT NULL,
    "section" VARCHAR(5),
    "academic_year" VARCHAR(10) NOT NULL,
    "stream_type" VARCHAR(20),
    "is_stream_specific" BOOLEAN NOT NULL DEFAULT false,
    "capacity" INTEGER,
    "room_number" VARCHAR(20),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_class_coordinators" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teacherId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_class_coordinators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_terms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "shortName" VARCHAR(20) NOT NULL,
    "academicYear" VARCHAR(20) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "is_enrollment_open" BOOLEAN NOT NULL DEFAULT false,
    "midterm_deadline" DATE,
    "final_grade_deadline" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "academic_terms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(60) NOT NULL,
    "description" TEXT,
    "category" "SubjectCategory" NOT NULL DEFAULT 'CORE',
    "class_level" TEXT[],
    "eligible_streams" TEXT[],
    "is_elective_option" BOOLEAN NOT NULL DEFAULT false,
    "elective_group" VARCHAR(20),
    "max_students" INTEGER,
    "credit_hours" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "teacherId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "classes" TEXT[],
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "teacher_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_subject_selections" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "class_level" VARCHAR(10) NOT NULL,
    "stream" VARCHAR(20),
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "selection_complete" BOOLEAN NOT NULL DEFAULT false,
    "last_modified_by" UUID,
    "last_modified_at" TIMESTAMPTZ,
    "academic_year" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_subject_selections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_selected_subjects" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "selection_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "is_elective" BOOLEAN NOT NULL DEFAULT false,
    "selected_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_selected_subjects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_selection_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "selection_id" UUID NOT NULL,
    "action" VARCHAR(30) NOT NULL,
    "previous_stream" VARCHAR(20),
    "new_stream" VARCHAR(20),
    "previous_subjects" JSONB,
    "new_subjects" JSONB,
    "modified_by" UUID NOT NULL,
    "modified_by_role" VARCHAR(20) NOT NULL,
    "reason" TEXT,
    "timestamp" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subject_selection_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_streams" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "display_name" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "class_level" VARCHAR(5) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "minimum_electives" INTEGER NOT NULL DEFAULT 2,
    "maximum_electives" INTEGER NOT NULL DEFAULT 4,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "subject_streams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_stream_mappings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "stream_id" UUID NOT NULL,
    "subject_id" UUID NOT NULL,
    "is_core" BOOLEAN NOT NULL DEFAULT false,
    "is_elective" BOOLEAN NOT NULL DEFAULT false,
    "elective_group" VARCHAR(20),
    "position" INTEGER,

    CONSTRAINT "subject_stream_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subject_prerequisites" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "subject_id" UUID NOT NULL,
    "prerequisite_subject_id" UUID NOT NULL,
    "is_strict" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "subject_prerequisites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetables" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "class_id" UUID,
    "className" VARCHAR(50) NOT NULL,
    "dayOfWeek" VARCHAR(20) NOT NULL,
    "period" INTEGER NOT NULL,
    "subject" VARCHAR(100) NOT NULL,
    "teacherId" UUID NOT NULL,
    "startTime" VARCHAR(10) NOT NULL,
    "endTime" VARCHAR(10) NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "timetables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "timetable_approvals" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "timetableId" UUID NOT NULL,
    "coordinatorId" UUID NOT NULL,
    "directorId" UUID,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'pending',
    "comments" TEXT,
    "conflict_data" JSONB,
    "submitted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMPTZ,

    CONSTRAINT "timetable_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "instructions" TEXT,
    "assignment_type" "AssignmentType" NOT NULL DEFAULT 'homework',
    "due_date" TIMESTAMPTZ NOT NULL,
    "available_from" TIMESTAMPTZ,
    "closed_at" TIMESTAMPTZ,
    "max_score" INTEGER NOT NULL DEFAULT 100,
    "passing_score" INTEGER,
    "classes" TEXT[],
    "status" "AssignmentStatus" NOT NULL DEFAULT 'draft',
    "allow_late_submission" BOOLEAN NOT NULL DEFAULT false,
    "late_submission_penalty" INTEGER,
    "attachments" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment_submissions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "assignmentId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "content" TEXT,
    "attachments" TEXT[],
    "submitted_at" TIMESTAMPTZ NOT NULL,
    "is_late_submission" BOOLEAN NOT NULL DEFAULT false,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "score" INTEGER,
    "max_score" INTEGER NOT NULL,
    "feedback" TEXT,
    "graded_at" TIMESTAMPTZ,
    "graded_by" UUID,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'submitted',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "assignment_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grades" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "term_id" UUID,
    "assessment_type" "AssessmentType" NOT NULL,
    "assessment_name" VARCHAR(255) NOT NULL,
    "score" INTEGER NOT NULL,
    "max_score" INTEGER NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "grade" VARCHAR(5),
    "term_name" VARCHAR(20) NOT NULL,
    "academic_year" VARCHAR(10) NOT NULL,
    "assessment_date" DATE NOT NULL,
    "comments" TEXT,
    "position" INTEGER,
    "class_average" DECIMAL(5,2),
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "grades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "period" VARCHAR(20),
    "status" "AttendanceStatus" NOT NULL,
    "arrival_time" VARCHAR(10),
    "notes" TEXT,
    "reason" TEXT,
    "marked_by" UUID NOT NULL,
    "marked_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_folders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "description" VARCHAR(500),
    "schoolId" UUID NOT NULL,
    "parentId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_folders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resources" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(255) NOT NULL,
    "originalName" VARCHAR(255),
    "filename" VARCHAR(255),
    "url" VARCHAR(500) NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "size" INTEGER NOT NULL,
    "schoolId" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "folderId" UUID,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'school',
    "target_class" VARCHAR(20),
    "target_subject" VARCHAR(50),
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "resources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "uploaded_by" UUID NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" VARCHAR(100) NOT NULL,
    "entity_type" VARCHAR(50) NOT NULL,
    "entity_id" UUID,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "access_level" "AccessLevel" NOT NULL DEFAULT 'school',
    "description" TEXT,
    "tags" TEXT[],
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "from_user_id" UUID,
    "to_user_id" UUID,
    "school_id" UUID,
    "subject" VARCHAR(255),
    "content" TEXT NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'direct',
    "priority" "MessagePriority" NOT NULL DEFAULT 'normal',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_broadcast" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "school_id" UUID,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'info',
    "priority" "MessagePriority" NOT NULL DEFAULT 'normal',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMPTZ,
    "is_global" BOOLEAN NOT NULL DEFAULT false,
    "action_url" VARCHAR(500),
    "action_text" VARCHAR(100),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "summary" VARCHAR(500),
    "target_audience" TEXT[],
    "target_classes" TEXT[],
    "target_roles" TEXT[],
    "publish_at" TIMESTAMPTZ,
    "expires_at" TIMESTAMPTZ,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_urgent" BOOLEAN NOT NULL DEFAULT false,
    "allow_comments" BOOLEAN NOT NULL DEFAULT false,
    "send_notification" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parent_communications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "initiated_by" UUID NOT NULL,
    "type" "CommunicationType" NOT NULL,
    "method" "CommunicationMethod" NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "parent_name" VARCHAR(255) NOT NULL,
    "parent_contact" VARCHAR(100) NOT NULL,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'sent',
    "response_received" BOOLEAN NOT NULL DEFAULT false,
    "response_content" TEXT,
    "response_date" TIMESTAMPTZ,
    "requires_follow_up" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" DATE,
    "follow_up_notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "parent_communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID,
    "invoice_number" VARCHAR(50),
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "description" TEXT,
    "billing_period" VARCHAR(50),
    "student_count" INTEGER NOT NULL DEFAULT 0,
    "teacher_count" INTEGER NOT NULL DEFAULT 0,
    "admin_count" INTEGER NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ,
    "due_date" TIMESTAMPTZ,
    "payment_reference" VARCHAR(255),
    "payment_method" VARCHAR(50),
    "payment_gateway" VARCHAR(50),
    "notes" TEXT,
    "created_by" UUID,
    "verified_by" UUID,
    "verified_at" TIMESTAMPTZ,
    "price_per_user" DECIMAL(10,2),
    "cancelled_at" TIMESTAMPTZ,
    "cancelled_by" UUID,
    "cancellation_reason" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "invoice_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" VARCHAR(50) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "transaction_id" VARCHAR(255),
    "gateway_response" JSONB,
    "processed_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fees" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "term_name" VARCHAR(50),
    "academic_year" VARCHAR(10),
    "due_date" TIMESTAMPTZ,
    "status" "StudentFeeStatus" NOT NULL DEFAULT 'pending',
    "created_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_fees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_fee_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "method" VARCHAR(50) NOT NULL DEFAULT 'bank_transfer',
    "reference" VARCHAR(255),
    "notes" TEXT,
    "confirmed_by" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_fee_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_payment_configs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'paystack',
    "public_key" VARCHAR(255) NOT NULL,
    "secret_key_encrypted" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "school_payment_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_fee_online_payments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_fee_id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'paystack',
    "reference" VARCHAR(255) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "paid_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_fee_online_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_performance_metrics" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "termId" UUID,
    "overall_gpa" DECIMAL(3,2),
    "term_gpa" DECIMAL(3,2),
    "average_score" DECIMAL(5,2),
    "class_rank" INTEGER,
    "class_size" INTEGER,
    "grade_rank" INTEGER,
    "grade_size" INTEGER,
    "assignment_completion" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "attendance_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "disciplinary_incidents" INTEGER NOT NULL DEFAULT 0,
    "commendations" INTEGER NOT NULL DEFAULT 0,
    "performance_trend" TEXT NOT NULL DEFAULT 'stable',
    "attendance_trend" TEXT NOT NULL DEFAULT 'stable',
    "is_at_risk" BOOLEAN NOT NULL DEFAULT false,
    "risk_factors" TEXT[],
    "last_calculated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_performance_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_attendance_patterns" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "weekly_pattern" JSONB NOT NULL,
    "monthly_trend" VARCHAR(20) NOT NULL,
    "average_rate" DECIMAL(5,2) NOT NULL,
    "chronic_absences" INTEGER NOT NULL DEFAULT 0,
    "consecutive_absences" INTEGER NOT NULL DEFAULT 0,
    "is_at_risk" BOOLEAN NOT NULL DEFAULT false,
    "last_updated" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_attendance_patterns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_alerts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "studentId" UUID NOT NULL,
    "schoolId" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "alert_type" "AlertType" NOT NULL,
    "priority" "MessagePriority" NOT NULL DEFAULT 'normal',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'active',
    "resolved_at" TIMESTAMPTZ,
    "resolved_by" UUID,
    "resolution" TEXT,
    "parent_notified" BOOLEAN NOT NULL DEFAULT false,
    "follow_up_date" DATE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "student_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "schoolId" UUID NOT NULL,
    "created_by" UUID NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "event_type" "EventType" NOT NULL,
    "start_date" TIMESTAMPTZ NOT NULL,
    "end_date" TIMESTAMPTZ NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "is_recurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrence_rule" VARCHAR(255),
    "classes" TEXT[],
    "student_ids" TEXT[],
    "teacher_ids" TEXT[],
    "priority" "MessagePriority" NOT NULL DEFAULT 'normal',
    "location" VARCHAR(255),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "calendar_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(100) NOT NULL,
    "resource_id" UUID,
    "description" TEXT,
    "metadata" JSONB,
    "ip_address" INET,
    "user_agent" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "school_id" UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
    "key" VARCHAR(100) NOT NULL,
    "value" TEXT NOT NULL,
    "data_type" VARCHAR(20) NOT NULL DEFAULT 'string',
    "category" VARCHAR(50) NOT NULL DEFAULT 'general',
    "description" TEXT,
    "updated_by" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_reports" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "coordinatorId" UUID NOT NULL,
    "reportType" VARCHAR(50) NOT NULL,
    "report_data" JSONB NOT NULL,
    "parameters" JSONB,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "generated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinator_reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_slug_key" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_slug_idx" ON "schools"("slug");

-- CreateIndex
CREATE INDEX "schools_is_active_idx" ON "schools"("is_active");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_username_school_id_idx" ON "users"("username", "school_id");

-- CreateIndex
CREATE INDEX "users_role_school_id_is_active_idx" ON "users"("role", "school_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_school_id_key" ON "users"("email", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_school_id_key" ON "users"("username", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_token_hash_key" ON "user_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_token_hash_idx" ON "user_sessions"("token_hash");

-- CreateIndex
CREATE INDEX "user_sessions_expires_at_idx" ON "user_sessions"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_idx" ON "password_reset_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_student_id_key" ON "student_profiles"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_user_id_key" ON "parent_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_profiles_phone_school_id_key" ON "parent_profiles"("phone", "school_id");

-- CreateIndex
CREATE UNIQUE INDEX "parent_student_links_parent_id_student_id_key" ON "parent_student_links"("parent_id", "student_id");

-- CreateIndex
CREATE INDEX "otp_verifications_phone_purpose_idx" ON "otp_verifications"("phone", "purpose");

-- CreateIndex
CREATE INDEX "rate_limit_attempts_key_created_at_idx" ON "rate_limit_attempts"("key", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_employee_id_key" ON "teacher_profiles"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_user_id_key" ON "admin_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_profiles_employee_id_key" ON "admin_profiles"("employee_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_permissions_admin_profile_id_module_key" ON "admin_permissions"("admin_profile_id", "module");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "classes_code_key" ON "classes"("code");

-- CreateIndex
CREATE INDEX "classes_schoolId_idx" ON "classes"("schoolId");

-- CreateIndex
CREATE INDEX "classes_class_level_idx" ON "classes"("class_level");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_class_coordinators_teacherId_classId_key" ON "teacher_class_coordinators"("teacherId", "classId");

-- CreateIndex
CREATE INDEX "academic_terms_schoolId_idx" ON "academic_terms"("schoolId");

-- CreateIndex
CREATE INDEX "academic_terms_is_active_idx" ON "academic_terms"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "academic_terms_schoolId_name_key" ON "academic_terms"("schoolId", "name");

-- CreateIndex
CREATE INDEX "subjects_schoolId_idx" ON "subjects"("schoolId");

-- CreateIndex
CREATE INDEX "subjects_category_idx" ON "subjects"("category");

-- CreateIndex
CREATE INDEX "subjects_is_active_idx" ON "subjects"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_code_schoolId_key" ON "subjects"("code", "schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_subjects_teacherId_subjectId_key" ON "teacher_subjects"("teacherId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "student_subject_selections_student_id_key" ON "student_subject_selections"("student_id");

-- CreateIndex
CREATE INDEX "student_subject_selections_school_id_class_level_idx" ON "student_subject_selections"("school_id", "class_level");

-- CreateIndex
CREATE INDEX "student_subject_selections_student_id_idx" ON "student_subject_selections"("student_id");

-- CreateIndex
CREATE INDEX "student_subject_selections_stream_idx" ON "student_subject_selections"("stream");

-- CreateIndex
CREATE INDEX "student_selected_subjects_selection_id_idx" ON "student_selected_subjects"("selection_id");

-- CreateIndex
CREATE INDEX "student_selected_subjects_subject_id_idx" ON "student_selected_subjects"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_selected_subjects_selection_id_subject_id_key" ON "student_selected_subjects"("selection_id", "subject_id");

-- CreateIndex
CREATE INDEX "subject_selection_history_selection_id_idx" ON "subject_selection_history"("selection_id");

-- CreateIndex
CREATE INDEX "subject_selection_history_timestamp_idx" ON "subject_selection_history"("timestamp");

-- CreateIndex
CREATE INDEX "subject_selection_history_modified_by_idx" ON "subject_selection_history"("modified_by");

-- CreateIndex
CREATE INDEX "subject_streams_school_id_idx" ON "subject_streams"("school_id");

-- CreateIndex
CREATE INDEX "subject_streams_class_level_idx" ON "subject_streams"("class_level");

-- CreateIndex
CREATE UNIQUE INDEX "subject_streams_school_id_name_class_level_key" ON "subject_streams"("school_id", "name", "class_level");

-- CreateIndex
CREATE INDEX "subject_stream_mappings_stream_id_idx" ON "subject_stream_mappings"("stream_id");

-- CreateIndex
CREATE INDEX "subject_stream_mappings_subject_id_idx" ON "subject_stream_mappings"("subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_stream_mappings_stream_id_subject_id_key" ON "subject_stream_mappings"("stream_id", "subject_id");

-- CreateIndex
CREATE INDEX "subject_prerequisites_subject_id_idx" ON "subject_prerequisites"("subject_id");

-- CreateIndex
CREATE INDEX "subject_prerequisites_prerequisite_subject_id_idx" ON "subject_prerequisites"("prerequisite_subject_id");

-- CreateIndex
CREATE UNIQUE INDEX "subject_prerequisites_subject_id_prerequisite_subject_id_key" ON "subject_prerequisites"("subject_id", "prerequisite_subject_id");

-- CreateIndex
CREATE INDEX "timetables_schoolId_idx" ON "timetables"("schoolId");

-- CreateIndex
CREATE INDEX "timetables_className_idx" ON "timetables"("className");

-- CreateIndex
CREATE INDEX "timetables_teacherId_idx" ON "timetables"("teacherId");

-- CreateIndex
CREATE INDEX "timetables_dayOfWeek_period_className_idx" ON "timetables"("dayOfWeek", "period", "className");

-- CreateIndex
CREATE INDEX "timetable_approvals_coordinatorId_idx" ON "timetable_approvals"("coordinatorId");

-- CreateIndex
CREATE INDEX "timetable_approvals_directorId_idx" ON "timetable_approvals"("directorId");

-- CreateIndex
CREATE INDEX "timetable_approvals_status_idx" ON "timetable_approvals"("status");

-- CreateIndex
CREATE INDEX "assignments_schoolId_idx" ON "assignments"("schoolId");

-- CreateIndex
CREATE INDEX "assignments_subjectId_idx" ON "assignments"("subjectId");

-- CreateIndex
CREATE INDEX "assignments_teacherId_idx" ON "assignments"("teacherId");

-- CreateIndex
CREATE INDEX "assignments_due_date_idx" ON "assignments"("due_date");

-- CreateIndex
CREATE INDEX "assignments_status_idx" ON "assignments"("status");

-- CreateIndex
CREATE INDEX "assignment_submissions_assignmentId_idx" ON "assignment_submissions"("assignmentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_studentId_idx" ON "assignment_submissions"("studentId");

-- CreateIndex
CREATE INDEX "assignment_submissions_status_idx" ON "assignment_submissions"("status");

-- CreateIndex
CREATE INDEX "assignment_submissions_submitted_at_idx" ON "assignment_submissions"("submitted_at");

-- CreateIndex
CREATE UNIQUE INDEX "assignment_submissions_assignmentId_studentId_attempt_numbe_key" ON "assignment_submissions"("assignmentId", "studentId", "attempt_number");

-- CreateIndex
CREATE INDEX "grades_studentId_idx" ON "grades"("studentId");

-- CreateIndex
CREATE INDEX "grades_subjectId_idx" ON "grades"("subjectId");

-- CreateIndex
CREATE INDEX "grades_term_id_academic_year_idx" ON "grades"("term_id", "academic_year");

-- CreateIndex
CREATE INDEX "grades_assessment_date_idx" ON "grades"("assessment_date");

-- CreateIndex
CREATE INDEX "attendance_studentId_idx" ON "attendance"("studentId");

-- CreateIndex
CREATE INDEX "attendance_date_idx" ON "attendance"("date");

-- CreateIndex
CREATE INDEX "attendance_status_idx" ON "attendance"("status");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_studentId_date_period_key" ON "attendance"("studentId", "date", "period");

-- CreateIndex
CREATE INDEX "resource_folders_schoolId_idx" ON "resource_folders"("schoolId");

-- CreateIndex
CREATE INDEX "resource_folders_parentId_idx" ON "resource_folders"("parentId");

-- CreateIndex
CREATE INDEX "resources_schoolId_idx" ON "resources"("schoolId");

-- CreateIndex
CREATE INDEX "resources_folderId_idx" ON "resources"("folderId");

-- CreateIndex
CREATE INDEX "file_uploads_schoolId_idx" ON "file_uploads"("schoolId");

-- CreateIndex
CREATE INDEX "file_uploads_entity_type_entity_id_idx" ON "file_uploads"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "file_uploads_uploaded_by_idx" ON "file_uploads"("uploaded_by");

-- CreateIndex
CREATE INDEX "messages_from_user_id_idx" ON "messages"("from_user_id");

-- CreateIndex
CREATE INDEX "messages_to_user_id_idx" ON "messages"("to_user_id");

-- CreateIndex
CREATE INDEX "messages_school_id_idx" ON "messages"("school_id");

-- CreateIndex
CREATE INDEX "messages_message_type_idx" ON "messages"("message_type");

-- CreateIndex
CREATE INDEX "messages_created_at_idx" ON "messages"("created_at");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "notifications_school_id_idx" ON "notifications"("school_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_is_global_idx" ON "notifications"("is_global");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "announcements_schoolId_idx" ON "announcements"("schoolId");

-- CreateIndex
CREATE INDEX "announcements_status_idx" ON "announcements"("status");

-- CreateIndex
CREATE INDEX "announcements_publish_at_idx" ON "announcements"("publish_at");

-- CreateIndex
CREATE INDEX "parent_communications_studentId_idx" ON "parent_communications"("studentId");

-- CreateIndex
CREATE INDEX "parent_communications_initiated_by_idx" ON "parent_communications"("initiated_by");

-- CreateIndex
CREATE INDEX "parent_communications_status_idx" ON "parent_communications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");

-- CreateIndex
CREATE INDEX "invoices_school_id_idx" ON "invoices"("school_id");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "invoices_billing_period_idx" ON "invoices"("billing_period");

-- CreateIndex
CREATE INDEX "invoices_created_at_idx" ON "invoices"("created_at");

-- CreateIndex
CREATE INDEX "student_fees_school_id_idx" ON "student_fees"("school_id");

-- CreateIndex
CREATE INDEX "student_fees_student_id_idx" ON "student_fees"("student_id");

-- CreateIndex
CREATE INDEX "student_fees_status_idx" ON "student_fees"("status");

-- CreateIndex
CREATE UNIQUE INDEX "school_payment_configs_school_id_key" ON "school_payment_configs"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_fee_online_payments_reference_key" ON "student_fee_online_payments"("reference");

-- CreateIndex
CREATE INDEX "student_fee_online_payments_reference_idx" ON "student_fee_online_payments"("reference");

-- CreateIndex
CREATE INDEX "student_performance_metrics_studentId_idx" ON "student_performance_metrics"("studentId");

-- CreateIndex
CREATE INDEX "student_performance_metrics_schoolId_idx" ON "student_performance_metrics"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "student_performance_metrics_studentId_termId_key" ON "student_performance_metrics"("studentId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "student_attendance_patterns_studentId_key" ON "student_attendance_patterns"("studentId");

-- CreateIndex
CREATE INDEX "student_alerts_studentId_idx" ON "student_alerts"("studentId");

-- CreateIndex
CREATE INDEX "student_alerts_alert_type_idx" ON "student_alerts"("alert_type");

-- CreateIndex
CREATE INDEX "student_alerts_status_idx" ON "student_alerts"("status");

-- CreateIndex
CREATE INDEX "student_alerts_created_at_idx" ON "student_alerts"("created_at");

-- CreateIndex
CREATE INDEX "calendar_events_schoolId_idx" ON "calendar_events"("schoolId");

-- CreateIndex
CREATE INDEX "calendar_events_start_date_idx" ON "calendar_events"("start_date");

-- CreateIndex
CREATE INDEX "calendar_events_event_type_idx" ON "calendar_events"("event_type");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "system_settings_category_idx" ON "system_settings"("category");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_school_id_key" ON "system_settings"("key", "school_id");

-- CreateIndex
CREATE INDEX "coordinator_reports_coordinatorId_idx" ON "coordinator_reports"("coordinatorId");

-- CreateIndex
CREATE INDEX "coordinator_reports_reportType_idx" ON "coordinator_reports"("reportType");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_profiles" ADD CONSTRAINT "parent_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "parent_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_student_links" ADD CONSTRAINT "parent_student_links_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_permissions" ADD CONSTRAINT "admin_permissions_admin_profile_id_fkey" FOREIGN KEY ("admin_profile_id") REFERENCES "admin_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_class_coordinators" ADD CONSTRAINT "teacher_class_coordinators_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_class_coordinators" ADD CONSTRAINT "teacher_class_coordinators_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_terms" ADD CONSTRAINT "academic_terms_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "teacher_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_subjects" ADD CONSTRAINT "teacher_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_subject_selections" ADD CONSTRAINT "student_subject_selections_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_selected_subjects" ADD CONSTRAINT "student_selected_subjects_selection_id_fkey" FOREIGN KEY ("selection_id") REFERENCES "student_subject_selections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_selected_subjects" ADD CONSTRAINT "student_selected_subjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_selection_history" ADD CONSTRAINT "subject_selection_history_selection_id_fkey" FOREIGN KEY ("selection_id") REFERENCES "student_subject_selections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_streams" ADD CONSTRAINT "subject_streams_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_stream_mappings" ADD CONSTRAINT "subject_stream_mappings_stream_id_fkey" FOREIGN KEY ("stream_id") REFERENCES "subject_streams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_stream_mappings" ADD CONSTRAINT "subject_stream_mappings_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_prerequisites" ADD CONSTRAINT "subject_prerequisites_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subject_prerequisites" ADD CONSTRAINT "subject_prerequisites_prerequisite_subject_id_fkey" FOREIGN KEY ("prerequisite_subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetables" ADD CONSTRAINT "timetables_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_approvals" ADD CONSTRAINT "timetable_approvals_timetableId_fkey" FOREIGN KEY ("timetableId") REFERENCES "timetables"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_approvals" ADD CONSTRAINT "timetable_approvals_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timetable_approvals" ADD CONSTRAINT "timetable_approvals_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grades" ADD CONSTRAINT "grades_term_id_fkey" FOREIGN KEY ("term_id") REFERENCES "academic_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_marked_by_fkey" FOREIGN KEY ("marked_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_folders" ADD CONSTRAINT "resource_folders_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_folders" ADD CONSTRAINT "resource_folders_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "resource_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_folders" ADD CONSTRAINT "resource_folders_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resources" ADD CONSTRAINT "resources_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "resource_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parent_communications" ADD CONSTRAINT "parent_communications_initiated_by_fkey" FOREIGN KEY ("initiated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_cancelled_by_fkey" FOREIGN KEY ("cancelled_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fees" ADD CONSTRAINT "student_fees_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_payments" ADD CONSTRAINT "student_fee_payments_student_fee_id_fkey" FOREIGN KEY ("student_fee_id") REFERENCES "student_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_payment_configs" ADD CONSTRAINT "school_payment_configs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_fee_online_payments" ADD CONSTRAINT "student_fee_online_payments_student_fee_id_fkey" FOREIGN KEY ("student_fee_id") REFERENCES "student_fees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_performance_metrics" ADD CONSTRAINT "student_performance_metrics_termId_fkey" FOREIGN KEY ("termId") REFERENCES "academic_terms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance_patterns" ADD CONSTRAINT "student_attendance_patterns_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_attendance_patterns" ADD CONSTRAINT "student_attendance_patterns_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_alerts" ADD CONSTRAINT "student_alerts_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_alerts" ADD CONSTRAINT "student_alerts_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_alerts" ADD CONSTRAINT "student_alerts_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_alerts" ADD CONSTRAINT "student_alerts_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_events" ADD CONSTRAINT "calendar_events_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_reports" ADD CONSTRAINT "coordinator_reports_coordinatorId_fkey" FOREIGN KEY ("coordinatorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
