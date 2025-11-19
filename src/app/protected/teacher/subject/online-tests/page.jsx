// Online Tests List - IMPROVED VISIBILITY
'use client'
import React, { useState, useEffect } from 'react';
import { Plus, Search, Eye, Edit, Trash2, Users, Clock, CheckCircle, Loader2, FileText, Sparkles } from 'lucide-react';

export default function OnlineTestsList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchTests();
  }, [filterStatus]);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/teacher/subject/online-tests?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setTests(data.tests || []);
      }
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTest = async (testId) => {
    if (!confirm('Are you sure you want to delete this test?')) return;

    try {
      const response = await fetch(`/api/protected/teacher/subject/online-tests?id=${testId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Test deleted successfully');
        fetchTests();
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-900 border-2 border-green-400';
      case 'draft': return 'bg-gray-200 text-gray-900 border-2 border-gray-400';
      case 'closed': return 'bg-red-100 text-red-900 border-2 border-red-400';
      default: return 'bg-gray-200 text-gray-900 border-2 border-gray-400';
    }
  };

  const filteredTests = tests.filter(test =>
    test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    test.subject.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-300">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Online Tests & Exams</h1>
              <p className="text-gray-800 font-semibold mt-1">Create and manage online tests with auto-grading</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/protected/teacher/subject/online-tests/create"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 font-bold border-2 border-green-700"
              >
                <Plus className="w-4 h-4" />
                Create Test
              </a>
              <a
                href="/protected/teacher/subject/online-tests/ai-generate"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 font-bold border-2 border-purple-700"
              >
                <Sparkles className="w-4 h-4" />
                AI Generate
              </a>
              <a
                href="/protected/teacher/subject/online-tests/diagnostics"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 font-bold border-2 border-blue-700"
              >
                <FileText className="w-4 h-4" />
                Diagnostics
              </a>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-300">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-700" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border-2 border-gray-400 rounded-xl font-medium text-gray-900 placeholder-gray-600"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border-2 border-gray-400 rounded-xl font-bold text-gray-900"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {/* Tests Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <div key={test.id} className="bg-white rounded-2xl shadow-lg border-2 border-gray-300 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1 text-lg">{test.title}</h3>
                  <p className="text-sm text-gray-800 font-semibold">{test.subject.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(test.status)}`}>
                  {test.status.toUpperCase()}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 font-bold">Type:</span>
                  <span className="font-bold text-gray-900 capitalize">{test.assignmentType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 font-bold">Total Marks:</span>
                  <span className="font-bold text-gray-900">{test.maxScore}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 font-bold">Submissions:</span>
                  <span className="font-bold text-gray-900">{test.totalSubmissions}/{test.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-800 font-bold">Graded:</span>
                  <span className="font-bold text-gray-900">{test.gradedCount}/{test.totalSubmissions}</span>
                </div>
                {test.averageScore > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-800 font-bold">Avg Score:</span>
                    <span className="font-bold text-blue-700">{test.averageScore}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={`/protected/teacher/subject/online-tests/${test.id}`}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100 text-sm font-bold flex items-center justify-center gap-1 border-2 border-blue-300"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                {test.status === 'published' && test.totalSubmissions > test.gradedCount && (
                  <a
                    href={`/protected/teacher/subject/online-tests/grade/${test.id}`}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-900 rounded-lg hover:bg-green-100 text-sm font-bold flex items-center justify-center gap-1 border-2 border-green-300"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Grade
                  </a>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <a
                  href={`/protected/teacher/subject/online-tests/${test.id}/edit`}
                  className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-900 rounded-lg hover:bg-yellow-100 text-sm font-bold border-2 border-yellow-300"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </a>
                <button
                  onClick={() => deleteTest(test.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-900 rounded-lg hover:bg-red-100 text-sm font-bold border-2 border-red-300"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-gray-300">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-800 font-semibold mb-6">Create your first online test to get started.</p>
            <a
              href="/protected/teacher/subject/online-tests/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold border-2 border-green-700"
            >
              <Plus className="w-5 h-5" />
              Create Test
            </a>
          </div>
        )}
      </div>
    </div>
  );
}