// Subject Selection Helper Functions
// UPSS Phase 1 - Utility Functions for Subject Selection System


/**
 * Determines if a class level is Junior Secondary
 */
export const isJuniorSecondary = (classLevel) => {
  return ['JS1', 'JS2', 'JS3'].includes(classLevel);
};

/**
 * Determines if a class level is Senior Secondary
 */
export const isSeniorSecondary = (classLevel) => {
  return ['SS1', 'SS2', 'SS3'].includes(classLevel);
};

/**
 * Get stream display name
 */
export const getStreamDisplayName = (streamCode) => {
  const streamNames = {
    SCIENCE: 'Science Stream',
    ARTS: 'Arts Stream',
    COMMERCIAL: 'Commercial Stream',
  };
  return streamNames[streamCode] || streamCode;
};

/**
 * Get stream description
 */
export const getStreamDescription = (streamCode) => {
  const descriptions = {
    SCIENCE:
      'For students interested in natural sciences, engineering, medicine, and technology fields',
    ARTS: 'For students interested in humanities, languages, creative fields, and social sciences',
    COMMERCIAL:
      'For students interested in business, economics, commerce, and entrepreneurship',
  };
  return descriptions[streamCode] || '';
};

/**
 * Get stream icon/color
 */
export const getStreamColor = (streamCode) => {
  const colors = {
    SCIENCE: 'blue',
    ARTS: 'purple',
    COMMERCIAL: 'green',
  };
  return colors[streamCode] || 'gray';
};

/**
 * Validate subject selection for a stream
 */
export const validateSubjectSelection = (stream, selectedSubjects, availableSubjects) => {
  const errors = [];
  const warnings = [];

  // Check minimum electives
  const electiveCount = selectedSubjects.filter((s) => s.isElective).length;

  if (stream.minimumElectives && electiveCount < stream.minimumElectives) {
    errors.push(`You must select at least ${stream.minimumElectives} elective subjects`);
  }

  // Check maximum electives
  if (stream.maximumElectives && electiveCount > stream.maximumElectives) {
    errors.push(`You can select a maximum of ${stream.maximumElectives} elective subjects`);
  }

  // Check for duplicate subjects
  const subjectIds = selectedSubjects.map((s) => s.subjectId);
  const duplicates = subjectIds.filter((id, index) => subjectIds.indexOf(id) !== index);
  
  if (duplicates.length > 0) {
    errors.push('You have selected duplicate subjects');
  }

  // Check prerequisites (if implemented)
  // This can be expanded based on SubjectPrerequisite model

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Get core subjects for a stream
 */
export const getCoreSubjects = (streamMappings, subjects) => {
  const coreSubjectIds = streamMappings
    .filter((mapping) => mapping.isCore)
    .map((mapping) => mapping.subjectId);

  return subjects.filter((subject) => coreSubjectIds.includes(subject.id));
};

/**
 * Get elective subjects for a stream
 */
export const getElectiveSubjects = (streamMappings, subjects) => {
  const electiveSubjectIds = streamMappings
    .filter((mapping) => mapping.isElective)
    .map((mapping) => mapping.subjectId);

  return subjects.filter((subject) => electiveSubjectIds.includes(subject.id));
};

/**
 * Group electives by their elective group
 */
export const groupElectives = (electiveSubjects, streamMappings) => {
  const groups = {};

  electiveSubjects.forEach((subject) => {
    const mapping = streamMappings.find((m) => m.subjectId === subject.id);
    const groupName = mapping?.electiveGroup || 'default';

    if (!groups[groupName]) {
      groups[groupName] = [];
    }

    groups[groupName].push({
      ...subject,
      electiveGroup: groupName,
    });
  });

  return groups;
};

/**
 * Calculate selection progress
 */
export const calculateSelectionProgress = (stream, selectedSubjects, totalRequired) => {
  const coreCount = selectedSubjects.filter((s) => s.isCore).length;
  const electiveCount = selectedSubjects.filter((s) => s.isElective).length;
  const totalSelected = selectedSubjects.length;

  const requiredElectives = stream.minimumElectives || 0;
  const requiredTotal = totalRequired || 0;

  const progress = requiredTotal > 0 ? (totalSelected / requiredTotal) * 100 : 0;

  return {
    coreCount,
    electiveCount,
    totalSelected,
    requiredElectives,
    requiredTotal,
    progress: Math.min(progress, 100),
    isComplete: totalSelected >= requiredTotal && electiveCount >= requiredElectives,
  };
};

/**
 * Format selection for display
 */
export const formatSelectionSummary = (selection, subjects, stream) => {
  if (!selection) return null;

  const selectedSubjectIds = selection.subjects.map((s) => s.subjectId);
  const selectedSubjectDetails = subjects.filter((s) => selectedSubjectIds.includes(s.id));

  const core = selectedSubjectDetails.filter((s) =>
    selection.subjects.find((ss) => ss.subjectId === s.id && ss.isCore)
  );

  const electives = selectedSubjectDetails.filter((s) =>
    selection.subjects.find((ss) => ss.subjectId === s.id && ss.isElective)
  );

  return {
    streamName: stream ? getStreamDisplayName(selection.stream) : null,
    streamCode: selection.stream,
    coreSubjects: core.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    electiveSubjects: electives.map((s) => ({ id: s.id, name: s.name, code: s.code })),
    totalSubjects: selectedSubjectDetails.length,
    isLocked: selection.isLocked,
    isComplete: selection.selectionComplete,
    lastModified: selection.lastModifiedAt,
  };
};

/**
 * Check if student can modify selection
 */
export const canModifySelection = (selection, userRole) => {
  // Students can only modify if not locked
  if (userRole === 'STUDENT') {
    return !selection.isLocked;
  }

  // Coordinators and Directors can always modify
  if (userRole === 'COORDINATOR' || userRole === 'DIRECTOR') {
    return true;
  }

  return false;
};

/**
 * Get selection status display
 */
export const getSelectionStatus = (selection) => {
  if (!selection) {
    return {
      status: 'NOT_STARTED',
      label: 'Not Started',
      color: 'gray',
      message: 'You have not started your subject selection',
    };
  }

  if (selection.selectionComplete && selection.isLocked) {
    return {
      status: 'COMPLETE_LOCKED',
      label: 'Complete & Locked',
      color: 'green',
      message: 'Your subject selection is complete and locked',
    };
  }

  if (selection.selectionComplete && !selection.isLocked) {
    return {
      status: 'COMPLETE_UNLOCKED',
      label: 'Complete',
      color: 'blue',
      message: 'Your selection is complete but not yet locked',
    };
  }

  return {
    status: 'IN_PROGRESS',
    label: 'In Progress',
    color: 'yellow',
    message: 'Please complete your subject selection',
  };
};

/**
 * Generate selection history entry
 */
export const createSelectionHistoryEntry = (
  selectionId,
  action,
  previousData,
  newData,
  modifiedBy,
  modifiedByRole,
  reason = null
) => {
  return {
    selectionId,
    action, // CREATED, MODIFIED, LOCKED, UNLOCKED, STREAM_CHANGED
    previousStream: previousData?.stream || null,
    newStream: newData?.stream || null,
    previousSubjects: previousData?.subjects || null,
    newSubjects: newData?.subjects || null,
    modifiedBy,
    modifiedByRole,
    reason,
    timestamp: new Date(),
  };
};

/**
 * Check teacher qualification for subject
 */
export const isTeacherQualifiedForSubject = (teacher, subject) => {
  // Check level specialization
  const subjectLevels = subject.classLevel || [];
  const isJSSubject = subjectLevels.some((level) => isJuniorSecondary(level));
  const isSSSubject = subjectLevels.some((level) => isSeniorSecondary(level));

  if (teacher.levelSpecialization === 'JUNIOR' && !isJSSubject) {
    return false;
  }

  if (teacher.levelSpecialization === 'SENIOR' && !isSSSubject) {
    return false;
  }

  // Check stream eligibility
  const subjectStreams = subject.eligibleStreams || [];
  const teacherStreams = teacher.canTeachStreams || [];

  if (subjectStreams.length > 0) {
    const hasMatchingStream = subjectStreams.some((stream) => teacherStreams.includes(stream));
    if (!hasMatchingStream) {
      return false;
    }
  }

  return true;
};

/**
 * Get available teachers for subject in a class
 */
export const getAvailableTeachersForSubject = (
  subjectId,
  teacherSubjectAssignments,
  allTeachers
) => {
  const assignedTeacherIds = teacherSubjectAssignments
    .filter((assignment) => assignment.subjectId === subjectId && assignment.isActive)
    .map((assignment) => assignment.teacherId);

  return allTeachers.filter((teacher) => assignedTeacherIds.includes(teacher.id));
};

/**
 * Calculate teacher workload
 */
export const calculateTeacherWorkload = (teacherId, classSubjectAssignments) => {
  const assignments = classSubjectAssignments.filter(
    (assignment) => assignment.teacherId === teacherId && assignment.isActive
  );

  const uniqueClasses = new Set(assignments.map((a) => a.classId)).size;
  const uniqueSubjects = new Set(assignments.map((a) => a.subjectId)).size;
  const totalAssignments = assignments.length;

  return {
    totalAssignments,
    uniqueClasses,
    uniqueSubjects,
    assignments,
  };
};

/**
 * Format class level for display
 */
export const formatClassLevel = (classLevel) => {
  const levels = {
    JS1: 'Junior Secondary 1',
    JS2: 'Junior Secondary 2',
    JS3: 'Junior Secondary 3',
    SS1: 'Senior Secondary 1',
    SS2: 'Senior Secondary 2',
    SS3: 'Senior Secondary 3',
  };
  return levels[classLevel] || classLevel;
};

/**
 * Get student's eligible streams based on class level
 */
export const getEligibleStreams = (classLevel) => {
  if (isSeniorSecondary(classLevel)) {
    return ['SCIENCE', 'ARTS', 'COMMERCIAL'];
  }
  return []; // JS students don't select streams yet
};

/**
 * Check if selection is within time window (if you want to implement deadlines)
 */
export const isWithinSelectionWindow = (startDate, endDate) => {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return now >= start && now <= end;
};

/**
 * Subject type color coding
 */
export const getSubjectTypeColor = (subjectType) => {
  const colors = {
    CORE: 'slate',
    SCIENCE: 'blue',
    ARTS: 'purple',
    COMMERCIAL: 'green',
    VOCATIONAL: 'orange',
    ELECTIVE: 'cyan',
  };
  return colors[subjectType] || 'gray';
};

/**
 * Day of week helpers for timetable
 */
export const DAYS_OF_WEEK = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];

export const formatDayOfWeek = (day) => {
  return day.charAt(0) + day.slice(1).toLowerCase();
};

/**
 * Time formatting for timetable
 */
export const formatTime = (time) => {
  // Assuming time is in "HH:MM" format
  return time;
};

export const parseTime = (timeString) => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return { hours, minutes };
};

/**
 * Check for timetable conflicts
 */
export const hasTimeConflict = (entry1, entry2) => {
  return (
    entry1.dayOfWeek === entry2.dayOfWeek &&
    entry1.period === entry2.period &&
    entry1.academicYear === entry2.academicYear &&
    entry1.termName === entry2.termName
  );
};

/**
 * Sort subjects for display
 */
export const sortSubjects = (subjects, sortBy = 'name') => {
  const sorted = [...subjects];

  switch (sortBy) {
    case 'name':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'code':
      return sorted.sort((a, b) => a.code.localeCompare(b.code));
    case 'type':
      return sorted.sort((a, b) => a.subjectType.localeCompare(b.subjectType));
    default:
      return sorted;
  }
};

/**
 * Get subject statistics
 */
export const getSubjectStats = (subjectId, studentSelections) => {
  const selectionsForSubject = studentSelections.filter((selection) =>
    selection.subjects.some((s) => s.subjectId === subjectId)
  );

  return {
    totalEnrolled: selectionsForSubject.length,
    asCore: selectionsForSubject.filter((sel) =>
      sel.subjects.find((s) => s.subjectId === subjectId && s.isCore)
    ).length,
    asElective: selectionsForSubject.filter((sel) =>
      sel.subjects.find((s) => s.subjectId === subjectId && s.isElective)
    ).length,
  };
};

export default {
  isJuniorSecondary,
  isSeniorSecondary,
  getStreamDisplayName,
  getStreamDescription,
  getStreamColor,
  validateSubjectSelection,
  getCoreSubjects,
  getElectiveSubjects,
  groupElectives,
  calculateSelectionProgress,
  formatSelectionSummary,
  canModifySelection,
  getSelectionStatus,
  createSelectionHistoryEntry,
  isTeacherQualifiedForSubject,
  getAvailableTeachersForSubject,
  calculateTeacherWorkload,
  formatClassLevel,
  getEligibleStreams,
  isWithinSelectionWindow,
  getSubjectTypeColor,
  DAYS_OF_WEEK,
  formatDayOfWeek,
  formatTime,
  parseTime,
  hasTimeConflict,
  sortSubjects,
  getSubjectStats,
};
