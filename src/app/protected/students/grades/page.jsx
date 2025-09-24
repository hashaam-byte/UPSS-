// /app/protected/student/grades/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Award,
  TrendingUp,
  TrendingDown,
  Target,
  BookOpen,
  Calendar,
  Filter,
  Download,
  Eye,
  BarChart3,
  PieChart,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const StudentGrades = () => {
  const [gradesData, setGradesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list', 'chart', 'summary'

  useEffect(() => {
    fetchGrades();
  }, [selectedTerm, selectedSubject]);

  const fetchGrades = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedTerm !== 'current') params.append('term', selectedTerm);
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);

      const response = await fetch(`/api/protected/student/grades?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch grades: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setGradesData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load grades');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch grades error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getGradeLetter = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Target className="w-4 h-4 text-gray-600" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading your grades...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Grades</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchGrades}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const grades = gradesData?.grades || [];
  const subjectStats = gradesData?.subjectStats || [];
  const overallStats = gradesData?.overallStats || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Grades</h1>
              <p className="text-gray-600 mt-1">
                Track your academic performance across all subjects
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'chart'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Chart View
                </button>
                <button
                  onClick={() => setViewMode('summary')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === 'summary'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Summary
                </button>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Average</p>
                <p className="text-3xl font-bold text-purple-600">
                  {overallStats.overallAverage}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  GPA: {overallStats.currentGPA}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Rank</p>
                <p className="text-3xl font-bold text-blue-600">
                  #{overallStats.classRank}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  of {overallStats.totalClassStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-3xl font-bold text-green-600">
                  {overallStats.totalAssessments}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This term
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Highest Score</p>
                <p className="text-3xl font-bold text-orange-600">
                  {Math.max(...grades.map(g => g.percentage)) || 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Best performance
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Academic Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="current">Current Term</option>
                <option value="last">Last Term</option>
                <option value="academic_year">Full Academic Year</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject Filter
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjectStats.map(subject => (
                  <option key={subject.subjectName} value={subject.subjectName}>
                    {subject.subjectName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content based on view mode */}
        {viewMode === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Subject Performance Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
              <div className="space-y-4">
                {subjectStats.map((subject, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getGradeColor(subject.averagePercentage).replace('text-', 'bg-').replace('bg-', 'bg-')}`}>
                        <BookOpen className={`w-6 h-6 ${getGradeColor(subject.averagePercentage).split(' ')[0]}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{subject.subjectName}</p>
                        <p className="text-sm text-gray-600">{subject.totalAssessments} assessments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(subject.averagePercentage)}`}>
                          {getGradeLetter(subject.averagePercentage)}
                        </span>
                        <span className="font-bold text-gray-900">{subject.averagePercentage}%</span>
                        {getTrendIcon(subject.averagePercentage, 75)}
                      </div>
                      <p className="text-sm text-gray-600 capitalize">{subject.trend}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grade Distribution */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Grade Distribution</h3>
              <div className="space-y-4">
                {[
                  { grade: 'A', range: '90-100%', count: grades.filter(g => g.percentage >= 90).length, color: 'bg-green-500' },
                  { grade: 'B', range: '80-89%', count: grades.filter(g => g.percentage >= 80 && g.percentage < 90).length, color: 'bg-blue-500' },
                  { grade: 'C', range: '70-79%', count: grades.filter(g => g.percentage >= 70 && g.percentage < 80).length, color: 'bg-yellow-500' },
                  { grade: 'D', range: '60-69%', count: grades.filter(g => g.percentage >= 60 && g.percentage < 70).length, color: 'bg-orange-500' },
                  { grade: 'F', range: 'Below 60%', count: grades.filter(g => g.percentage < 60).length, color: 'bg-red-500' }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 ${item.color} rounded-full flex items-center justify-center`}>
                        <span className="text-white font-bold text-sm">{item.grade}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Grade {item.grade}</p>
                        <p className="text-sm text-gray-600">{item.range}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`${item.color} h-2 rounded-full`}
                          style={{ width: `${grades.length > 0 ? (item.count / grades.length) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="font-semibold text-gray-900 w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'list' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Grade Records</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Assessment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comments
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${getGradeColor(grade.percentage)}`}>
                              <BookOpen className="h-5 w-5" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {grade.assessmentName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {grade.assessmentType}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{grade.subjectName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(grade.assessmentDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {grade.score}/{grade.maxScore}
                        </div>
                        <div className="text-sm text-gray-500">
                          {grade.percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(grade.percentage)}`}>
                          {grade.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {grade.comments || 'No comments'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {grades.length === 0 && (
              <div className="p-12 text-center">
                <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Yet</h3>
                <p className="text-gray-600">
                  Your grades will appear here once assessments are completed and graded.
                </p>
              </div>
            )}
          </div>
        )}

        {viewMode === 'chart' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Performance Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trend</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Chart visualization would be implemented with a charting library like Chart.js or Recharts</p>
                </div>
              </div>
            </div>

            {/* Subject Comparison */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Comparison</h3>
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <PieChart className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">Subject performance comparison chart</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentGrades;