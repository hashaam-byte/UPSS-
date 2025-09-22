'use client'
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  MessageSquare, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Bell,
  Target,
  Activity,
  Award,
  User,
  Mail,
  Phone
} from 'lucide-react';

const ClassTeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from a single dashboard endpoint first
      try {
        const dashboardRes = await fetch('/api/protected/teacher/class/dashboard');
        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setDashboardData(dashboardData.data || dashboardData);
          return;
        }
      } catch (err) {
        console.warn('Dashboard endpoint not available, trying individual endpoints');
      }

      // Fallback to individual endpoints with error handling
      const endpoints = [
        { key: 'students', url: '/api/protected/teacher/class/students' },
        { key: 'attendance', url: '/api/protected/teacher/class/attendance' },
        { key: 'performance', url: '/api/protected/teacher/class/performance' },
        { key: 'messages', url: '/api/protected/teacher/class/messages?limit=5' }
      ];

      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url);
          if (response.ok) {
            const data = await response.json();
            results[endpoint.key] = data.data || data;
          } else {
            console.warn(`${endpoint.key} endpoint failed:`, response.status);
            results[endpoint.key] = [];
          }
        } catch (err) {
          console.warn(`${endpoint.key} endpoint error:`, err);
          results[endpoint.key] = [];
        }
      }

      setDashboardData(results);
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceToday = () => {
    if (!dashboardData?.attendance) return { present: 0, absent: 0, total: 0 };
    
    // Handle different possible response structures
    const attendanceData = dashboardData.attendance;
    
    if (typeof attendanceData === 'object' && attendanceData.present !== undefined) {
      return {
        present: attendanceData.present || 0,
        absent: attendanceData.absent || 0,
        total: (attendanceData.present || 0) + (attendanceData.absent || 0)
      };
    }
    
    if (Array.isArray(attendanceData)) {
      const today = new Date().toISOString().split('T')[0];
      const todayRecords = attendanceData.filter(record => {
        if (record.date === today) return true;
        if (record.attendance?.some(a => a.date === today)) return true;
        return false;
      });
      
      const present = todayRecords.filter(record => 
        record.status === 'present' || 
        record.attendance?.some(a => a.date === today && a.status === 'present')
      ).length;
      
      const absent = todayRecords.filter(record => 
        record.status === 'absent' || 
        record.attendance?.some(a => a.date === today && a.status === 'absent')
      ).length;
      
      return { present, absent, total: present + absent };
    }
    
    return { present: 0, absent: 0, total: 0 };
  };

  const getAtRiskStudents = () => {
    if (!dashboardData?.students) return [];
    
    const students = Array.isArray(dashboardData.students) ? dashboardData.students : [];
    
    return students.filter(student => {
      // Simple at-risk detection - can be enhanced
      if (student.attendanceRate && student.attendanceRate < 75) return true;
      if (student.performanceAverage && student.performanceAverage < 50) return true;
      if (student.alerts && student.alerts.length > 0) return true;
      return false;
    });
  };

  const getRecentMessages = () => {
    if (!dashboardData?.messages) return [];
    
    const messages = Array.isArray(dashboardData.messages) ? dashboardData.messages : 
                    (dashboardData.messages.messages ? dashboardData.messages.messages : []);
    
    return messages.slice(0, 5);
  };

  const getStudentsList = () => {
    if (!dashboardData?.students) return [];
    
    return Array.isArray(dashboardData.students) ? dashboardData.students :
           (dashboardData.students.students ? dashboardData.students.students : []);
  };

  const getAssignedClasses = () => {
    if (!dashboardData?.students) return [];
    
    const students = getStudentsList();
    if (Array.isArray(students) && students.length > 0) {
      const classes = students
        .map(s => s.profile?.className || s.studentProfile?.className)
        .filter(Boolean);
      return [...new Set(classes)];
    }
    
    return dashboardData.assignedClasses || [];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-700">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const attendanceToday = getAttendanceToday();
  const atRiskStudents = getAtRiskStudents();
  const recentMessages = getRecentMessages();
  const studentsList = getStudentsList();
  const assignedClasses = getAssignedClasses();
  const totalStudents = studentsList.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Class Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Managing {assignedClasses.length > 0 ? assignedClasses.join(', ') : 'No classes assigned'} • {totalStudents} students
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchDashboardData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Data
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="text-3xl font-bold text-green-600">{attendanceToday.present}</p>
                <p className="text-xs text-gray-500">of {attendanceToday.total}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">At Risk Students</p>
                <p className="text-3xl font-bold text-orange-600">{atRiskStudents.length}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New Messages</p>
                <p className="text-3xl font-bold text-purple-600">
                  {recentMessages.filter(m => !m.isRead).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Students Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Student Activity */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Students</h3>
                <a 
                  href="/protected/teacher/class/students"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-4">
                {studentsList.slice(0, 5).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {student.profile?.className || student.studentProfile?.className} • 
                          {student.profile?.studentId || student.studentProfile?.studentId || 'No ID'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {student.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ))}
                
                {studentsList.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students assigned to your class yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a
                  href="/protected/teacher/class/attendance"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Take Attendance</span>
                </a>
                
                <a
                  href="/protected/teacher/class/performance"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <TrendingUp className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Performance</span>
                </a>
                
                <a
                  href="/protected/teacher/class/messages"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <MessageSquare className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Messages</span>
                </a>
                
                <a
                  href="/protected/teacher/class/reports"
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <BookOpen className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Reports</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar Info */}
          <div className="space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Morning Assembly</p>
                    <p className="text-sm text-gray-600">8:00 - 8:30 AM</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Class Period</p>
                    <p className="text-sm text-gray-600">9:00 - 10:30 AM</p>
                  </div>
                  <BookOpen className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Recent Messages */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
                <a 
                  href="/protected/teacher/class/messages"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-3">
                {recentMessages.map((message) => (
                  <div key={message.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {message.subject || 'No Subject'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          From: {message.fromUser?.firstName || message.from?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      {!message.isRead && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
                
                {recentMessages.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent messages</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                <Bell className="w-5 h-5 text-gray-400" />
              </div>
              
              <div className="space-y-3">
                {atRiskStudents.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-800">
                          {atRiskStudents.length} students may need attention
                        </p>
                        <p className="text-xs text-yellow-600">
                          Based on attendance and performance data
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Calendar className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Parent-Teacher meeting next week
                      </p>
                      <p className="text-xs text-blue-600">
                        Prepare progress reports for all students
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassTeacherDashboard;