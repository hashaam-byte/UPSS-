'use client';
import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  BookOpen,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Filter,
  Download,
  RefreshCw,
  Loader2,
  PieChart,
  Activity
} from 'lucide-react';

const ClassTeacherAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedClass, setSelectedClass] = useState('all');
  const [assignedClasses, setAssignedClasses] = useState([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod, selectedClass]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (selectedClass !== 'all') params.append('className', selectedClass);
      params.append('includeComparisons', 'true');
      params.append('includeTrends', 'true');

      const response = await fetch(`/api/protected/teacher/class/analytics?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalyticsData(data.data);
        if (data.data.assignedClasses) {
          setAssignedClasses(data.data.assignedClasses);
        }
      } else {
        throw new Error(data.error || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err.message);
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('period', selectedPeriod);
      if (selectedClass !== 'all') params.append('className', selectedClass);
      params.append('format', 'pdf');

      const response = await fetch(`/api/protected/teacher/class/reports?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `class_analytics_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export report: ' + err.message);
    }
  };

  const getPerformanceColor = (value, threshold = 70) => {
    if (value >= threshold) return 'text-green-600';
    if (value >= threshold - 20) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (trend) => {
    if (trend === 'improving') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'declining') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Analytics</h2>
            <p className="text-sm text-gray-600">Analyzing class performance data...</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Analytics</h1>
              <p className="text-gray-600 mt-1">
                Performance insights and trends • {analyticsData.summary?.totalStudents || 0} students
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
                <option value="last_30_days">Last 30 Days</option>
              </select>
              
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Classes</option>
                {assignedClasses.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

              <button
                onClick={fetchAnalyticsData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>

              <button
                onClick={exportReport}
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
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Average</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(analyticsData.performance?.classAverage || 0)}`}>
                  {analyticsData.performance?.classAverage?.toFixed(1) || '0.0'}%
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analyticsData.performance?.trend)}
                  <span className="text-xs text-gray-500 ml-1">
                    vs {analyticsData.comparison?.previousPeriod?.toFixed(1) || '0.0'}% prev
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(analyticsData.attendance?.averageRate || 0, 85)}`}>
                  {analyticsData.attendance?.averageRate?.toFixed(1) || '0.0'}%
                </p>
                <div className="flex items-center mt-1">
                  {getTrendIcon(analyticsData.attendance?.trend)}
                  <span className="text-xs text-gray-500 ml-1">
                    {analyticsData.attendance?.presentToday || 0} present today
                  </span>
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
                <p className="text-sm font-medium text-gray-600">At Risk Students</p>
                <p className="text-3xl font-bold text-red-600">
                  {analyticsData.alerts?.atRiskCount || 0}
                </p>
                <p className="text-xs text-gray-500">
                  {analyticsData.alerts?.activeAlertsCount || 0} active alerts
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignment Rate</p>
                <p className={`text-3xl font-bold ${getPerformanceColor(analyticsData.assignments?.completionRate || 0, 80)}`}>
                  {analyticsData.assignments?.completionRate?.toFixed(0) || '0'}%
                </p>
                <p className="text-xs text-gray-500">
                  {analyticsData.assignments?.pendingCount || 0} pending
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Charts */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Trends */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Performance Trends</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedView('overview')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedView === 'overview' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setSelectedView('subjects')}
                    className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                      selectedView === 'subjects' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    Subjects
                  </button>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Performance trend chart would be displayed here</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Using a charting library like Chart.js or Recharts
                  </p>
                </div>
              </div>
            </div>

            {/* Subject Performance Breakdown */}
            {analyticsData.subjects && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Subject Performance</h3>
                
                <div className="space-y-4">
                  {analyticsData.subjects.map((subject) => (
                    <div key={subject.name} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{subject.name}</p>
                          <p className="text-sm text-gray-600">
                            {subject.studentCount} students • {subject.assignmentCount} assignments
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-lg font-bold ${getPerformanceColor(subject.average)}`}>
                            {subject.average?.toFixed(1)}%
                          </p>
                          <div className="flex items-center">
                            {getTrendIcon(subject.trend)}
                            <span className="text-xs text-gray-500 ml-1">{subject.trend}</span>
                          </div>
                        </div>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(subject.average, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Insights */}
          <div className="space-y-6">
            {/* Quick Insights */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
              
              <div className="space-y-3">
                {analyticsData.insights?.map((insight, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    insight.type === 'positive' ? 'bg-green-50 border-green-200' :
                    insight.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start space-x-2">
                      {insight.type === 'positive' ? 
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" /> :
                        insight.type === 'warning' ?
                        <Clock className="w-4 h-4 text-yellow-600 mt-0.5" /> :
                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                      }
                      <div>
                        <p className="text-sm font-medium text-gray-900">{insight.title}</p>
                        <p className="text-xs text-gray-600">{insight.description}</p>
                      </div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No insights available yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Performers */}
            {analyticsData.topPerformers && analyticsData.topPerformers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
                
                <div className="space-y-3">
                  {analyticsData.topPerformers.slice(0, 5).map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{student.className}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">{student.average?.toFixed(1)}%</p>
                        <div className="flex items-center">
                          <Award className="w-3 h-3 text-yellow-500 mr-1" />
                          <span className="text-xs text-gray-500">{student.rank}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Activity */}
            {analyticsData.recentActivity && analyticsData.recentActivity.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                
                <div className="space-y-3">
                  {analyticsData.recentActivity.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                        <p className="text-xs text-gray-600">{activity.description}</p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {activity.timestamp}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions Panel */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">View Student Details</p>
                      <p className="text-xs text-gray-600">Access individual performance data</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors">
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Create Assignment</p>
                      <p className="text-xs text-gray-600">Add new assignment or assessment</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                  <div className="flex items-center space-x-3">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Generate Report</p>
                      <p className="text-xs text-gray-600">Create detailed analytics report</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Stats */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.totalAssignments || 0}
              </p>
              <p className="text-sm text-gray-600">Total Assignments</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.averageGrade?.toFixed(1) || '0.0'}
              </p>
              <p className="text-sm text-gray-600">Average Grade</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.attendanceRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600">Attendance Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData.stats?.improvementRate?.toFixed(1) || '0.0'}%
              </p>
              <p className="text-sm text-gray-600">Improvement Rate</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTeacherAnalytics;