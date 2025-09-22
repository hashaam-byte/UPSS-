// /app/protected/student/subjects/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  User,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  FileText,
  Award,
  AlertTriangle,
  Eye,
  Calendar,
  BarChart3,
  CheckCircle2,
  Loader2
} from 'lucide-react';

const StudentSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/protected/student/subjects');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch subjects: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubjects(data.data.subjects || []);
      } else {
        throw new Error(data.error || 'Failed to load subjects');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch subjects error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (average) => {
    if (average >= 85) return 'text-green-600';
    if (average >= 70) return 'text-blue-600';
    if (average >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBg = (average) => {
    if (average >= 85) return 'bg-green-100';
    if (average >= 70) return 'bg-blue-100';
    if (average >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading your subjects...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Subjects</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubjects}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
              <p className="text-gray-600 mt-1">
                Track your performance across all enrolled subjects • {subjects.length} subjects
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/protected/student/performance'}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>View Performance</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subject Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{subjects.length}</div>
              <div className="text-sm text-gray-600">Total Subjects</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {subjects.filter(s => s.performance?.currentAverage >= 85).length}
              </div>
              <div className="text-sm text-gray-600">Excellent (≥85%)</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {subjects.filter(s => s.performance?.currentAverage >= 70 && s.performance?.currentAverage < 85).length}
              </div>
              <div className="text-sm text-gray-600">Good (70-84%)</div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {subjects.filter(s => s.performance?.currentAverage < 60).length}
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
          </div>
        </div>

        {/* Subjects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject) => {
            const performance = subject.performance || {};
            const currentAverage = performance.currentAverage || 0;
            const trend = performance.trend || 'stable';
            
            return (
              <div key={subject.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                {/* Subject Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getPerformanceBg(currentAverage)}`}>
                      <BookOpen className={`w-6 h-6 ${getPerformanceColor(currentAverage)}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </div>
                  {getTrendIcon(trend)}
                </div>

                {/* Performance Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className={`text-2xl font-bold ${getPerformanceColor(currentAverage)}`}>
                      {currentAverage}%
                    </div>
                    <div className="text-xs text-gray-600">Current Average</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900">
                      {performance.completedAssignments || 0}
                    </div>
                    <div className="text-xs text-gray-600">Assignments Done</div>
                  </div>
                </div>

                {/* Teacher & Schedule Info */}
                <div className="space-y-2 mb-4 text-sm text-gray-600">
                  {subject.teacher && (
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4" />
                      <span>{subject.teacher.name}</span>
                    </div>
                  )}
                  {subject.schedule && (
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4" />
                      <span>{subject.schedule}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4" />
                    <span>Category: {subject.category || 'General'}</span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                  <span>{performance.totalAssessments || 0} assessments</span>
                  <span>{performance.attendanceRate || 0}% attendance</span>
                  <span className="capitalize">{trend} trend</span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setSelectedSubject(subject);
                      setShowDetailModal(true);
                    }}
                    className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Details</span>
                  </button>
                  <button
                    onClick={() => window.location.href = `/protected/student/assignments?subject=${subject.id}`}
                    className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Assignments</span>
                  </button>
                </div>

                {/* Performance Indicator */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                    <span>Performance Level</span>
                    <span>{currentAverage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        currentAverage >= 85 ? 'bg-green-500' :
                        currentAverage >= 70 ? 'bg-blue-500' :
                        currentAverage >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(currentAverage, 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Alerts */}
                {currentAverage < 60 && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 text-red-700">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-xs font-medium">Needs attention - Consider extra study time</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {subjects.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Subjects Found</h3>
            <p className="text-gray-600">You haven't been enrolled in any subjects yet.</p>
          </div>
        )}
      </div>

      {/* Subject Detail Modal */}
      {showDetailModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Subject Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-center space-x-4 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${getPerformanceBg(selectedSubject.performance?.currentAverage || 0)}`}>
                  <BookOpen className={`w-8 h-8 ${getPerformanceColor(selectedSubject.performance?.currentAverage || 0)}`} />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedSubject.name}</h3>
                  <p className="text-gray-600">{selectedSubject.code} • {selectedSubject.category}</p>
                </div>
              </div>

              {/* Detailed Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Overview</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Average:</span>
                      <span className="font-semibold">{selectedSubject.performance?.currentAverage || 0}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Highest Score:</span>
                      <span className="font-semibold">{selectedSubject.performance?.highestScore || 'N/A'}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Assessments:</span>
                      <span className="font-semibold">{selectedSubject.performance?.totalAssessments || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Course Information</h4>
                  <div className="space-y-3">
                    {selectedSubject.teacher && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Teacher:</span>
                        <span className="font-semibold">{selectedSubject.teacher.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Attendance Rate:</span>
                      <span className="font-semibold">{selectedSubject.performance?.attendanceRate || 0}%</span>
                    </div>
                    {selectedSubject.schedule && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Schedule:</span>
                        <span className="font-semibold">{selectedSubject.schedule}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => window.location.href = `/protected/student/assignments?subject=${selectedSubject.id}`}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <FileText className="w-5 h-5" />
                  <span>View Assignments</span>
                </button>
                <button
                  onClick={() => window.location.href = `/protected/student/grades?subject=${selectedSubject.id}`}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Award className="w-5 h-5" />
                  <span>View Grades</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentSubjects;