// app/protected/teacher/subject/reports/page.jsx
'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function SubjectTeacherReports() {
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState('current');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [activeTab, setActiveTab] = useState('performance');

  useEffect(() => {
    fetchReports();
  }, [selectedTerm, selectedClass]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/protected/teacher/subject/reports?term=${selectedTerm}&class=${selectedClass}`
      );
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports);
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (reportType) => {
    try {
      const response = await fetch(
        `/api/protected/teacher/subject/reports/download?type=${reportType}&term=${selectedTerm}&class=${selectedClass}`
      );
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportType}-report-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Reports</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-gray-600">
            Comprehensive performance reports for your subject
          </p>
        </div>
        <div className="flex gap-3">
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="current">Current Term</option>
            <option value="last">Last Term</option>
            <option value="year">Academic Year</option>
          </select>
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="all">All Classes</option>
            {classes.map((cls) => (
              <option key={cls} value={cls}>
                {cls}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold">{reports?.overview?.totalStudents || 0}</p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Class Average</p>
              <p className="text-2xl font-bold">{reports?.overview?.classAverage || 0}%</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pass Rate</p>
              <p className="text-2xl font-bold">{reports?.overview?.passRate || 0}%</p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assignments</p>
              <p className="text-2xl font-bold">{reports?.overview?.totalAssignments || 0}</p>
            </div>
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('performance')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'performance' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Performance
          </button>
          <button
            onClick={() => setActiveTab('assignments')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'assignments' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Assignments
          </button>
          <button
            onClick={() => setActiveTab('grades')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'grades' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Grade Distribution
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'attendance' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Attendance
          </button>
        </div>
      </div>

      {/* Tab Content - Performance */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Trend Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Performance Trend</h3>
                <p className="text-sm text-gray-600">Student performance over time</p>
              </div>
              <button
                onClick={() => handleDownloadReport('performance')}
                className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reports?.performanceTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="average" stroke="#8884d8" name="Average Score" />
                <Line type="monotone" dataKey="highest" stroke="#82ca9d" name="Highest Score" />
                <Line type="monotone" dataKey="lowest" stroke="#ff8042" name="Lowest Score" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Class Comparison */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Class Performance Comparison</h3>
            <p className="text-sm text-gray-600 mb-4">Average scores by class</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports?.classComparison || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="className" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="averageScore" fill="#8884d8" name="Average Score" />
                <Bar dataKey="passRate" fill="#82ca9d" name="Pass Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top and Bottom Performers */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Top Performers
              </h3>
              <div className="space-y-3">
                {(reports?.topPerformers || []).map((student, index) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 bg-green-600 text-white rounded font-medium">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-gray-600">{student.className}</p>
                      </div>
                    </div>
                    <p className="font-bold text-green-600">{student.score}%</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Needs Attention
              </h3>
              <div className="space-y-3">
                {(reports?.needsAttention || []).map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.className}</p>
                    </div>
                    <p className="font-bold text-red-600">{student.score}%</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content - Assignments */}
      {activeTab === 'assignments' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Assignment Completion Overview</h3>
              <p className="text-sm text-gray-600">Track assignment submission rates</p>
            </div>
            <button
              onClick={() => handleDownloadReport('assignments')}
              className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
          <div className="space-y-4">
            {(reports?.assignments || []).map((assignment) => (
              <div key={assignment.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{assignment.title}</h4>
                  <span className={`px-2 py-1 text-xs rounded ${
                    assignment.completionRate >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {assignment.completionRate}% Completed
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Submitted</p>
                    <p className="font-bold text-green-600">{assignment.submitted}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Pending</p>
                    <p className="font-bold text-yellow-600">{assignment.pending}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Average Score</p>
                    <p className="font-bold text-blue-600">{assignment.averageScore}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content - Grades */}
      {activeTab === 'grades' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Grade Distribution</h3>
            <p className="text-sm text-gray-600 mb-4">Breakdown of student grades</p>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={reports?.gradeDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {(reports?.gradeDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">Score Range Distribution</h3>
            <p className="text-sm text-gray-600 mb-4">Students by score range</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reports?.scoreRanges || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" name="Students" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Tab Content - Attendance */}
      {activeTab === 'attendance' && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">Attendance Correlation</h3>
              <p className="text-sm text-gray-600">Relationship between attendance and performance</p>
            </div>
            <button
              onClick={() => handleDownloadReport('attendance')}
              className="px-4 py-2 border rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reports?.attendanceCorrelation || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="attendanceRate" label={{ value: 'Attendance %', position: 'insideBottom', offset: -5 }} />
              <YAxis label={{ value: 'Average Score %', angle: -90, position: 'insideLeft' }} />
              <Tooltip />
              <Line type="monotone" dataKey="averageScore" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}