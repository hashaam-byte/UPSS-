// /app/protected/student/performance/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  PieChart,
  Calendar,
  Award,
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Download,
  RefreshCw,
  User,
  Loader2
} from 'lucide-react';

const StudentPerformance = () => {
  const [performanceData, setPerformanceData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedPeriod]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', selectedPeriod);

      const response = await fetch(`/api/protected/students/performance?${params.toString()}`);
      
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

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-5 h-5 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-5 h-5 text-red-500" />;
    return <Target className="w-5 h-5 text-gray-500" />;
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading your performance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Performance Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchPerformanceData}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const performance = performanceData || {};
  const overallStats = performance.overallStats || {};
  const subjectStats = performance.subjectStats || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Performance</h1>
              <p className="text-gray-600 mt-1">
                Track your academic progress and identify areas for improvement
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="current_term">Current Term</option>
                <option value="last_term">Last Term</option>
                <option value="academic_year">Academic Year</option>
              </select>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Overall Average</p>
                <p className="text-3xl font-bold text-purple-600">
                  {overallStats.overallAverage || 0}%
                </p>
                <div className="flex items-center mt-2">
                  {getTrendIcon('improving')}
                  <span className="text-sm text-green-500 ml-1">Improving</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current GPA</p>
                <p className="text-3xl font-bold text-blue-600">
                  {overallStats.currentGPA?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500 mt-1">4.0 Scale</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Rank</p>
                <p className="text-3xl font-bold text-green-600">
                  {overallStats.classRank || 'N/A'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  of {overallStats.totalClassStudents || 0} students
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Assessments</p>
                <p className="text-3xl font-bold text-orange-600">
                  {overallStats.totalAssessments || 0}
                </p>
                <p className="text-sm text-gray-500 mt-1">This {selectedPeriod.replace('_', ' ')}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Subject Performance Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
            <div className="space-y-4">
              {subjectStats.map((subject, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{subject.subjectName}</h4>
                        <p className="text-sm text-gray-600">{subject.totalAssessments} assessments</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getGradeColor(subject.averagePercentage)}`}>
                          {subject.averageGrade}
                        </span>
                        {getTrendIcon(subject.trend)}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{subject.averagePercentage}%</p>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        subject.averagePercentage >= 90 ? 'bg-green-500' :
                        subject.averagePercentage >= 80 ? 'bg-blue-500' :
                        subject.averagePercentage >= 70 ? 'bg-yellow-500' :
                        subject.averagePercentage >= 60 ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(subject.averagePercentage, 100)}%` }}
                    ></div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>Latest: {subject.latestScore}%</span>
                    <span>{new Date(subject.latestDate).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              
              {subjectStats.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No subject performance data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Performance Trends */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Trends</h3>
            
            {/* Mock Chart Area */}
            <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center mb-6">
              <div className="text-center text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Performance Chart</p>
                <p className="text-sm">Visual representation of your academic progress over time</p>
              </div>
            </div>

            {/* Trend Indicators */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-green-800">Improving Subjects</p>
                <p className="text-2xl font-bold text-green-600">
                  {subjectStats.filter(s => s.trend === 'improving').length}
                </p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <TrendingDown className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-red-800">Need Attention</p>
                <p className="text-2xl font-bold text-red-600">
                  {subjectStats.filter(s => s.averagePercentage < 60).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strengths & Weaknesses */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Strengths & Areas to Improve</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-green-800 mb-3 flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Strengths</span>
                </h4>
                <div className="space-y-2">
                  {subjectStats
                    .filter(s => s.averagePercentage >= 85)
                    .slice(0, 3)
                    .map((subject, index) => (
                      <div key={index} className="p-2 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800">{subject.subjectName}</p>
                        <p className="text-xs text-green-600">{subject.averagePercentage}% average</p>
                      </div>
                    ))}
                  {subjectStats.filter(s => s.averagePercentage >= 85).length === 0 && (
                    <p className="text-sm text-gray-500">Keep working to identify your strengths!</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-orange-800 mb-3 flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Areas to Improve</span>
                </h4>
                <div className="space-y-2">
                  {subjectStats
                    .filter(s => s.averagePercentage < 70)
                    .slice(0, 3)
                    .map((subject, index) => (
                      <div key={index} className="p-2 bg-orange-50 rounded-lg">
                        <p className="text-sm font-medium text-orange-800">{subject.subjectName}</p>
                        <p className="text-xs text-orange-600">{subject.averagePercentage}% average</p>
                      </div>
                    ))}
                  {subjectStats.filter(s => s.averagePercentage < 70).length === 0 && (
                    <p className="text-sm text-gray-500">Great job! No subjects need immediate attention.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recent Achievements</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Top 10 in Mathematics</p>
                    <p className="text-sm text-yellow-600">Scored 95% on recent test</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-800">Improved in Physics</p>
                    <p className="text-sm text-blue-600">+15% improvement this term</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">Perfect Attendance</p>
                    <p className="text-sm text-green-600">No absences this month</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Goals & Recommendations */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Goals & Recommendations</h3>
            
            <div className="space-y-6">
              <div>
                <h4 className="font-medium text-purple-800 mb-3 flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Academic Goals</span>
                </h4>
                <div className="space-y-3">
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">Maintain GPA above 3.5</p>
                    <div className="mt-2 w-full bg-purple-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${Math.min((overallStats.currentGPA || 0) / 3.5 * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-purple-600 mt-1">
                      Current: {overallStats.currentGPA?.toFixed(2) || '0.00'} / 3.5
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-blue-800 mb-3">Recommendations</h4>
                <div className="space-y-2">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">Spend extra time on weaker subjects</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">Form study groups with classmates</p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">Seek help from teachers when needed</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance History Table */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assessment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {performance.grades?.slice(0, 10).map((grade, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="w-5 h-5 text-gray-400 mr-3" />
                        <span className="text-sm font-medium text-gray-900">{grade.subjectName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {grade.assessmentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-gray-900">
                        {grade.score}/{grade.maxScore}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getGradeColor(grade.percentage)}`}>
                        {grade.grade}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.assessmentDate).toLocaleDateString()}
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
            
            {(!performance.grades || performance.grades.length === 0) && (
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No grade data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;