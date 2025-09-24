'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  AlertTriangle,
  ArrowRight,
  PieChart
} from 'lucide-react';
import {
  PieChart as RechartsPieChart,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

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

  // Chart colors
  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  useEffect(() => {
    fetchAnalytics();
    fetchTodayActivity();
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

  const fetchTodayActivity = async () => {
    try {
      // Fetch only today's activity (1 day)
      const response = await fetch('/api/protected/admin/activity?days=1&limit=5');
      const data = await response.json();

      if (response.ok) {
        setAnalytics(prev => ({
          ...prev,
          recentActivity: data.activities || []
        }));
      }
    } catch (error) {
      console.error('Error fetching today activity:', error);
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

  // Prepare data for user growth chart
  const userGrowthChartData = analytics.userGrowth.map(item => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Students: item.students || 0,
    Teachers: item.teachers || 0,
    Admins: item.admins || 0,
    Total: item.total || 0
  }));

  // Prepare data for user role pie chart
  const roleDistributionData = [
    { name: 'Students', value: analytics.overview.totalUsers ? Math.floor(analytics.overview.totalUsers * 0.85) : 0, color: '#10B981' },
    { name: 'Teachers', value: analytics.overview.totalUsers ? Math.floor(analytics.overview.totalUsers * 0.12) : 0, color: '#3B82F6' },
    { name: 'Admins', value: analytics.overview.totalUsers ? Math.floor(analytics.overview.totalUsers * 0.03) : 0, color: '#8B5CF6' }
  ];

  // Prepare activity data for chart
  const activityChartData = analytics.activityData.slice(0, 12).map(item => ({
    time: `${item.hour}:00`,
    Users: item.users || 0,
    Students: item.students || 0,
    Teachers: item.teachers || 0
  }));

  const getActivityIcon = (type) => {
    switch (type) {
      case 'academic': return <GraduationCap className="w-4 h-4" />;
      case 'attendance': return <UserCheck className="w-4 h-4" />;
      case 'communication': return <Calendar className="w-4 h-4" />;
      case 'system': return <Activity className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'academic': return 'from-emerald-500 to-emerald-600';
      case 'attendance': return 'from-blue-500 to-blue-600';
      case 'communication': return 'from-purple-500 to-purple-600';
      case 'system': return 'from-orange-500 to-orange-600';
      default: return 'from-gray-500 to-gray-600';
    }
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
              fetchTodayActivity();
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
        {/* User Growth Bar Chart */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            User Growth Trends
          </h2>
          
          {userGrowthChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={userGrowthChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                  <Legend />
                  <Bar dataKey="Students" fill="#10B981" />
                  <Bar dataKey="Teachers" fill="#3B82F6" />
                  <Bar dataKey="Admins" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {isLoading ? 'Loading chart data...' : 'No growth data available'}
            </div>
          )}
        </div>

        {/* User Role Distribution Pie Chart */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            User Distribution
          </h2>
          
          {roleDistributionData.some(item => item.value > 0) ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={roleDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {roleDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }} 
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              {isLoading ? 'Loading distribution data...' : 'No user data available'}
            </div>
          )}
        </div>
      </div>

      {/* Activity Hours Chart */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Daily Activity Pattern
        </h2>
        
        {activityChartData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activityChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Legend />
                <Bar dataKey="Students" fill="#10B981" />
                <Bar dataKey="Teachers" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            {isLoading ? 'Loading activity data...' : 'No activity data available'}
          </div>
        )}
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

      {/* Today's Activity Log */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            Today's Activity
          </h2>
          <Link 
            href="/protected/admin/activity" 
            className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm transition-colors"
          >
            View All Activity
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {analytics.recentActivity && analytics.recentActivity.length > 0 ? (
          <div className="space-y-3">
            {analytics.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 bg-gradient-to-r ${getActivityColor(activity.type)} rounded-full flex items-center justify-center text-white`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{activity.description}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">{activity.user}</span>
                      <span className="text-gray-500 text-xs">•</span>
                      <span className="text-gray-500 text-xs capitalize">{activity.category}</span>
                    </div>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">
                  {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {isLoading ? 'Loading today\'s activity...' : 'No activity today'}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalyticsPage;