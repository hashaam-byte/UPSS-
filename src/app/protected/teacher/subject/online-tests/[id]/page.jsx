// app/protected/teacher/subject/online-tests/[id]/page.jsx - IMPROVED VISIBILITY
'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Clock, Users, CheckCircle, FileText, 
  Calendar, Edit, Trash2, Eye, Loader2, Download 
} from 'lucide-react';

export default function ViewTestDetails() {
  const params = useParams();
  const router = useRouter();
  const testId = params.id;
  
  const [test, setTest] = useState(null);
  const [testConfig, setTestConfig] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (testId) {
      fetchTestDetails();
      fetchSubmissions();
    }
  }, [testId]);

  const fetchTestDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/teacher/subject/online-tests?status=all`);
      if (response.ok) {
        const data = await response.json();
        const foundTest = data.tests.find(t => t.id === testId);
        if (foundTest) {
          setTest(foundTest);
          if (foundTest.attachments && foundTest.attachments.length > 0) {
            const config = JSON.parse(foundTest.attachments[0]);
            setTestConfig(config);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching test:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmissions = async () => {
    try {
      const response = await fetch(`/api/protected/teacher/subject/online-tests?status=all`);
      if (response.ok) {
        const data = await response.json();
        const foundTest = data.tests.find(t => t.id === testId);
        if (foundTest) {
          setSubmissions(foundTest.submissions || []);
        }
      }
    } catch (error) {
      console.error('Error fetching submissions:', error);
    }
  };

  const deleteTest = async () => {
    if (!confirm('Are you sure you want to delete this test? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/protected/teacher/subject/online-tests?id=${testId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        alert('Test deleted successfully');
        router.push('/protected/teacher/subject/online-tests');
      }
    } catch (error) {
      console.error('Error deleting test:', error);
      alert('Failed to delete test');
    }
  };

  const exportResults = () => {
    const headers = ['Student Name', 'Class', 'Score', 'Max Score', 'Percentage', 'Status', 'Submitted At'];
    const rows = submissions.map(sub => [
      `${sub.student.firstName} ${sub.student.lastName}`,
      sub.student.studentProfile?.className || 'N/A',
      sub.score || 'Not graded',
      sub.maxScore,
      sub.score ? `${Math.round((sub.score / sub.maxScore) * 100)}%` : 'N/A',
      sub.status,
      new Date(sub.submittedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${test.title.replace(/\s+/g, '_')}_results.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-800 font-bold">Test not found</p>
          <button
            onClick={() => router.push('/protected/teacher/subject/online-tests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold border-2 border-blue-700"
          >
            Back to Tests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-900" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
                <p className="text-gray-800 font-semibold mt-1">
                  {test.subject.name} • {test.assignmentType}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="px-4 py-2 border-2 border-gray-400 rounded-lg hover:bg-gray-50 flex items-center gap-2 font-bold text-gray-900"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
              <button
                onClick={() => router.push(`/protected/teacher/subject/online-tests/${testId}/edit`)}
                className="px-4 py-2 bg-yellow-50 text-yellow-900 rounded-lg hover:bg-yellow-100 flex items-center gap-2 font-bold border-2 border-yellow-300"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={deleteTest}
                className="px-4 py-2 bg-red-50 text-red-900 rounded-lg hover:bg-red-100 flex items-center gap-2 font-bold border-2 border-red-300"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-bold">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-700">{test.totalSubmissions}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-bold">Graded</p>
                <p className="text-3xl font-bold text-green-700">{test.gradedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-bold">Average Score</p>
                <p className="text-3xl font-bold text-purple-700">{test.averageScore}%</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-800 font-bold">Status</p>
                <p className={`text-lg font-bold ${
                  test.status === 'published' ? 'text-green-700' : 'text-gray-800'
                }`}>
                  {test.status.toUpperCase()}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-600" />
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Test Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-800 font-bold">Total Marks</p>
                <p className="font-bold text-gray-900">{test.maxScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-bold">Passing Marks</p>
                <p className="font-bold text-gray-900">{test.passingScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-bold">Duration</p>
                <p className="font-bold text-gray-900">{testConfig?.duration || 60} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-bold">Due Date</p>
                <p className="font-bold text-gray-900">{new Date(test.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-bold">Classes</p>
                <p className="font-bold text-gray-900">{test.classes.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-800 font-bold">Questions</p>
                <p className="font-bold text-gray-900">{testConfig?.questions?.length || 0}</p>
              </div>
            </div>

            {test.description && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300">
                <p className="text-sm text-gray-800 font-bold">Description</p>
                <p className="mt-1 font-semibold text-gray-900">{test.description}</p>
              </div>
            )}

            {testConfig && (
              <div className="mt-4 pt-4 border-t-2 border-gray-300">
                <p className="text-sm text-gray-800 font-bold mb-2">Settings</p>
                <div className="space-y-1 text-sm font-semibold text-gray-900">
                  <p>✓ {testConfig.allowRetake ? 'Retakes allowed' : 'No retakes'}</p>
                  <p>✓ {testConfig.showResultsImmediately ? 'Instant results' : 'Manual result release'}</p>
                  <p>✓ {testConfig.shuffleQuestions ? 'Questions shuffled' : 'Fixed question order'}</p>
                  <p>✓ {testConfig.shuffleOptions ? 'Options shuffled' : 'Fixed option order'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/protected/teacher/subject/online-tests/grade/${testId}`)}
                className="w-full px-4 py-2 bg-green-50 text-green-900 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2 font-bold border-2 border-green-300"
              >
                <CheckCircle className="w-4 h-4" />
                Grade Submissions
              </button>
              <button
                onClick={() => router.push(`/protected/teacher/subject/grading?assignment=${testId}`)}
                className="w-full px-4 py-2 bg-blue-50 text-blue-900 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2 font-bold border-2 border-blue-300"
              >
                <Eye className="w-4 h-4" />
                View All Submissions
              </button>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {testConfig?.questions && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-2 border-gray-300">
            <h3 className="text-lg font-bold mb-4 text-gray-900">Questions ({testConfig.questions.length})</h3>
            <div className="space-y-4">
              {testConfig.questions.map((q, index) => (
                <div key={q.id} className="p-4 border-2 border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${
                      q.type === 'objective' 
                        ? 'bg-green-100 text-green-900 border-green-300' 
                        : 'bg-purple-100 text-purple-900 border-purple-300'
                    }`}>
                      {q.type === 'objective' ? 'Objective' : 'Theory'} • Q{index + 1}
                    </span>
                    <span className="text-sm text-gray-800 font-bold">{q.marks} marks</span>
                  </div>
                  <p className="font-bold mb-2 text-gray-900">{q.question}</p>
                  {q.type === 'objective' && (
                    <div className="space-y-1 text-sm">
                      {q.options.map((opt, optIndex) => (
                        <p key={optIndex} className={`font-semibold ${optIndex === q.correctAnswer ? 'text-green-800' : 'text-gray-900'}`}>
                          {String.fromCharCode(65 + optIndex)}. {opt} {optIndex === q.correctAnswer && '✓'}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Submissions */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-gray-300">
          <h3 className="text-lg font-bold mb-4 text-gray-900">Recent Submissions</h3>
          {submissions.length === 0 ? (
            <p className="text-center text-gray-800 font-semibold py-8">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.slice(0, 10).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border-2 border-gray-300 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-bold text-gray-900">{sub.student.firstName} {sub.student.lastName}</p>
                    <p className="text-sm text-gray-800 font-semibold">{sub.student.studentProfile?.className}</p>
                  </div>
                  <div className="text-right">
                    {sub.score !== null ? (
                      <>
                        <p className="font-bold text-blue-700">{sub.score}/{sub.maxScore}</p>
                        <p className="text-sm text-gray-800 font-semibold">{Math.round((sub.score / sub.maxScore) * 100)}%</p>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-900 rounded-full text-xs font-bold border-2 border-yellow-300">
                        Pending Grading
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-700 font-semibold">
                    {new Date(sub.submittedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}