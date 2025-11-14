'use client'
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  User,
  Phone,
  Mail,
  AlertTriangle,
  MessageSquare,
  Eye,
  Loader2,
  RefreshCw,
  Download
} from 'lucide-react';

const ClassTeacherStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [assignedClasses, setAssignedClasses] = useState([]);

  useEffect(() => {
    fetchStudents();
  }, [sortBy]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/protected/teacher/class/students', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data.students || []);
        setAssignedClasses(data.data.assignedClasses || []);
      } else {
        throw new Error(data.error || 'Failed to load students');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch students error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const response = await fetch(`/api/protected/teacher/class/performance?studentId=${studentId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      
      if (data.success) {
        setSelectedStudent(data.data.student);
        setShowStudentModal(true);
      } else {
        throw new Error(data.error || 'Failed to load student details');
      }
    } catch (err) {
      console.error('Fetch student details error:', err);
      alert('Failed to load student details: ' + err.message);
    }
  };

  const createAlert = async (studentId, alertType) => {
    try {
      const message = prompt(`Enter a message for this ${alertType.replace(/_/g, ' ')} alert:`);
      if (!message) return;

      const response = await fetch('/api/protected/teacher/class/performance', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          alertType,
          message,
          priority: alertType.includes('urgent') ? 'high' : 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      alert('Alert created successfully');
      fetchStudents();
    } catch (err) {
      console.error('Create alert error:', err);
      alert('Failed to create alert: ' + err.message);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case 'studentId':
        return (a.profile?.studentId || '').localeCompare(b.profile?.studentId || '');
      case 'performance':
        return (b.performance?.overallAverage || 0) - (a.performance?.overallAverage || 0);
      case 'attendance':
        return (b.performance?.attendanceRate || 0) - (a.performance?.attendanceRate || 0);
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Students</h2>
            <p className="text-sm text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Students</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchStudents}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Students</h1>
              <p className="text-gray-600 mt-1">
                Managing {assignedClasses.join(', ')} • {sortedStudents.length} students
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchStudents}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="studentId">Sort by Student ID</option>
                <option value="performance">Sort by Performance</option>
                <option value="attendance">Sort by Attendance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStudents.map((student) => (
            <div key={student.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                    {student.avatar ? (
                      <img
                        src={student.avatar}
                        alt={`${student.firstName} ${student.lastName}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {student.profile?.className} • ID: {student.profile?.studentId || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div className="space-y-2 mb-4">
                {student.profile?.parentName && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Parent: {student.profile.parentName}</span>
                  </div>
                )}
                
                {student.profile?.parentPhone && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Phone className="w-4 h-4" />
                    <span>{student.profile.parentPhone}</span>
                  </div>
                )}
                
                {student.profile?.parentEmail && (
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    <span className="truncate">{student.profile.parentEmail}</span>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {student.performance?.attendanceRate || 0}%
                  </div>
                  <div className="text-xs text-blue-600">Attendance</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-green-600">
                    {student.performance?.overallAverage || 0}%
                  </div>
                  <div className="text-xs text-green-600">Average</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchStudentDetails(student.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>View</span>
                </button>
                <button
                  onClick={() => window.location.href = `/protected/teacher/class/messages?recipientId=${student.id}`}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>

              {student.performance?.isAtRisk && (
                <button
                  onClick={() => createAlert(student.id, 'performance_concern')}
                  className="w-full mt-2 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Create Alert</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {sortedStudents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Try adjusting your search criteria.'
                : 'No students are assigned to your classes yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Student Details</h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {selectedStudent.avatar ? (
                    <img
                      src={selectedStudent.avatar}
                      alt=""
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-gray-600">
                    {selectedStudent.studentProfile?.className} • ID: {selectedStudent.studentProfile?.studentId}
                  </p>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedStudent.performance?.overallAverage || 0}%
                  </div>
                  <div className="text-sm text-blue-600">Overall Average</div>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedStudent.performance?.attendanceRate || 0}%
                  </div>
                  <div className="text-sm text-green-600">Attendance Rate</div>
                </div>
                <div className="bg-orange-50 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {selectedStudent.performance?.totalGrades || 0}
                  </div>
                  <div className="text-sm text-orange-600">Total Grades</div>
                </div>
              </div>

              {selectedStudent.studentProfile && (
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Parent/Guardian Information</h4>
                  <div className="space-y-2">
                    {selectedStudent.studentProfile.parentName && (
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{selectedStudent.studentProfile.parentName}</span>
                      </div>
                    )}
                    {selectedStudent.studentProfile.parentPhone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{selectedStudent.studentProfile.parentPhone}</span>
                      </div>
                    )}
                    {selectedStudent.studentProfile.parentEmail && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-700">{selectedStudent.studentProfile.parentEmail}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = `/protected/teacher/class/messages?recipientId=${selectedStudent.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Send Message
                </button>
                <button
                  onClick={() => {
                    setShowStudentModal(false);
                    createAlert(selectedStudent.id, 'parent_meeting');
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Schedule Meeting
                </button>
                <button
                  onClick={() => {
                    setShowStudentModal(false);
                    createAlert(selectedStudent.id, 'performance_concern');
                  }}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  Flag Concern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherStudents;