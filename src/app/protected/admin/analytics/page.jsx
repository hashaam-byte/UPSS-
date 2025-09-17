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
    performanceMetrics: {}
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
  }, [selectedTimeRange]);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/protected/admin/analytics?range=${selectedTimeRange}`);
      const data = await response.json();

      if (response.ok) {
        setAnalytics(data.analytics || analytics);
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

  const overviewCards = [
    {
      title: 'Total Users',
      value: analytics.overview.totalUsers,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Active Users',
      value: analytics.overview.activeUsers,
      icon: Activity,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'New This Month',
      value: analytics.overview.newUsersThisMonth,
      icon: TrendingUp,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      change: '+25%',
      changeType: 'increase'
    },
    {
      title: 'Login Rate',
      value: `${analytics.overview.loginRate}%`,
      icon: Clock,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/10',
      change: '+5%',
      changeType: 'increase'
    }
  ];

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
            onClick={fetchAnalytics}
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
        {overviewCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${card.bgGradient} backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${card.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-sm px-2 py-1 rounded-full ${
                  card.changeType === 'increase' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {card.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </h3>
                <p className="text-gray-400 text-sm">{card.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            User Growth Trends
          </h2>
          
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Chart visualization would be implemented here</p>
              <p className="text-gray-500 text-sm">Using libraries like Chart.js or Recharts</p>
            </div>
          </div>
        </div>

        {/* Activity Heatmap */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            User Activity Heatmap
          </h2>
          
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-white/20 rounded-xl">
            <div className="text-center">
              <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">Activity heatmap would be displayed here</p>
              <p className="text-gray-500 text-sm">Showing daily login patterns and peak usage times</p>
            </div>
          </div>
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
                  {analytics.performanceMetrics.dailyActiveUsers ?? '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Session duration:</span>
                <span className="text-white font-medium">
                  {analytics.performanceMetrics.averageSessionDuration
                    ? `${analytics.performanceMetrics.averageSessionDuration} min avg`
                    : '-'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Return rate:</span>
                <span className="text-white font-medium">
                  {analytics.performanceMetrics.userRetentionRate
                    ? `${analytics.performanceMetrics.userRetentionRate}%`
                    : '-'}
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
                <span className="text-white font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Assignment completion:</span>
                <span className="text-white font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Attendance rate:</span>
                <span className="text-white font-medium">-</span>
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
                <span className="text-white font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Grading timeliness:</span>
                <span className="text-white font-medium">-</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Resource uploads:</span>
                <span className="text-white font-medium">-</span>
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
        
        {/* Replace mock data with real API call */}
        {/* You can fetch from /api/protected/admin/activity and map the results here */}
        {/* Example: */}
        {/* {activityData.map((activity, index) => ( ... ))} */}
        <div className="space-y-3">
          {/* Render real activity data here */}
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;