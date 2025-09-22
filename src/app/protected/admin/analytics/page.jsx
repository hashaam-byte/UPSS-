'use client'
import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  GraduationCap,
  UserCheck,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react';

const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      loginRate: 0
    },
    userGrowth: [],
    activityData: [],
    performanceMetrics: {},
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [error, setError] = useState('');

  const timeRanges = [
    { label: '7 Days', value: '7d' },
    { label: '30 Days', value: '30d' },
    { label: '3 Months', value: '3m' },
    { label: '6 Months', value: '6m' },
    { label: '1 Year', value: '1y' }
  ];

  useEffect(() => {
    fetchAnalytics();
    fetchRecentActivity();
  }, [selectedTimeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/protected/admin/analytics?range=${selectedTimeRange}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(prev => ({
          ...prev,
          ...data.analytics
        }));
      } else {
        setError(data.error || 'Failed to fetch analytics');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/protected/admin/activity');
      const data = await response.json();

      if (response.ok) {
        setAnalytics(prev => ({
          ...prev,
          recentActivity: data.activities || []
        }));
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  const exportReport = async () => {
    try {
      const response = await fetch(`/api/protected/admin/analytics/export?range=${selectedTimeRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `analytics-report-${selectedTimeRange}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0';
    return num.toLocaleString();
  };

  const formatPercentage = (num) => {
    if (typeof num !== 'number') return '0%';
    return `${num.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reports</h1>
          <p className="text-gray-400">Track your school's performance and user engagement</p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          >
            {timeRanges.map((range) => (
              <option key={range.value} value={range.value} className="bg-slate-800">
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={() => {
              fetchAnalytics();
              fetchRecentActivity();
            }}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/20 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatNumber(analytics.overview.totalUsers)}
            </h3>
            <p className="text-gray-400 text-sm">Total Users</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatNumber(analytics.overview.activeUsers)}
            </h3>
            <p className="text-gray-400 text-sm">Active Users</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatNumber(analytics.overview.newUsersThisMonth)}
            </h3>
            <p className="text-gray-400 text-sm">New This Month</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">
              {formatPercentage(analytics.overview.loginRate)}
            </h3>
            <p className="text-gray-400 text-sm">Login Rate</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            User Growth Trends
          </h2>
          
          {analytics.userGrowth && analytics.userGrowth.length > 0 ? (
            <div className="space-y-4">
              {analytics.userGrowth.map((data, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <span className="text-gray-400">{data.date}</span>
                  <span className="text-white font-medium">{data.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {isLoading ? 'Loading chart data...' : 'No growth data available'}
            </div>
          )}
        </div>

        {/* Activity Heatmap */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            User Activity
          </h2>
          
          {analytics.activityData && analytics.activityData.length > 0 ? (
            <div className="space-y-4">
              {analytics.activityData.map((activity, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                  <div>
                    <span className="text-white font-medium">{activity.hour}:00</span>
                    <p className="text-gray-400 text-sm">{activity.day}</p>
                  </div>
                  <span className="text-emerald-400 font-medium">{activity.users} users</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {isLoading ? 'Loading activity data...' : 'No activity data available'}
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Performance Insights
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User Engagement */}
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Eye className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white">User Engagement</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Daily active users:</span>
                <span className="text-white font-medium">
                  {formatNumber(analytics.performanceMetrics.dailyActiveUsers || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Session duration:</span>
                <span className="text-white font-medium">
                  {analytics.performanceMetrics.averageSessionDuration 
                    ? `${analytics.performanceMetrics.averageSessionDuration} min` 
                    : '0 min'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Return rate:</span>
                <span className="text-white font-medium">
                  {formatPercentage(analytics.performanceMetrics.userRetentionRate || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Student Performance */}
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white">Student Performance</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Average grade:</span>
                <span className="text-white font-medium">
                  {analytics.performanceMetrics.averageGrade 
                    ? `${analytics.performanceMetrics.averageGrade}%`
                    : '0%'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Assignment completion:</span>
                <span className="text-white font-medium">
                  {formatPercentage(analytics.performanceMetrics.assignmentCompletionRate || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Attendance rate:</span>
                <span className="text-white font-medium">
                  {formatPercentage(analytics.performanceMetrics.attendanceRate || 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Teacher Activity */}
          <div className="bg-white/5 p-4 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <UserCheck className="w-4 h-4 text-white" />
              </div>
              <h3 className="font-medium text-white">Teacher Activity</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Active teachers:</span>
                <span className="text-white font-medium">
                  {formatNumber(analytics.performanceMetrics.activeTeachers || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Grading timeliness:</span>
                <span className="text-white font-medium">
                  {formatPercentage(analytics.performanceMetrics.gradingTimeliness || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Resource uploads:</span>
                <span className="text-white font-medium">
                  {formatNumber(analytics.performanceMetrics.resourceUploads || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-emerald-400" />
          Recent Activity
        </h2>
        
        {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-xs font-medium text-white">
                    {activity.userInitials || activity.user?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.description}</p>
                    <p className="text-gray-400 text-sm">{activity.user}</p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(activity.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? 'Loading recent activity...' : 'No recent activity found'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;