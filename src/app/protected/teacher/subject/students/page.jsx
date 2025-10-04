// app/protected/teacher/subject/students/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function SubjectTeacherStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchQuery, selectedClass]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/students');
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchQuery) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentProfile?.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedClass !== 'all') {
      filtered = filtered.filter(student => 
        student.studentProfile?.className === selectedClass
      );
    }

    setFilteredStudents(filtered);
  };

  const getPerformanceColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBadge = (score) => {
    if (score >= 75) return { text: 'Excellent', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'Good', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Needs Help', color: 'bg-red-100 text-red-800' };
  };

  const handleSendMessage = async (studentId) => {
    console.log('Send message to student:', studentId);
  };

  const openDetailModal = (student) => {
    setSelectedStudent(student);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedStudent(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">My Students</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const renderStudentsList = (studentsList) => (
    <div className="grid gap-4">
      {studentsList.map((student) => {
        const performance = student.performance || { averageScore: 0, completionRate: 0, trend: 'stable' };
        const badge = getPerformanceBadge(performance.averageScore);
        
        return (
          <div key={student.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold">
                  {student.firstName[0]}{student.lastName[0]}
                </div>
                <div>
                  <h3 className="font-semibold">
                    {student.firstName} {student.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {student.studentProfile?.studentId} • {student.studentProfile?.className}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${getPerformanceColor(performance.averageScore)}`}>
                      {performance.averageScore}%
                    </span>
                    {performance.trend === 'improving' && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {performance.trend === 'declining' && (
                      <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${badge.color}`}>
                    {badge.text}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => openDetailModal(student)}
                    className="px-3 py-1 border rounded hover:bg-gray-50 text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleSendMessage(student.id)}
                    className="p-2 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {performance.completionRate}%
                </div>
                <div className="text-xs text-gray-600">Completion Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {performance.assignmentsSubmitted || 0}
                </div>
                <div className="text-xs text-gray-600">Assignments Done</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {performance.attendanceRate || 0}%
                </div>
                <div className="text-xs text-gray-600">Attendance</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Students</h1>
          <p className="text-gray-600">
            Manage and track your subject students' performance
          </p>
        </div>
        <div className="px-3 py-1 border rounded">
          <span className="font-semibold">{filteredStudents.length}</span> Students
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full px-3 py-2 border rounded-md"
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Classes</option>
          {classes.map((className) => (
            <option key={className} value={className}>
              {className}
            </option>
          ))}
        </select>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            All Students
          </button>
          <button
            onClick={() => setActiveTab('top')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'top' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Top Performers
          </button>
          <button
            onClick={() => setActiveTab('attention')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'attention' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Need Attention
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' && renderStudentsList(filteredStudents)}
      
      {activeTab === 'top' && renderStudentsList(
        filteredStudents.filter(student => (student.performance?.averageScore || 0) >= 75)
      )}
      
      {activeTab === 'attention' && renderStudentsList(
        filteredStudents.filter(student => (student.performance?.averageScore || 0) < 60)
      )}

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Student Details</h2>
              <button onClick={closeDetailModal} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Student Info */}
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <p className="text-gray-600">
                  {selectedStudent.studentProfile?.studentId} • {selectedStudent.studentProfile?.className}
                </p>
                <p className="text-sm text-gray-500">{selectedStudent.email}</p>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white border rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {selectedStudent.performance?.averageScore || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Average Score</p>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {selectedStudent.performance?.completionRate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    {selectedStudent.performance?.assignmentsSubmitted || 0}
                  </div>
                  <p className="text-sm text-gray-600">Assignments Submitted</p>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {selectedStudent.performance?.missedAssignments || 0}
                  </div>
                  <p className="text-sm text-gray-600">Missed Assignments</p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Recent Activity</h4>
              <div className="space-y-3">
                {(selectedStudent.recentActivity || []).map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div>
                        <p className="font-medium">{activity.title}</p>
                        <p className="text-sm text-gray-600">{activity.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{activity.score}%</p>
                      <p className="text-xs text-gray-600">{activity.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Send Message
              </button>
              <button className="flex-1 px-4 py-2 border rounded hover:bg-gray-50">
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}