// /app/protected/teacher/class/dashboard/page.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Award,
  Calendar,
  BookOpen,
  MessageSquare,
  Clock,
  Target,
  User,
  Phone,
  Mail,
  GraduationCap,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3
} from 'lucide-react';

const ClassTeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    fetchDashboardData();
    fetchRecentActivity();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/protected/teacher/class/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch('/api/protected/teacher/class/activity');
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  // Mock data for development
  const mockData = {
    totalStudents: 24,
    averageAttendance: 92,
    averagePerformance: 78,
    criticalAlerts: 3,
    recentAssignments: 12,
    pendingContacts: 2,
    topPerformers: [
      { id: 1, name: 'Sarah Johnson', average: 94, trend: 'up' },
      { id: 2, name: 'Michael Chen', average: 91, trend: 'up' },
      { id: 3, name: 'Emily Davis', average: 89, trend: 'stable' }
    ],
    strugglingStudents: [
      { id: 1, name: 'James Wilson', average: 45, subjects: ['Mathematics', 'Physics'] },
      { id: 2, name: 'Lisa Brown', average: 52, subjects: ['Chemistry', 'Biology'] },
      { id: 3, name: 'David Miller', average: 38, subjects: ['Mathematics', 'English'] }
    ],
    upcomingEvents: [
      { id: 1, title: 'Parent-Teacher Conference', date: '2024-02-15', type: 'meeting' },
      { id: 2, title: 'Mid-term Examinations', date: '2024-02-20', type: 'exam' },
      { id: 3, title: 'Class Performance Review', date: '2024-02-25', type: 'review' }
    ]
  };

  const data = dashboardData || mockData;

  if (loading && !dashboardData) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-300 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue' }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-2xl font-bold text-${color}-600 mt-2`}>{value}</p>
        </div>
        <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
          <Icon className={`h-6 w-6 text-${color}-600`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend === 'up' ? (
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
          ) : trend === 'down' ? (
            <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
          ) : (
            <Activity className="h-4 w-4 text-gray-500 mr-1" />
          )}
          <span className={`text-sm ${
            trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' ? 'Improving' : trend === 'down' ? 'Declining' : 'Stable'}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Class Teacher Dashboard</h1>
          <p className="text-gray-600 mt-1">Monitor and support your assigned students</p>
        </div>
        <div className="flex space-x-3">
          <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Contact Parents</span>
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={data.totalStudents}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Average Attendance"
          value={`${data.averageAttendance}%`}
          icon={CheckCircle}
          trend="up"
          color="green"
        />
        <StatCard
          title="Class Performance"
          value={`${data.averagePerformance}%`}
          icon={TrendingUp}
          trend="up"
          color="emerald"
        />
        <StatCard
          title="Critical Alerts"
          value={data.criticalAlerts}
          icon={AlertTriangle}
          color="red"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
            <Award className="h-5 w-5 text-yellow-500" />
          </div>
          <div className="space-y-4">
            {data.topPerformers.map((student) => (
              <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.name}</p>
                    <p className="text-sm text-gray-500">Average: {student.average}%</p>
                  </div>
                </div>
                {student.trend === 'up' && (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                )}
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            View All Students →
          </button>
        </div>

        {/* Students Needing Attention */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Need Attention</h3>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <div className="space-y-4">
            {data.strugglingStudents.map((student) => (
              <div key={student.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-red-600">Average: {student.average}%</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {student.subjects.map((subject, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                      {subject}
                    </span>
                  ))}
                </div>
                <button className="w-full mt-3 text-xs bg-red-600 text-white py-2 rounded-md hover:bg-red-700">
                  Contact Parent
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Events</h3>
            <Calendar className="h-5 w-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            {data.upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                <div className={`w-3 h-3 rounded-full ${
                  event.type === 'meeting' ? 'bg-blue-500' :
                  event.type === 'exam' ? 'bg-orange-500' :
                  'bg-purple-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{event.title}</p>
                  <p className="text-sm text-gray-500">{new Date(event.date).toLocaleDateString()}</p>
                </div>
                <Clock className="h-4 w-4 text-gray-400" />
              </div>
            ))}
          </div>
          <button className="w-full mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
            View Calendar →
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <MessageSquare className="h-6 w-6 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-600">Send Message</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
            <Phone className="h-6 w-6 text-emerald-600 mb-2" />
            <span className="text-sm font-medium text-emerald-600">Call Parent</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <BarChart3 className="h-6 w-6 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-600">View Analytics</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors">
            <Target className="h-6 w-6 text-orange-600 mb-2" />
            <span className="text-sm font-medium text-orange-600">Set Goals</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
            <AlertTriangle className="h-6 w-6 text-red-600 mb-2" />
            <span className="text-sm font-medium text-red-600">Flag Issue</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'Contacted Sarah Johnson\'s parent about excellent performance', time: '2 hours ago', type: 'positive' },
            { action: 'Flagged David Miller for additional math support', time: '4 hours ago', type: 'alert' },
            { action: 'Updated attendance records for today\'s classes', time: '6 hours ago', type: 'neutral' },
            { action: 'Submitted progress report for Lisa Brown', time: '1 day ago', type: 'neutral' },
            { action: 'Scheduled parent meeting for James Wilson', time: '2 days ago', type: 'meeting' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'positive' ? 'bg-green-500' :
                activity.type === 'alert' ? 'bg-red-500' :
                activity.type === 'meeting' ? 'bg-blue-500' :
                'bg-gray-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-500">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClassTeacherDashboard;