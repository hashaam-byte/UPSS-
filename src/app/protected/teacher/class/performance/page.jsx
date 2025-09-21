// /app/protected/teacher/class/performance/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Target,
  Calendar,
  BookOpen,
  MessageSquare,
  Phone,
  Mail,
  User,
  Filter,
  Search,
  Download,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Loader2
} from 'lucide-react';

const ClassTeacherPerformance = () => {
  const [studentsPerformance, setStudentsPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [sortBy, setSortBy] = useState('overall');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [performanceOverview, setPerformanceOverview] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
    fetchSubjects();
  }, [filterSubject, filterPerformance, sortBy]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterSubject !== 'all') params.append('subject', filterSubject);
      if (filterPerformance !== 'all') params.append('performance', filterPerformance);
      if (sortBy !== 'overall') params.append('sortBy', sortBy);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/protected/teacher/class/performance?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStudentsPerformance(data.data.students || []);
        setPerformanceOverview(data.data.overview || null);
      } else {
        throw new Error(data.error || 'Failed to load performance data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch performance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/protected/teacher/class/subjects');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubjects(data.data.subjects || []);
        }
      }
    } catch (err) {
      console.error('Fetch subjects error:', err);
    }
  };

  const fetchStudentDetail = async (studentId) => {
    try {
      const response = await fetch(`/api/protected/teacher/class/performance/${studentId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch student details');
      }

      const data = await response.json();
      
      if (data.success) {
        setSelectedStudent(data.data);
        setShowDetailModal(true);
      } else {
        throw new Error(data.error || 'Failed to load student details');
      }
    } catch (err) {
      console.error('Fetch student detail error:', err);
      alert('Failed to load student details: ' + err.message);
    }
  };

  const createAlert = async (studentId, alertType, title, description) => {
    try {
      const response = await fetch('/api/protected/teacher/class/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          studentId,
          alertType,
          title,
          description,
          priority: alertType.includes('urgent') ? 'high' : 'normal'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create alert');
      }

      alert('Alert created successfully');
      fetchPerformanceData(); // Refresh data
    } catch (err) {
      console.error('Create alert error:', err);
      alert('Failed to create alert: ' + err.message);
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (score) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 70) return 'bg-blue-50 border-blue-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'bg-orange-50 border-orange-200';
    return 'bg-red-50 border-red-200';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    if (trend === 'declining') return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 85) return 'text-blue-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredStudents = studentsPerformance.filter(student => {
    const matchesSearch = searchTerm === '' || 
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.profile?.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPerformance = filterPerformance === 'all' || 
      (filterPerformance === 'excellent' && student.performance.overallAverage >= 80) ||
      (filterPerformance === 'good' && student.performance.overallAverage >= 70 && student.performance.overallAverage < 80) ||
      (filterPerformance === 'average' && student.performance.overallAverage >= 60 && student.performance.overallAverage < 70) ||
      (filterPerformance === 'poor' && student.performance.overallAverage < 60) ||
      (filterPerformance === 'at_risk' && (student.performance.overallAverage < 50 || student.attendance.rate < 75));
    
    return matchesSearch && matchesPerformance;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Performance Data</h2>
            <p className="text-sm text-gray-600">Analyzing student performance...</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Performance Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
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
              <h1 className="text-3xl font-bold text-gray-900">Student Performance</h1>
              <p className="text-gray-600 mt-1">
                Monitoring academic progress • {filteredStudents.length} students
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/protected/teacher/class/reports?type=performance'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview */}
        {performanceOverview && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Class Average</p>
                  <p className={`text-3xl font-bold ${getPerformanceColor(performanceOverview.classAverage)}`}>
                    {performanceOverview.classAverage?.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Above 70%</p>
                  <p className="text-3xl font-bold text-green-600">
                    {performanceOverview.studentsAbove70}
                  </p>
                  <p className="text-xs text-gray-500">
                    {Math.round((performanceOverview.studentsAbove70 / filteredStudents.length) * 100)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">At Risk</p>
                  <p className="text-3xl font-bold text-red-600">
                    {performanceOverview.atRiskStudents}
                  </p>
                  <p className="text-xs text-gray-500">Below 50% or poor attendance</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
                  <p className={`text-3xl font-bold ${getAttendanceColor(performanceOverview.averageAttendance)}`}>
                    {performanceOverview.averageAttendance?.toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject.id} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div className="sm:w-48">
              <select
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Performance</option>
                <option value="excellent">Excellent (80%+)</option>
                <option value="good">Good (70-79%)</option>
                <option value="average">Average (60-69%)</option>
                <option value="poor">Poor (Below 60%)</option>
                <option value="at_risk">At Risk</option>
              </select>
            </div>

            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="overall">Sort by Overall</option>
                <option value="name">Sort by Name</option>
                <option value="attendance">Sort by Attendance</option>
                <option value="recent_grades">Sort by Recent Performance</option>
              </select>
            </div>
          </div>
        </div>

        {/* Students Performance Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredStudents.map((student) => (
            <div key={student.id} className={`bg-white rounded-2xl shadow-sm border p-6 hover:shadow-md transition-shadow ${getPerformanceBgColor(student.performance.overallAverage)}`}>
              {/* Student Header */}
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
                      {student.profile?.className} • ID: {student.profile?.studentId}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(student.performance.trend)}
                  <span className="text-xs text-gray-500">{student.performance.trend}</span>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getPerformanceColor(student.performance.overallAverage)}`}>
                    {student.performance.overallAverage?.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">Overall</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getAttendanceColor(student.attendance.rate)}`}>
                    {student.attendance.rate?.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600">Attendance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {student.performance.assignmentCompletion?.toFixed(0) || 0}%
                  </div>
                  <div className="text-xs text-gray-600">Assignments</div>
                </div>
              </div>

              {/* Subject Breakdown */}
              {student.performance.subjectBreakdown && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Subject Performance</h4>
                  <div className="space-y-1">
                    {student.performance.subjectBreakdown.slice(0, 3).map((subject) => (
                      <div key={subject.name} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700">{subject.name}</span>
                        <span className={`font-medium ${getPerformanceColor(subject.average)}`}>
                          {subject.average?.toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alert Indicators */}
              {student.alerts && student.alerts.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center space-x-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-orange-600" />
                    <span className="text-orange-600">
                      {student.alerts.length} active alert{student.alerts.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => fetchStudentDetail(student.id)}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <Eye className="w-4 h-4" />
                  <span>Details</span>
                </button>
                <button
                  onClick={() => window.location.href = `/protected/teacher/class/messages?recipientId=${student.id}`}
                  className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>

              {/* Alert Button for At-Risk Students */}
              {(student.performance.overallAverage < 50 || student.attendance.rate < 75) && (
                <button
                  onClick={() => createAlert(
                    student.id, 
                    'performance_concern', 
                    'Academic Support Needed',
                    `${student.firstName} ${student.lastName} requires attention due to low performance or attendance.`
                  )}
                  className="w-full mt-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Create Alert</span>
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredStudents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterSubject !== 'all' || filterPerformance !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No students are assigned to your class yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {showDetailModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Performance Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Student Info */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  {selectedStudent.avatar ? (
                    <img
                      src={selectedStudent.avatar}
                      alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
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
                    {selectedStudent.profile?.className} • ID: {selectedStudent.profile?.studentId}
                  </p>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>

              {/* Detailed Performance Charts and Data would go here */}
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Detailed performance analytics and charts would be displayed here.</p>
                <p className="text-sm mt-2">This would include subject-wise trends, grade history, and recommendations.</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={() => window.location.href = `/protected/teacher/class/messages?recipientId=${selectedStudent.id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Student</span>
                </button>
                {selectedStudent.profile?.parentPhone && (
                  <button
                    onClick={() => window.open(`tel:${selectedStudent.profile.parentPhone}`)}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Parent</span>
                  </button>
                )}
                <button
                  onClick={() => createAlert(selectedStudent.id, 'parent_meeting', 'Parent Meeting Request', 'Requesting a parent meeting to discuss academic progress.')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Schedule Meeting</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherPerformance;