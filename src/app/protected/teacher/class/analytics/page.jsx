// /app/protected/teacher/class/analytics/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Target,
  AlertTriangle,
  Download,
  Filter,
  RefreshCw,
  BookOpen,
  CheckCircle2,
  Clock,
  Award,
  User,
  Loader2
} from 'lucide-react';

const ClassTeacherAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');
  const [selectedMetric, setSelectedMetric] = useState('all');
  const [comparisonView, setComparisonView] = useState('none');

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedMetric, comparisonView]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (selectedMetric !== 'all') params.append('metric', selectedMetric);
      if (comparisonView !== 'none') params.append('comparison', comparisonView);

      const response = await fetch(`/api/protected/teacher/class/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      params.append('format', 'pdf');

      const response = await fetch(`/api/protected/teacher/class/analytics/export?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to export report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `class-analytics-${selectedPeriod}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export report');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-700">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const analytics = analyticsData?.analytics || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Analytics</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive insights into your class performance and progress
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="current_term">Current Term</option>
                  <option value="last_term">Last Term</option>
                  <option value="academic_year">Academic Year</option>
                  <option value="last_30_days">Last 30 Days</option>
                </select>
              </div>
              <button
                onClick={exportReport}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Average</p>
                <p className="text-3xl font-bold text-blue-600">
                  {analytics.performance?.overallClassAverage || 'N/A'}%
                </p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">+{analytics.performance?.trends?.improvement || 0}% from last month</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600">
                  {analytics.attendance?.overallAttendanceRate || 'N/A'}%
                </p>
                <div className="flex items-center mt-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-500">Above target (85%)</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At-Risk Students</p>
                <p className="text-3xl font-bold text-orange-600">
                  {analytics.predictive?.riskFactors?.reduce((sum, factor) => sum + factor.studentsAffected, 0) || 0}
                </p>
                <div className="flex items-center mt-2">
                  <AlertTriangle className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-500">Need intervention</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Performers</p>
                <p className="text-3xl font-bold text-purple-600">
                  {analytics.performance?.gradeDistribution?.excellent || 0}
                </p>
                <div className="flex items-center mt-2">
                  <Award className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-sm text-purple-500">85%+ average</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Analytics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Performance Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
            <div className="space-y-4">
              {analytics.performance?.subjectBreakdown?.map((subject, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{subject.subject}</p>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-900">{subject.average}%</span>
                      {subject.trend === 'improving' ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : subject.trend === 'declining' ? (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      ) : (
                        <Target className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{subject.passRate}% pass rate</p>
                  </div>
                </div>
              )) || []}
            </div>
          </div>

          {/* Attendance Patterns */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Attendance Patterns</h3>
            <div className="space-y-4">
              {analytics.attendance?.dailyPatterns?.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{day.day}</span>
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${day.averageAttendance}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{day.averageAttendance}%</span>
                  </div>
                </div>
              )) || []}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Perfect Attendance:</span>
                <span className="font-medium text-green-600">
                  {analytics.attendance?.perfectAttendance || 0} students
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600">Chronic Absenteeism:</span>
                <span className="font-medium text-red-600">
                  {analytics.attendance?.chronicAbsenteeism || 0} students
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Assignment Analytics */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Assignment Insights</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Assignments:</span>
                <span className="font-semibold text-gray-900">
                  {analytics.assignments?.totalAssignments || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Submission Rate:</span>
                <span className="font-semibold text-blue-600">
                  {analytics.assignments?.submissionRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Average Score:</span>
                <span className="font-semibold text-green-600">
                  {analytics.assignments?.averageScore || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">On-Time Submission:</span>
                <span className="font-semibold text-purple-600">
                  {analytics.assignments?.onTimeSubmissionRate || 0}%
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Weekly Trends</h4>
              <div className="space-y-2">
                {analytics.assignments?.weeklySubmissionTrends?.map((week, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Week {week.week}:</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-900">{week.submissionRate}%</span>
                      <span className="text-gray-500">({week.averageScore}% avg)</span>
                    </div>
                  </div>
                )) || []}
              </div>
            </div>
          </div>

          {/* Parent Engagement */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Parent Engagement</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total Contacts:</span>
                <span className="font-semibold text-gray-900">
                  {analytics.parentEngagement?.totalContacts || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Response Rate:</span>
                <span className="font-semibold text-blue-600">
                  {analytics.parentEngagement?.responseRate || 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Meetings Completed:</span>
                <span className="font-semibold text-green-600">
                  {analytics.parentEngagement?.meetingsCompleted || 0}
                </span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Engagement Levels</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">High</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ 
                          width: `${((analytics.parentEngagement?.engagementLevels?.high || 0) / 
                                  (analyticsData?.overview?.totalStudents || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics.parentEngagement?.engagementLevels?.high || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Medium</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ 
                          width: `${((analytics.parentEngagement?.engagementLevels?.medium || 0) / 
                                  (analyticsData?.overview?.totalStudents || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics.parentEngagement?.engagementLevels?.medium || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Low</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full"
                        style={{ 
                          width: `${((analytics.parentEngagement?.engagementLevels?.low || 0) / 
                                  (analyticsData?.overview?.totalStudents || 1)) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {analytics.parentEngagement?.engagementLevels?.low || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Recommendations</h3>
            <div className="space-y-4">
              {analytics.recommendations?.map((recommendation, index) => (
                <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">{recommendation}</p>
                </div>
              )) || []}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
              <div className="space-y-3">
                {analytics.insights?.map((insight, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                )) || []}
              </div>
            </div>
          </div>
        </div>

        {/* Risk Factors Alert */}
        {analytics.predictive?.riskFactors?.length > 0 && (
          <div className="mt-8 bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-orange-800 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Risk Factors Identified</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analytics.predictive.riskFactors.map((factor, index) => (
                <div key={index} className="bg-white rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{factor.factor}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      factor.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                      factor.riskLevel === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {factor.riskLevel}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {factor.studentsAffected} students affected
                  </p>
                  <p className="text-sm text-gray-700">{factor.recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassTeacherAnalytics;