// app/protected/teacher/subject/online-tests/[id]/page.jsx
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
          // Parse test configuration from attachments
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
    // Create CSV content
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
          <p className="text-gray-600">Test not found</p>
          <button
            onClick={() => router.push('/protected/teacher/subject/online-tests')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{test.title}</h1>
                <p className="text-gray-600 mt-1">
                  {test.subject.name} • {test.assignmentType}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportResults}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Results
              </button>
              <button
                onClick={() => router.push(`/protected/teacher/subject/online-tests/${testId}/edit`)}
                className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={deleteTest}
                className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Test Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Submissions</p>
                <p className="text-3xl font-bold text-blue-600">{test.totalSubmissions}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Graded</p>
                <p className="text-3xl font-bold text-green-600">{test.gradedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Average Score</p>
                <p className="text-3xl font-bold text-purple-600">{test.averageScore}%</p>
              </div>
              <FileText className="w-8 h-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className={`text-lg font-bold ${
                  test.status === 'published' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {test.status}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-500" />
            </div>
          </div>
        </div>

        {/* Test Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Test Configuration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Total Marks</p>
                <p className="font-semibold">{test.maxScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Passing Marks</p>
                <p className="font-semibold">{test.passingScore}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">{testConfig?.duration || 60} minutes</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Due Date</p>
                <p className="font-semibold">{new Date(test.dueDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Classes</p>
                <p className="font-semibold">{test.classes.join(', ')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Questions</p>
                <p className="font-semibold">{testConfig?.questions?.length || 0}</p>
              </div>
            </div>

            {test.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">Description</p>
                <p className="mt-1">{test.description}</p>
              </div>
            )}

            {testConfig && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-2">Settings</p>
                <div className="space-y-1 text-sm">
                  <p>✓ {testConfig.allowRetake ? 'Retakes allowed' : 'No retakes'}</p>
                  <p>✓ {testConfig.showResultsImmediately ? 'Instant results' : 'Manual result release'}</p>
                  <p>✓ {testConfig.shuffleQuestions ? 'Questions shuffled' : 'Fixed question order'}</p>
                  <p>✓ {testConfig.shuffleOptions ? 'Options shuffled' : 'Fixed option order'}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => router.push(`/protected/teacher/subject/online-tests/grade/${testId}`)}
                className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Grade Submissions
              </button>
              <button
                onClick={() => router.push(`/protected/teacher/subject/grading?assignment=${testId}`)}
                className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                View All Submissions
              </button>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {testConfig?.questions && (
          <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Questions ({testConfig.questions.length})</h3>
            <div className="space-y-4">
              {testConfig.questions.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      q.type === 'objective' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {q.type === 'objective' ? 'Objective' : 'Theory'} • Q{index + 1}
                    </span>
                    <span className="text-sm text-gray-600">{q.marks} marks</span>
                  </div>
                  <p className="font-medium mb-2">{q.question}</p>
                  {q.type === 'objective' && (
                    <div className="space-y-1 text-sm">
                      {q.options.map((opt, optIndex) => (
                        <p key={optIndex} className={optIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
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
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
          {submissions.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.slice(0, 10).map((sub) => (
                <div key={sub.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="font-medium">{sub.student.firstName} {sub.student.lastName}</p>
                    <p className="text-sm text-gray-600">{sub.student.studentProfile?.className}</p>
                  </div>
                  <div className="text-right">
                    {sub.score !== null ? (
                      <>
                        <p className="font-bold text-blue-600">{sub.score}/{sub.maxScore}</p>
                        <p className="text-sm text-gray-600">{Math.round((sub.score / sub.maxScore) * 100)}%</p>
                      </>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        Pending Grading
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
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