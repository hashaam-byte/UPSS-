// /app/protected/teacher/class/performance/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  CheckCircle,
  Target,
  BookOpen,
  Calendar,
  MessageSquare,
  Filter,
  Download,
  Eye,
  Flag,
  User,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';

const ClassTeacherPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState('all'); // all, excellent, good, at_risk

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/protected/teacher/class/performance?period=${selectedPeriod}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch performance data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setPerformanceData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load performance data');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch performance data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (studentId, alertType) => {
    try {
      const message = prompt(`Enter details for this ${alertType} alert:`);
      if (!message) return;

      const response = await fetch('/api/protected/teacher/class/performance', {
        method: 'POST',
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
      fetchPerformanceData();
    } catch (err) {
      console.error('Create alert error:', err);
      alert('Failed to create alert: ' + err.message);
    }
  };

  const getPerformanceLevel = (average) => {
    if (average >= 85) return { level: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };
    if (average >= 70) return { level: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (average >= 60) return { level: 'average', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'at_risk', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  const filteredStudents = performanceData?.students?.filter(student => {
    if (filterLevel === 'all') return true;
    const performance = student.performance?.overallAverage || 0;
    const level = getPerformanceLevel(performance).level;
    return level === filterLevel;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-700">Loading performance data...</span>
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

  const classAnalytics = performanceData?.classAnalytics || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Performance</h1>
              <p className="text-gray-600 mt-1">
                Monitor and track student academic progress • {filteredStudents.length} students
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="current_term">Current Term</option>
                <option value="last_term">Last Term</option>
                <option value="academic_year">Academic Year</option>
              </select>
              <button
                onClick={() => window.location.href = '/protected/teacher/class/reports?type=class_performance'}
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
        {/* Class Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Average</p>
                <p className="text-3xl font-bold text-gray-900">{classAnalytics.averagePerformance || 'N/A'}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">High Performers</p>
                <p className="text-3xl font-bold text-green-600">{classAnalytics.highPerformers || 0}</p>
                <p className="text-xs text-gray-500">≥85% average</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At Risk Students</p>
                <p className="text-3xl font-bold text-red-600">{classAnalytics.atRiskStudents || 0}</p>
                <p className="text-xs text-gray-500">&lt;60% average</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-purple-600">{classAnalytics.attendanceRate || 'N/A'}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Performance Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <span className="font-medium text-gray-700">Filter by performance level:</span>
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Students', color: 'bg-gray-100 text-gray-700' },
                { key: 'excellent', label: 'Excellent (≥85%)', color: 'bg-green-100 text-green-700' },
                { key: 'good', label: 'Good (70-84%)', color: 'bg-blue-100 text-blue-700' },
                { key: 'at_risk', label: 'At Risk (<60%)', color: 'bg-red-100 text-red-700' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterLevel(filter.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filterLevel === filter.key
                      ? filter.color + ' shadow-sm'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Student Performance List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Student Performance Overview</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student) => {
              const performance = student.performance || {};
              const overallAverage = performance.overallAverage || 0;
              const trend = performance.trend || 'stable';
              const performanceLevel = getPerformanceLevel(overallAverage);
              
              return (
                <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
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
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {student.firstName} {student.lastName}
                          </h4>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${performanceLevel.bg} ${performanceLevel.color}`}>
                            {performanceLevel.level.replace('_', ' ').toUpperCase()}
                          </span>
                          {getTrendIcon(trend)}
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Overall Average:</span>
                            <span className="font-medium ml-2">{overallAverage}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Attendance:</span>
                            <span className="font-medium ml-2">{performance.attendance?.rate || 'N/A'}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Assignments:</span>
                            <span className="font-medium ml-2">{performance.assignments?.submissionRate || 'N/A'}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Trend:</span>
                            <span className="font-medium ml-2 capitalize">{trend}</span>
                          </div>
                        </div>
                        
                        {/* Parent Contact Info */}
                        {student.profile && (
                          <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                            {student.profile.parentName && (
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{student.profile.parentName}</span>
                              </div>
                            )}
                            {student.profile.parentPhone && (
                              <div className="flex items-center space-x-1">
                                <Phone className="w-3 h-3" />
                                <span>{student.profile.parentPhone}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentModal(true);
                        }}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Details</span>
                      </button>
                      
                      {performanceLevel.level === 'at_risk' && (
                        <button
                          onClick={() => createAlert(student.id, 'performance_concern')}
                          className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center space-x-1"
                        >
                          <Flag className="w-4 h-4" />
                          <span>Alert</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => window.location.href = `/protected/teacher/class/messages?recipientId=${student.id}`}
                        className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center space-x-1"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Message</span>
                      </button>
                    </div>
                  </div>

                  {/* Performance Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Academic Performance</span>
                      <span>{overallAverage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          overallAverage >= 85 ? 'bg-green-500' :
                          overallAverage >= 70 ? 'bg-blue-500' :
                          overallAverage >= 60 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(overallAverage, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {filterLevel !== 'all' 
                  ? `No students match the ${filterLevel.replace('_', ' ')} performance level.`
                  : 'No students assigned to your class yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Performance Details</h2>
                <button
                  onClick={() => setShowStudentModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Student performance details would go here */}
              <div className="text-center py-8 text-gray-500">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Detailed performance analytics for {selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-sm mt-2">Subject-wise breakdown, attendance history, and recommendations</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherPerformance;