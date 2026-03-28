'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, AlertCircle, UserCheck, Lock, Unlock, TrendingUp } from 'lucide-react';

export default function CoordinatorClassManager() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, assignments, students
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assigningTeacher, setAssigningTeacher] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/teachers/coordinator/class/dashboard');
      const data = await response.json();

      if (data.success) {
        setDashboardData(data.data);
      } else {
        alert(data.error || 'Failed to load dashboard');
      }
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      alert('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = async (subjectId, teacherId) => {
    setAssigningTeacher(true);
    try {
      const response = await fetch(
        `/api/protected/teachers/coordinator/class/subjects/${subjectId}/assign-teacher`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ teacherId }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        setSelectedSubject(null);
        fetchDashboard(); // Refresh data
      } else {
        alert(data.error || 'Failed to assign teacher');
      }
    } catch (error) {
      alert('An error occurred');
    } finally {
      setAssigningTeacher(false);
    }
  };

  const getStreamColor = (stream) => {
    const colors = {
      SCIENCE: 'bg-blue-100 text-blue-700',
      ARTS: 'bg-purple-100 text-purple-700',
      COMMERCIAL: 'bg-green-100 text-green-700',
    };
    return colors[stream] || 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Class Assigned</h3>
        <p className="text-gray-600">Contact admin to assign you as coordinator for a class.</p>
      </div>
    );
  }

  const { class: classInfo, stats, streamDistribution, students, subjectAssignments, pendingSelections } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Class {classInfo.name}</h1>
            <p className="text-purple-100">
              Coordinator: {dashboardData.coordinator.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{stats.totalStudents}</p>
            <p className="text-purple-100">Students</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Selections</p>
              <p className="text-2xl font-bold text-green-600">{stats.studentsWithSelections}</p>
            </div>
            <UserCheck className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Selections</p>
              <p className="text-2xl font-bold text-orange-600">{stats.studentsWithoutSelections}</p>
            </div>
            <AlertCircle className="text-orange-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Teachers Assigned</p>
              <p className="text-2xl font-bold text-blue-600">{stats.subjectsAssigned}</p>
            </div>
            <Users className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Teachers</p>
              <p className="text-2xl font-bold text-red-600">{stats.subjectsNeedingTeacher}</p>
            </div>
            <BookOpen className="text-red-600" size={32} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <div className="flex gap-2 p-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'assignments'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Teacher Assignments
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-lg transition ${
                activeTab === 'students'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Students
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stream Distribution */}
              {streamDistribution.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Stream Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {streamDistribution.map((stat) => (
                      <div key={stat.stream} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStreamColor(stat.stream)}`}>
                            {stat.stream}
                          </span>
                          <span className="text-2xl font-bold text-gray-900">{stat.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${stat.percentage}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{stat.percentage}% of students</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Selections Alert */}
              {pendingSelections.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-orange-600 flex-shrink-0 mt-1" size={20} />
                    <div className="flex-1">
                      <h4 className="font-semibold text-orange-900 mb-2">
                        {pendingSelections.length} Students Need to Complete Subject Selection
                      </h4>
                      <div className="space-y-1">
                        {pendingSelections.slice(0, 5).map((student) => (
                          <p key={student.studentId} className="text-sm text-orange-800">
                            {student.studentName} ({student.studentIdNumber})
                            {!student.hasStarted && ' - Not started'}
                          </p>
                        ))}
                        {pendingSelections.length > 5 && (
                          <p className="text-sm text-orange-600 font-medium">
                            +{pendingSelections.length - 5} more
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Teacher Assignments</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subject</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Type</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Enrollment</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Assigned Teacher</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subjectAssignments.map((subject) => (
                      <tr key={subject.subjectId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{subject.subjectName}</p>
                            <p className="text-sm text-gray-500">{subject.subjectCode}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                            {subject.subjectType}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{subject.enrollmentCount} students</span>
                        </td>
                        <td className="px-4 py-3">
                          {subject.assignedTeacher ? (
                            <div>
                              <p className="font-medium text-gray-900">{subject.assignedTeacher.name}</p>
                              <p className="text-xs text-gray-500">{subject.assignedTeacher.employeeId}</p>
                            </div>
                          ) : subject.noTeachersAvailable ? (
                            <span className="text-sm text-red-600">No teachers available</span>
                          ) : (
                            <span className="text-sm text-orange-600">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {subject.availableTeachers.length > 0 && (
                            <button
                              onClick={() => setSelectedSubject(subject)}
                              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                            >
                              {subject.assignedTeacher ? 'Change' : 'Assign'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Students</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Student</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stream</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subjects</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600">{student.studentId}</span>
                        </td>
                        <td className="px-4 py-3">
                          {student.stream ? (
                            <span className={`text-xs px-2 py-1 rounded ${getStreamColor(student.stream)}`}>
                              {student.stream}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-700">{student.subjectCount || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {student.selectionComplete ? (
                              <>
                                <UserCheck className="text-green-600" size={16} />
                                <span className="text-sm text-green-600">Complete</span>
                                {student.selectionLocked && <Lock className="text-gray-400" size={14} />}
                              </>
                            ) : (
                              <>
                                <AlertCircle className="text-orange-600" size={16} />
                                <span className="text-sm text-orange-600">Pending</span>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teacher Assignment Modal */}
      {selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                Assign Teacher for {selectedSubject.subjectName}
              </h3>
            </div>
            <div className="p-6 space-y-3">
              {selectedSubject.availableTeachers.map((teacher) => (
                <button
                  key={teacher.id}
                  onClick={() => handleAssignTeacher(selectedSubject.subjectId, teacher.id)}
                  disabled={assigningTeacher}
                  className={`w-full text-left px-4 py-3 rounded-lg border-2 transition ${
                    selectedSubject.assignedTeacher?.id === teacher.id
                      ? 'border-purple-600 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300'
                  } disabled:opacity-50`}
                >
                  <p className="font-medium text-gray-900">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.employeeId}</p>
                </button>
              ))}
            </div>
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => setSelectedSubject(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}