// /app/protected/students/dashboard/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Target,
  Eye,
  BarChart3,
  MessageSquare,
  Loader2,
  TrendingUp
} from 'lucide-react';

const StudentDashboard = () => {
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

      const response = await fetch('/api/protected/students/dashboard');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard</h2>
            <p className="text-sm text-gray-600">Getting your latest information...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const performance = dashboardData?.performance?.overallStats || {};
  const upcomingAssignments = dashboardData?.assignments?.assignments || [];
  const recentGrades = dashboardData?.grades?.grades || [];
  const todaysClasses = dashboardData?.timetable?.classes || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Welcome Back!</h1>
              <p className="text-purple-100">
                Ready to continue your learning journey? Here's what's happening today.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold">{performance.currentGPA?.toFixed(1) || '0.0'}</div>
                <div className="text-sm text-purple-200">Current GPA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{performance.attendanceRate || 0}%</div>
                <div className="text-sm text-purple-200">Attendance</div>
              </div>
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
                <p className="text-sm font-medium text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-gray-900">{performance.averageScore || 0}%</p>
                <p className="text-xs text-green-600 mt-1">
                  <TrendingUp className="w-3 h-3 inline mr-1" />
                  Keep it up!
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
                <p className="text-sm font-medium text-gray-600">Assignments Due</p>
                <p className="text-3xl font-bold text-orange-600">{upcomingAssignments.length}</p>
                <p className="text-xs text-gray-500">Next 7 days</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Rate</p>
                <p className="text-3xl font-bold text-green-600">{performance.attendanceRate || 0}%</p>
                <p className="text-xs text-gray-500">This term</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Class Rank</p>
                <p className="text-3xl font-bold text-purple-600">
                  {performance.classRank || 'N/A'}
                </p>
                <p className="text-xs text-gray-500">
                  out of {performance.totalClassStudents || 0} students
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Today's Schedule & Assignments */}
          <div className="lg:col-span-2 space-y-6">
            {/* Today's Schedule */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Calendar className="w-5 h-5" />
                  <span>Today's Classes</span>
                </h3>
                <a 
                  href="/protected/students/timetable"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View Full Timetable
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaysClasses.length > 0 ? (
                  todaysClasses.map((classItem, index) => (
                    <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{classItem.subject}</h4>
                        <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                          {classItem.time}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{classItem.teacher}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{classItem.room}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No classes scheduled for today</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Assignments */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Upcoming Assignments</span>
                </h3>
                <a 
                  href="/protected/students/assignments"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-4">
                {upcomingAssignments.length > 0 ? (
                  upcomingAssignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{assignment.title}</p>
                          <p className="text-sm text-gray-600">{assignment.subject}</p>
                          <p className="text-xs text-gray-500">
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          new Date(assignment.dueDate) - new Date() < 24 * 60 * 60 * 1000
                            ? 'bg-red-100 text-red-700'
                            : new Date(assignment.dueDate) - new Date() < 3 * 24 * 60 * 60 * 1000
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {Math.ceil((new Date(assignment.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                        </span>
                        <button className="p-2 text-gray-400 hover:text-gray-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>All caught up! No upcoming assignments.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Recent Grades & Quick Actions */}
          <div className="space-y-6">
            {/* Recent Grades */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Grades</h3>
                <a 
                  href="/protected/students/grades"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-3">
                {recentGrades.length > 0 ? (
                  recentGrades.map((grade, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {grade.subject}
                        </p>
                        <p className="text-xs text-gray-600">{grade.assessment}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-gray-900">
                          {grade.score}%
                        </p>
                        <p className={`text-xs ${
                          grade.score >= 85 ? 'text-green-600' :
                          grade.score >= 70 ? 'text-blue-600' :
                          'text-yellow-600'
                        }`}>
                          {grade.score >= 85 ? 'Excellent' :
                           grade.score >= 70 ? 'Good' : 'Fair'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No recent grades</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="/protected/students/subjects"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">My Subjects</span>
                </a>
                
                <a
                  href="/protected/students/performance"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center"
                >
                  <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Performance</span>
                </a>
                
                <a
                  href="/protected/students/resources"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Resources</span>
                </a>
                
                <a
                  href="/protected/students/messages"
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors text-center"
                >
                  <MessageSquare className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Messages</span>
                </a>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl shadow-sm p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">This Term's Progress</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Assignment Completion</span>
                    <span>{performance.assignmentCompletion || 0}%</span>
                  </div>
                  <div className="w-full bg-purple-400 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${performance.assignmentCompletion || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attendance Rate</span>
                    <span>{performance.attendanceRate || 0}%</span>
                  </div>
                  <div className="w-full bg-purple-400 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${performance.attendanceRate || 0}%` }}
                    ></div>
                  </div>
                </div>
                
                <button 
                  onClick={() => window.location.href = '/protected/students/performance'}
                  className="w-full mt-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors"
                >
                  View Detailed Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;