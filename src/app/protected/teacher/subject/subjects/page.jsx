// app/protected/teacher/subject/subjects/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MySubjects() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    } finally {
      setLoading(false);
    }
  };

  const openDetailModal = (subject) => {
    setSelectedSubject(subject);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedSubject(null);
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'CORE':
        return 'bg-blue-100 text-blue-800';
      case 'SCIENCE':
        return 'bg-green-100 text-green-800';
      case 'ARTS':
        return 'bg-purple-100 text-purple-800';
      case 'COMMERCIAL':
        return 'bg-yellow-100 text-yellow-800';
      case 'VOCATIONAL':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Subjects</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-3"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
          <h1 className="text-3xl font-bold">My Subjects</h1>
          <p className="text-gray-600">
            Manage your teaching subjects and classes
          </p>
        </div>
        <div className="px-4 py-2 bg-blue-50 rounded-lg">
          <span className="text-sm text-gray-600">Total Subjects: </span>
          <span className="font-bold text-blue-600">{subjects.length}</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">
                {subjects.reduce((acc, s) => acc + (s.totalStudents || 0), 0)}
              </p>
            </div>
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Classes</p>
              <p className="text-2xl font-bold text-green-600">
                {subjects.reduce((acc, s) => acc + (s.classes?.length || 0), 0)}
              </p>
            </div>
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Assignments</p>
              <p className="text-2xl font-bold text-purple-600">
                {subjects.reduce((acc, s) => acc + (s.activeAssignments || 0), 0)}
              </p>
            </div>
            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Performance</p>
              <p className="text-2xl font-bold text-orange-600">
                {subjects.length > 0
                  ? Math.round(
                      subjects.reduce((acc, s) => acc + (s.averageScore || 0), 0) / subjects.length
                    )
                  : 0}%
              </p>
            </div>
            <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Subjects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className="bg-white rounded-lg shadow hover:shadow-xl transition-shadow cursor-pointer"
            onClick={() => openDetailModal(subject)}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{subject.name}</h3>
                  <p className="text-sm text-gray-600 mb-2">Code: {subject.code}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded ${getCategoryColor(subject.category)}`}>
                    {subject.category}
                  </span>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  subject.isActive ? 'bg-green-100' : 'bg-gray-100'
                }`}>
                  <svg className={`w-6 h-6 ${subject.isActive ? 'text-green-600' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Students</span>
                  <span className="font-semibold">{subject.totalStudents || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Classes</span>
                  <span className="font-semibold">{subject.classes?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Assignments</span>
                  <span className="font-semibold">{subject.activeAssignments || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold text-blue-600">{subject.averageScore || 0}%</span>
                </div>
              </div>

              {/* Classes Tags */}
              {subject.classes && subject.classes.length > 0 && (
                <div className="border-t pt-3">
                  <p className="text-xs text-gray-600 mb-2">Teaching:</p>
                  <div className="flex flex-wrap gap-1">
                    {subject.classes.slice(0, 3).map((className, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-xs rounded">
                        {className}
                      </span>
                    ))}
                    {subject.classes.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-xs rounded">
                        +{subject.classes.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/protected/teacher/subject/assignments/create?subjectId=${subject.id}`);
                  }}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  New Assignment
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openDetailModal(subject);
                  }}
                  className="px-3 py-2 border rounded text-sm hover:bg-gray-50"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No subjects assigned</h3>
          <p className="text-gray-600 mb-4">
            You don't have any subjects assigned yet. Contact your administrator.
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedSubject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedSubject.name}</h2>
                  <p className="text-gray-600">Code: {selectedSubject.code}</p>
                </div>
                <button
                  onClick={closeDetailModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Subject Info */}
              <div className="space-y-6">
                {/* Category and Status */}
                <div className="flex gap-3">
                  <span className={`px-3 py-1 rounded ${getCategoryColor(selectedSubject.category)}`}>
                    {selectedSubject.category}
                  </span>
                  <span className={`px-3 py-1 rounded ${
                    selectedSubject.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedSubject.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Total Students</p>
                    <p className="text-3xl font-bold text-blue-600">{selectedSubject.totalStudents || 0}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Active Assignments</p>
                    <p className="text-3xl font-bold text-green-600">{selectedSubject.activeAssignments || 0}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Score</p>
                    <p className="text-3xl font-bold text-purple-600">{selectedSubject.averageScore || 0}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Pass Rate</p>
                    <p className="text-3xl font-bold text-orange-600">{selectedSubject.passRate || 0}%</p>
                  </div>
                </div>

                {/* Classes List */}
                <div>
                  <h3 className="font-semibold mb-3">Teaching Classes</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedSubject.classes && selectedSubject.classes.length > 0 ? (
                      selectedSubject.classes.map((className, idx) => (
                        <div key={idx} className="px-3 py-2 bg-gray-100 rounded text-center">
                          {className}
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600 col-span-3">No classes assigned</p>
                    )}
                  </div>
                </div>

                {/* Recent Performance */}
                {selectedSubject.recentPerformance && (
                  <div>
                    <h3 className="font-semibold mb-3">Recent Performance Trend</h3>
                    <div className="space-y-2">
                      {selectedSubject.recentPerformance.map((perf, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <span className="text-sm">{perf.period}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${perf.score}%` }}
                              ></div>
                            </div>
                            <span className="font-semibold w-12 text-right">{perf.score}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      router.push(`/protected/teacher/subject/analytics?subjectId=${selectedSubject.id}`);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View Analytics
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/protected/teacher/subject/assignments/create?subjectId=${selectedSubject.id}`);
                    }}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Create Assignment
                  </button>
                  <button
                    onClick={() => {
                      router.push(`/protected/teacher/subject/students?subjectId=${selectedSubject.id}`);
                    }}
                    className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    View Students
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}