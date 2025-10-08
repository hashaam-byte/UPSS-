'use client'
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Users, TrendingUp, FileText, CheckSquare,
  Clock, Calendar, Loader2, AlertTriangle, ArrowRight
} from 'lucide-react';

export default function ImprovedDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/dashboard');
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.data);
      } else {
        throw new Error('Failed to fetch dashboard data');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimeDisplay = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ongoing': return 'bg-green-100 text-green-800 border-green-300';
      case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed': return 'bg-gray-100 text-gray-600 border-gray-300';
      default: return 'bg-gray-100 text-gray-600 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ongoing': return '🟢';
      case 'upcoming': return '🔵';
      case 'completed': return '✓';
      default: return '○';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { todaySchedule, dayOfWeek, currentTime, summary, teacherSubjects, recentAssignments, upcomingDeadlines } = dashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}! 👋</h1>
              <p className="text-blue-100">Here's your schedule and activity for {dayOfWeek}</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{new Date().toLocaleDateString('en-US', { day: 'numeric' })}</div>
              <div className="text-sm">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</div>
              <div className="text-xs mt-1 text-blue-200">{getTimeDisplay(currentTime)}</div>
            </div>
          </div>
        </div>

        {/* Today's Schedule - Featured Section */}
        <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Today's Classes</h2>
                <p className="text-gray-600">{dayOfWeek} - {todaySchedule.length} period{todaySchedule.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No classes scheduled for today</p>
              <p className="text-sm text-gray-500 mt-1">Enjoy your day off! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((lesson) => (
                <div 
                  key={lesson.id}
                  className={`p-4 rounded-xl border-2 transition-all ${getStatusColor(lesson.status)} ${
                    lesson.status === 'ongoing' ? 'shadow-lg scale-105' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-center min-w-[80px]">
                        <div className="text-2xl font-bold">
                          {getStatusIcon(lesson.status)}
                        </div>
                        <div className="text-xs font-medium mt-1">
                          Period {lesson.period}
                        </div>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-gray-900">{lesson.subject}</h3>
                          <span className="px-2 py-1 bg-white rounded-md text-xs font-medium">
                            {lesson.className}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{getTimeDisplay(lesson.startTime)} - {getTimeDisplay(lesson.endTime)}</span>
                          </div>
                          {lesson.status === 'ongoing' && (
                            <span className="flex items-center gap-1 text-green-700 font-medium animate-pulse">
                              <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                              In Progress
                            </span>
                          )}
                          {lesson.status === 'upcoming' && (
                            <span className="text-blue-700 font-medium">
                              Starting soon
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {lesson.status !== 'completed' && (
                      <a
                        href={`/protected/teacher/subject/subjects?class=${lesson.className}`}
                        className="px-4 py-2 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                      >
                        View Class
                        <ArrowRight className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{summary.totalStudents}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Assignments</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{summary.activeAssignments}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Grading</p>
                <p className="text-3xl font-bold text-orange-600 mt-1">{summary.pendingGrading}</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Performance</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{summary.averagePerformance}%</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* My Subjects */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">My Subjects</h3>
              <a href="/protected/teacher/subject/subjects" className="text-blue-600 hover:underline text-sm font-medium">
                View All
              </a>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teacherSubjects.slice(0, 4).map((ts) => (
                <div key={ts.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <h4 className="font-semibold text-gray-900 mb-2">{ts.subject.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">Classes: {ts.classes.join(', ')}</p>
                  <div className="flex gap-2">
                    <a
                      href={`/protected/teacher/subject/assignments?subject=${ts.subject.id}`}
                      className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 text-center"
                    >
                      Assignments
                    </a>
                    <a
                      href={`/protected/teacher/subject/grading?subject=${ts.subject.id}`}
                      className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 text-center"
                    >
                      Grading
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
            <div className="space-y-3">
              {upcomingDeadlines && upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((deadline) => (
                  <div key={deadline.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Due: {new Date(deadline.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No upcoming deadlines</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}