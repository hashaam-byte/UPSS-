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
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Online Tests & Exams</h1>
              <p className="text-gray-600 mt-1">Create and manage online tests with auto-grading</p>
            </div>
            <div className="flex gap-4">
              <a
                href="/protected/teacher/subject/online-tests/create"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Test
              </a>
              <a
                href="/protected/teacher/subject/online-tests/ai-generate"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                AI Generate
              </a>
              <a
                href="/protected/teacher/subject/online-tests/diagnostics"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Diagnostics
              </a>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search tests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl"
                />
              </div>
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl"
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
            <div key={test.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">{test.title}</h3>
                  <p className="text-sm text-gray-600">{test.subject.name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                  {test.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{test.assignmentType}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Total Marks:</span>
                  <span className="font-medium">{test.maxScore}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Submissions:</span>
                  <span className="font-medium">{test.totalSubmissions}/{test.totalStudents}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Graded:</span>
                  <span className="font-medium">{test.gradedCount}/{test.totalSubmissions}</span>
                </div>
                {test.averageScore > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Avg Score:</span>
                    <span className="font-medium text-blue-600">{test.averageScore}%</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <a
                  href={`/protected/teacher/subject/online-tests/${test.id}`}
                  className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Eye className="w-4 h-4" />
                  View
                </a>
                {test.status === 'published' && test.totalSubmissions > test.gradedCount && (
                  <a
                    href={`/protected/teacher/subject/online-tests/grade/${test.id}`}
                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium flex items-center justify-center gap-1"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Grade
                  </a>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                <a
                  href={`/protected/teacher/subject/online-tests/${test.id}/edit`}
                  className="flex-1 px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-sm font-medium"
                >
                  <Edit className="w-4 h-4 mx-auto" />
                </a>
                <button
                  onClick={() => deleteTest(test.id)}
                  className="flex-1 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTests.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tests Found</h3>
            <p className="text-gray-600 mb-6">Create your first online test to get started.</p>
            <a
              href="/protected/teacher/subject/online-tests/create"
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
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