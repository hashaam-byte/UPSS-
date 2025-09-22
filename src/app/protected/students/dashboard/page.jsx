// /app/protected/student/dashboard/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  FileText, 
  Calendar, 
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Award,
  Target,
  Users,
  Bell,
  Download,
  Eye,
  Play,
  User,
  BarChart3,
  MessageSquare,
  Loader2
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

      // Fetch dashboard data from multiple endpoints
      const [assignmentsRes, gradesRes, timetableRes, performanceRes] = await Promise.all([
        fetch('/api/protected/student/assignments?limit=5&status=active'),
        fetch('/api/protected/student/grades?recent=true&limit=5'),
        fetch('/api/protected/student/timetable?date=today'),
        fetch('/api/protected/student/performance?period=current_term')
      ]);

      if (!assignmentsRes.ok || !gradesRes.ok || !timetableRes.ok || !performanceRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const assignmentsData = await assignmentsRes.json();
      const gradesData = await gradesRes.json();
      const timetableData = await timetableRes.json();
      const performanceData = await performanceRes.json();

      setDashboardData({
        assignments: assignmentsData.data || assignmentsData,
        grades: gradesData.data || gradesData,
        timetable: timetableData.data || timetableData,
        performance: performanceData.data || performanceData
      });
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingAssignments = () => {
    if (!dashboardData?.assignments?.assignments) return [];
    return dashboardData.assignments.assignments
      .filter(assignment => new Date(assignment.dueDate) >= new Date())
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
      .slice(0, 5);
  };

  const getRecentGrades = () => {
    if (!dashboardData?.grades?.grades) return [];
    return dashboardData.grades.grades.slice(0, 5);
  };

  const getTodaysClasses = () => {
    if (!dashboardData?.timetable?.classes) return [];
    return dashboardData.timetable.classes.slice(0, 4);
  };

  const getOverallPerformance = () => {
    return dashboardData?.performance?.overallStats || {
      currentGPA: 0,
      averageScore: 0,
      attendanceRate: 0,
      assignmentCompletion: 0
    };
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

  const upcomingAssignments = getUpcomingAssignments();
  const recentGrades = getRecentGrades();
  const todaysClasses = getTodaysClasses();
  const performance = getOverallPerformance();

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
                <div className="text-2xl font-bold">{performance.currentGPA?.toFixed(1) || 'N/A'}</div>
                <div className="text-sm text-purple-200">Current GPA</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{performance.attendanceRate}%</div>
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
                <p className="text-3xl font-bold text-gray-900">{performance.averageScore}%</p>
                <p className="text-xs text-green-600">↑ 2.3% from last term</p>
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
                <p className="text-3xl font-bold text-green-600">{performance.attendanceRate}%</p>
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
                <p className="text-3xl font-bold text-purple-600">12th</p>
                <p className="text-xs text-gray-500">out of 45 students</p>
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
                  href="/protected/student/timetable"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View Full Timetable
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {todaysClasses.map((classItem, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{classItem.subject || `Class ${index + 1}`}</h4>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        {classItem.time || '9:00 AM'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{classItem.teacher || 'Teacher Name'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{classItem.room || 'Room 101'}</span>
                      <button className="text-xs text-purple-600 hover:text-purple-700 font-medium">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
                
                {todaysClasses.length === 0 && (
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
                  href="/protected/student/assignments"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-4">
                {upcomingAssignments.map((assignment) => (
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
                ))}
                
                {upcomingAssignments.length === 0 && (
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
                  href="/protected/student/grades"
                  className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-3">
                {recentGrades.map((grade, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {grade.subject || `Subject ${index + 1}`}
                      </p>
                      <p className="text-xs text-gray-600">{grade.assessment || 'Test'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {grade.score || Math.floor(Math.random() * 30) + 70}%
                      </p>
                      <p className={`text-xs ${
                        (grade.score || 80) >= 85 ? 'text-green-600' :
                        (grade.score || 80) >= 70 ? 'text-blue-600' :
                        'text-yellow-600'
                      }`}>
                        {(grade.score || 80) >= 85 ? 'Excellent' :
                         (grade.score || 80) >= 70 ? 'Good' : 'Fair'}
                      </p>
                    </div>
                  </div>
                ))}
                
                {recentGrades.length === 0 && (
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
                  href="/protected/student/subjects"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors text-center"
                >
                  <BookOpen className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">My Subjects</span>
                </a>
                
                <a
                  href="/protected/student/performance"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors text-center"
                >
                  <BarChart3 className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Performance</span>
                </a>
                
                <a
                  href="/protected/student/resources"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors text-center"
                >
                  <Download className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Resources</span>
                </a>
                
                <a
                  href="/protected/student/messages"
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
                    <span>{performance.assignmentCompletion}%</span>
                  </div>
                  <div className="w-full bg-purple-400 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${performance.assignmentCompletion}%` }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Attendance Rate</span>
                    <span>{performance.attendanceRate}%</span>
                  </div>
                  <div className="w-full bg-purple-400 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full"
                      style={{ width: `${performance.attendanceRate}%` }}
                    ></div>
                  </div>
                </div>
                
                <button className="w-full mt-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-sm font-medium transition-colors">
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