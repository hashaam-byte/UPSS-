'use client';

import TeacherAssignmentManager from '@/Components/admin/TeacherAssignmentManager';

export default function TeacherAssignmentsPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <TeacherAssignmentManager />
      </div>
    </div>
  );
}