// TypeScript Type Definitions for Subject Selection System
// UPSS Phase 1

export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN' | 'HEADADMIN';

export type TeacherRole = 'DIRECTOR' | 'COORDINATOR' | 'SUBJECT_TEACHER';

export type StreamType = 'SCIENCE' | 'ARTS' | 'COMMERCIAL';

export type ClassLevel = 'JS1' | 'JS2' | 'JS3' | 'SS1' | 'SS2' | 'SS3';

export type SubjectType = 'CORE' | 'SCIENCE' | 'ARTS' | 'COMMERCIAL' | 'VOCATIONAL' | 'ELECTIVE';

export type SelectionAction =
  | 'CREATED'
  | 'MODIFIED'
  | 'LOCKED'
  | 'UNLOCKED'
  | 'STREAM_CHANGED';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';

export type LevelSpecialization = 'JUNIOR' | 'SENIOR' | 'BOTH';

// ============================================================================
// SUBJECT SELECTION TYPES
// ============================================================================

export interface SubjectStream {
  id: string;
  schoolId: string;
  name: StreamType;
  displayName: string;
  description: string | null;
  classLevel: string;
  isActive: boolean;
  minimumElectives: number;
  maximumElectives: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subject {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  description: string | null;
  subjectType: SubjectType;
  classLevel: ClassLevel[];
  eligibleStreams: StreamType[];
  isElectiveOption: boolean;
  electiveGroup: string | null;
  maxStudents: number | null;
  creditHours: number | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubjectStreamMapping {
  id: string;
  streamId: string;
  subjectId: string;
  isCore: boolean;
  isElective: boolean;
  electiveGroup: string | null;
  position: number | null;
}

export interface StudentSubjectSelection {
  id: string;
  studentId: string;
  schoolId: string;
  classLevel: ClassLevel;
  stream: StreamType | null;
  isLocked: boolean;
  selectionComplete: boolean;
  lastModifiedBy: string | null;
  lastModifiedAt: Date | null;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentSelectedSubject {
  id: string;
  selectionId: string;
  subjectId: string;
  isCore: boolean;
  isElective: boolean;
  selectedAt: Date;
}

export interface SubjectSelectionHistory {
  id: string;
  selectionId: string;
  action: SelectionAction;
  previousStream: StreamType | null;
  newStream: StreamType | null;
  previousSubjects: unknown;
  newSubjects: unknown;
  modifiedBy: string;
  modifiedByRole: string;
  reason: string | null;
  timestamp: Date;
}

export interface SubjectPrerequisite {
  id: string;
  subjectId: string;
  prerequisiteSubjectId: string;
  isStrict: boolean;
}

// ============================================================================
// TEACHER ASSIGNMENT TYPES
// ============================================================================

export interface TeacherSubject {
  id: string;
  teacherId: string;
  subjectId: string;
  assignedAt: Date;
  assignedBy: string | null;
  isActive: boolean;
}

export interface TeacherClassSubjectAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  schoolId: string;
  assignedBy: string;
  isActive: boolean;
  assignedAt: Date;
}

// ============================================================================
// TIMETABLE TYPES
// ============================================================================

export interface StudentTimetableEntry {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  teacherId: string;
  dayOfWeek: DayOfWeek;
  period: number;
  startTime: string;
  endTime: string;
  roomNumber: string | null;
  academicYear: string;
  termName: string;
  isActive: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface SubjectSelectionRequest {
  stream?: StreamType;
  selectedSubjects: {
    subjectId: string;
    isCore: boolean;
    isElective: boolean;
  }[];
}

export interface SubjectSelectionResponse {
  success: boolean;
  message: string;
  selection?: StudentSubjectSelection;
  errors?: string[];
}

export interface AvailableSubjectsResponse {
  coreSubjects: Subject[];
  electiveSubjects: Subject[];
  electiveGroups: {
    [groupName: string]: Subject[];
  };
  stream: SubjectStream | null;
  selectionRules: {
    minimumElectives: number;
    maximumElectives: number;
  };
}

export interface StreamSelectionRequest {
  streamId: string;
}

export interface TeacherAssignmentRequest {
  teacherId: string;
  subjectIds: string[];
}

export interface ClassTeacherAssignmentRequest {
  classId: string;
  subjectId: string;
  teacherId: string;
}

export interface UnlockSelectionRequest {
  studentId: string;
  reason: string;
}

export interface ModifySelectionRequest {
  studentId: string;
  newStream?: StreamType;
  newSubjects: {
    subjectId: string;
    isCore: boolean;
    isElective: boolean;
  }[];
  reason: string;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SelectionProgress {
  coreCount: number;
  electiveCount: number;
  totalSelected: number;
  requiredElectives: number;
  requiredTotal: number;
  progress: number;
  isComplete: boolean;
}

export interface SelectionStatus {
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE_UNLOCKED' | 'COMPLETE_LOCKED';
  label: string;
  color: string;
  message: string;
}

export interface SelectionSummary {
  streamName: string | null;
  streamCode: StreamType | null;
  coreSubjects: {
    id: string;
    name: string;
    code: string;
  }[];
  electiveSubjects: {
    id: string;
    name: string;
    code: string;
  }[];
  totalSubjects: number;
  isLocked: boolean;
  isComplete: boolean;
  lastModified: Date | null;
}

// ============================================================================
// TEACHER WORKLOAD TYPES
// ============================================================================

export interface TeacherWorkload {
  totalAssignments: number;
  uniqueClasses: number;
  uniqueSubjects: number;
  assignments: TeacherClassSubjectAssignment[];
}

export interface SubjectStats {
  totalEnrolled: number;
  asCore: number;
  asElective: number;
}

// ============================================================================
// UI COMPONENT PROP TYPES
// ============================================================================

export interface StreamSelectorProps {
  streams: SubjectStream[];
  selectedStream: StreamType | null;
  onSelectStream: (stream: StreamType) => void;
  disabled?: boolean;
}

export interface SubjectSelectorProps {
  subjects: Subject[];
  selectedSubjects: string[];
  onToggleSubject: (subjectId: string) => void;
  disabled?: boolean;
  maxSelections?: number;
}

export interface SelectionProgressProps {
  progress: SelectionProgress;
  stream: SubjectStream | null;
}

export interface TimetablePreviewProps {
  entries: StudentTimetableEntry[];
  studentId: string;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface StreamDistribution {
  streamName: string;
  count: number;
  percentage: number;
}

export interface SubjectEnrollment {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalEnrolled: number;
  asCore: number;
  asElective: number;
  capacity: number | null;
  utilizationRate: number;
}

export interface ClassStreamAnalytics {
  classId: string;
  className: string;
  totalStudents: number;
  streamDistribution: StreamDistribution[];
  topElectives: {
    subjectId: string;
    subjectName: string;
    count: number;
  }[];
  pendingSelections: number;
}

// ============================================================================
// COORDINATOR DASHBOARD TYPES
// ============================================================================

export interface CoordinatorDashboardData {
  classInfo: {
    id: string;
    name: string;
    totalStudents: number;
  };
  streamDistribution: StreamDistribution[];
  subjectEnrollment: SubjectEnrollment[];
  pendingSelections: {
    studentId: string;
    studentName: string;
    status: string;
  }[];
  teacherAssignments: {
    subjectId: string;
    subjectName: string;
    teacherId: string | null;
    teacherName: string | null;
  }[];
}

// ============================================================================
// DIRECTOR DASHBOARD TYPES
// ============================================================================

export interface DirectorDashboardData {
  totalSubjects: number;
  activeSubjects: number;
  subjectsByType: {
    type: SubjectType;
    count: number;
  }[];
  subjectCoverage: {
    covered: number;
    uncovered: number;
    percentage: number;
  };
  popularElectives: {
    subjectId: string;
    subjectName: string;
    enrollmentCount: number;
  }[];
  streamEnrollment: {
    streamName: string;
    totalStudents: number;
  }[];
}

// ============================================================================
// ADMIN DASHBOARD TYPES
// ============================================================================

export interface AdminDashboardData {
  teacherSubjectAssignments: {
    teacherId: string;
    teacherName: string;
    subjects: {
      subjectId: string;
      subjectName: string;
    }[];
  }[];
  subjectsWithoutTeachers: {
    subjectId: string;
    subjectName: string;
    classLevel: ClassLevel[];
  }[];
  teacherWorkload: {
    teacherId: string;
    teacherName: string;
    workload: TeacherWorkload;
  }[];
}

// ============================================================================
// HISTORY ENTRY TYPE
// ============================================================================

export interface SelectionHistoryEntry {
  id: string;
  action: SelectionAction;
  previousStream: string | null;
  newStream: string | null;
  modifiedBy: string;
  modifiedByName: string;
  modifiedByRole: string;
  reason: string | null;
  timestamp: Date;
  changes: {
    addedSubjects?: string[];
    removedSubjects?: string[];
    streamChanged?: boolean;
  };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  field?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  errors?: ApiError[];
}

// ============================================================================
// QUERY PARAMS TYPES
// ============================================================================

export interface SubjectQueryParams {
  schoolId?: string;
  classLevel?: ClassLevel;
  streamType?: StreamType;
  subjectType?: SubjectType;
  isActive?: boolean;
  search?: string;
}

export interface StudentSelectionQueryParams {
  schoolId?: string;
  classId?: string;
  stream?: StreamType;
  isComplete?: boolean;
  isLocked?: boolean;
}

export interface TeacherAssignmentQueryParams {
  schoolId?: string;
  teacherId?: string;
  subjectId?: string;
  classId?: string;
  isActive?: boolean;
}
