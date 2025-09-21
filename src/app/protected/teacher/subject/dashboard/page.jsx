// /app/protected/teacher/subject/dashboard/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Users, 
  TrendingUp, 
  FileText, 
  CheckSquare,
  AlertTriangle,
  Clock,
  Award,
  Target,
  BarChart3,
  Upload,
  Calendar,
  MessageSquare,
  PieChart,
  Activity,
  Loader2
} from 'lucide-react';

const SubjectTeacherDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current_term');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch dashboard data from multiple endpoints
      const [subjectsRes, assignmentsRes, gradingRes, analyticsRes] = await Promise.all([
        fetch('/api/protected/teacher/subject/subjects'),
        fetch('/api/protected/teacher/subject/assignments?status=all&limit=5'),
        fetch('/api/protected/teacher/subject/grading?status=pending&limit=10'),
        fetch(`/api/protected/teacher/subject/analytics?period=${selectedPeriod}`)
      ]);

      if (!subjectsRes.ok || !assignmentsRes.ok || !gradingRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const subjectsData = await subjectsRes.json();
      const assignmentsData = await assignmentsRes.json();
      const gradingData = await gradingRes.json();
      const analyticsData = await analyticsRes.json();

      setDashboardData({
        subjects: subjectsData.data || subjectsData,
        assignments: assignmentsData.data || assignmentsData,
        grading: gradingData.data || gradingData,
        analytics: analyticsData.data || analyticsData
      });
    } catch (err) {
      setError(err.message);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTotalStudents = () => {
    if (!dashboardData?.subjects?.teacherSubjects) return 0;
    return dashboardData.subjects.teacherSubjects.reduce((total, subject) => {
      return total + (subject.studentCount || 0);
    }, 0);
  };

  const getPendingGrading = () => {
    if (!dashboardData?.grading?.submissions) return 0;
    return dashboardData.grading.submissions.filter(s => s.status === 'pending').length;
  };

  const getRecentAssignments = () => {
    if (!dashboardData?.assignments?.assignments) return [];
    return dashboardData.assignments.assignments.slice(0, 5);
  };

  const getSubjectPerformance = () => {
    if (!dashboardData?.analytics?.subjectAnalysis) return [];
    return Object.entries(dashboardData.analytics.subjectAnalysis).map(([subject, data]) => ({
      subject,
      ...data
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Dashboard</h2>
            <p className="text-sm text-gray-600">Fetching your subject data...</p>
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

  const totalStudents = getTotalStudents();
  const pendingGrading = getPendingGrading();
  const recentAssignments = getRecentAssignments();
  const subjectPerformance = getSubjectPerformance();
  const assignedSubjects = dashboardData?.subjects?.teacherSubjects || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subject Teacher Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Teaching {assignedSubjects.map(s => s.subject?.name).join(', ')} • {totalStudents} students
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
              </select>
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
                <p className="text-xs text-gray-500">Across all subjects</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Assignments</p>
                <p className="text-3xl font-bold text-green-600">{recentAssignments.length}</p>
                <p className="text-xs text-gray-500">This term</p>
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
                <p className="text-3xl font-bold text-orange-600">{pendingGrading}</p>
                <p className="text-xs text-gray-500">Need your attention</p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Performance</p>
                <p className="text-3xl font-bold text-purple-600">
                  {dashboardData?.analytics?.overallPerformance?.averageScore || 'N/A'}%
                </p>
                <p className="text-xs text-gray-500">Across subjects</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Subjects */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">My Subjects</h3>
                <a 
                  href="/protected/teacher/subject/subjects"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedSubjects.map((teacherSubject) => (
                  <div key={teacherSubject.id} className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900">
                        {teacherSubject.subject?.name || 'Unknown Subject'}
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        {teacherSubject.subject?.code || 'N/A'}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>Classes: {teacherSubject.classes?.join(', ') || 'None assigned'}</p>
                      <p>Students: {teacherSubject.studentCount || 0}</p>
                      <p>Category: {teacherSubject.subject?.category || 'General'}</p>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <a
                        href={`/protected/teacher/subject/assignments?subject=${teacherSubject.subject?.id}`}
                        className="flex-1 px-3 py-1.5 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors text-center"
                      >
                        Assignments
                      </a>
                      <a
                        href={`/protected/teacher/subject/grading?subject=${teacherSubject.subject?.id}`}
                        className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded-md hover:bg-green-700 transition-colors text-center"
                      >
                        Grading
                      </a>
                    </div>
                  </div>
                ))}
                
                {assignedSubjects.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No subjects assigned yet.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Assignments */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Assignments</h3>
                <a 
                  href="/protected/teacher/subject/assignments"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-4">
                {recentAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{assignment.title}</p>
                        <p className="text-sm text-gray-600">
                          {assignment.subject} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        assignment.status === 'active' ? 'bg-green-100 text-green-800' :
                        assignment.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {assignment.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        {assignment.submissionCount}/{assignment.totalStudents} submitted
                      </span>
                    </div>
                  </div>
                ))}
                
                {recentAssignments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No recent assignments.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <a
                  href="/protected/teacher/subject/assignments/create"
                  className="flex flex-col items-center p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <Upload className="w-8 h-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Create Assignment</span>
                </a>
                
                <a
                  href="/protected/teacher/subject/grading"
                  className="flex flex-col items-center p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                >
                  <CheckSquare className="w-8 h-8 text-green-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Grade Work</span>
                </a>
                
                <a
                  href="/protected/teacher/subject/analytics"
                  className="flex flex-col items-center p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors"
                >
                  <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Analytics</span>
                </a>
                
                <a
                  href="/protected/teacher/subject/resources"
                  className="flex flex-col items-center p-4 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors"
                >
                  <BookOpen className="w-8 h-8 text-orange-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">Resources</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Pending Grading */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Pending Grading</h3>
                <a 
                  href="/protected/teacher/subject/grading"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View All
                </a>
              </div>
              
              <div className="space-y-3">
                {dashboardData?.grading?.submissions?.slice(0, 5).map((submission) => (
                  <div key={submission.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {submission.assignment?.title || 'Unknown Assignment'}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          Student: {submission.student?.name || 'Unknown'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                  </div>
                ))}
                
                {(!dashboardData?.grading?.submissions || dashboardData.grading.submissions.length === 0) && (
                  <div className="text-center py-4 text-gray-500">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No pending grading</p>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Performance */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subject Performance</h3>
              
              <div className="space-y-3">
                {subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{subject.subject}</p>
                      <p className="text-xs text-gray-600">
                        {subject.studentCount || 0} students
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-gray-900">
                        {subject.averageScore || 'N/A'}%
                      </p>
                      <p className={`text-xs ${
                        subject.trend === 'improving' ? 'text-green-600' :
                        subject.trend === 'declining' ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {subject.trend || 'stable'}
                      </p>
                    </div>
                  </div>
                ))}
                
                {subjectPerformance.length === 0 && (
                  <div className="text-center py-4 text-gray-500">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No performance data yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Deadlines */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Deadlines</h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">
                        Term results due in 5 days
                      </p>
                      <p className="text-xs text-red-600">
                        Complete grading for all subjects
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Assignment overdue
                      </p>
                      <p className="text-xs text-yellow-600">
                        Mathematics homework - 2 days overdue
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

export default SubjectTeacherDashboard;