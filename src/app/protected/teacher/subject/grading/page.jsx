// /app/protected/teacher/subject/grading/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  User,
  FileText,
  Star,
  AlertCircle,
  Zap,
  Eye,
  MessageSquare,
  Save,
  Loader2,
  CheckCircle2,
  XCircle,
  Award
} from 'lucide-react';

const SubjectTeacherGrading = () => {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  useEffect(() => {
    fetchGradingData();
  }, [selectedAssignment, selectedStatus]);

  const fetchGradingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedAssignment !== 'all') params.append('assignment', selectedAssignment);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);

      const [submissionsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/protected/teacher/subject/grading?${params.toString()}`),
        fetch('/api/protected/teacher/subject/assignments?status=active')
      ]);

      if (!submissionsRes.ok || !assignmentsRes.ok) {
        throw new Error('Failed to fetch grading data');
      }

      const submissionsData = await submissionsRes.json();
      const assignmentsData = await assignmentsRes.json();

      setSubmissions(submissionsData.data?.submissions || []);
      setAssignments(assignmentsData.data?.assignments || []);

    } catch (err) {
      setError(err.message);
      console.error('Fetch grading data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const autoGradeSubmission = async (submissionId) => {
    try {
      const response = await fetch('/api/protected/teacher/subject/grading', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });

      if (!response.ok) throw new Error('Failed to auto-grade');

      const data = await response.json();
      alert(`Auto-graded: ${data.data.autoGradingResult.totalObjectiveScore}/${data.data.autoGradingResult.maxObjectiveScore} on objective questions`);
      
      // Refresh to show updated results
      fetchGradingData();
    } catch (err) {
      console.error('Auto-grade error:', err);
      alert('Failed to auto-grade: ' + err.message);
    }
  };

  const gradeSubmission = async (submissionId, theoryScore, feedback, autoGrade = true) => {
    try {
      const response = await fetch('/api/protected/teacher/subject/grading', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId,
          theoryScore: theoryScore ? parseInt(theoryScore) : undefined,
          feedback,
          autoGrade
        })
      });

      if (!response.ok) throw new Error('Failed to submit grade');

      const data = await response.json();
      alert(`Grade submitted successfully! Total: ${data.data.totalScore}/${data.data.maxScore} (${data.data.percentage}%)`);
      fetchGradingData();
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Grade submission error:', err);
      alert('Failed to submit grade: ' + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-700">Loading submissions...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Submissions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchGradingData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Grading Center</h1>
              <p className="text-gray-600 mt-1">
                Review and grade student submissions • {submissions.length} total
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-blue-50 px-4 py-2 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">
                  <Zap className="w-4 h-4 inline mr-1" />
                  Auto-grading enabled for objective questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignments</option>
                {assignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>
                    {assignment.title} - {assignment.subject}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="graded">Graded</option>
                <option value="late">Late</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-2xl shadow-sm border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Submissions to Grade</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-gray-900">
                            {submission.student?.name || 'Unknown Student'}
                          </h4>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(submission.status)}`}>
                            {submission.status}
                          </span>
                          {submission.isLateSubmission && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late
                            </span>
                          )}
                          {submission.hasObjectiveQuestions && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              <Zap className="w-3 h-3 mr-1" />
                              Auto-gradable
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Assignment:</span> {submission.assignment?.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Subject:</span> {submission.assignment?.subject}
                        </p>
                        
                        {/* Show auto-grading results if available */}
                        {submission.autoGradingResult && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                            <p className="text-sm font-medium text-purple-800 mb-1">
                              <Award className="w-4 h-4 inline mr-1" />
                              Objective Questions: {submission.autoGradingResult.totalObjectiveScore}/{submission.autoGradingResult.maxObjectiveScore}
                            </p>
                            <p className="text-xs text-purple-600">
                              {submission.autoGradingResult.objectivePercentage.toFixed(1)}% correct
                              {submission.requiresManualGrading && " • Theory questions need manual grading"}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500 mt-2">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 flex flex-col space-y-2">
                    <button
                      onClick={() => setSelectedSubmission(submission)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Grade</span>
                    </button>
                    
                    {submission.hasObjectiveQuestions && !submission.score && (
                      <button
                        onClick={() => autoGradeSubmission(submission.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>Auto-Grade</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Show final grade if graded */}
                {submission.score !== null && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">
                          Final Grade: {submission.score}/{submission.maxScore} ({Math.round((submission.score/submission.maxScore) * 100)}%)
                        </p>
                        {submission.feedback && (
                          <p className="text-sm text-green-700 mt-1">"{submission.feedback}"</p>
                        )}
                      </div>
                      <p className="text-xs text-green-600">
                        Graded on {new Date(submission.gradedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Empty State */}
          {submissions.length === 0 && (
            <div className="p-12 text-center">
              <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions to Grade</h3>
              <p className="text-gray-600">All caught up! No pending submissions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <GradingModal
          submission={selectedSubmission}
          onSubmit={gradeSubmission}
          onCancel={() => setSelectedSubmission(null)}
        />
      )}
    </div>
  );
};

// Enhanced Grading Modal with Auto-Grading Display
const GradingModal = ({ submission, onSubmit, onCancel }) => {
  const [theoryScore, setTheoryScore] = useState('');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  const autoGradingResult = submission.autoGradingResult;
  const hasTheory = submission.requiresManualGrading;
  const maxTheoryScore = submission.maxScore - (autoGradingResult?.maxObjectiveScore || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (hasTheory && (!theoryScore || isNaN(theoryScore))) {
      alert('Please enter a valid theory score');
      return;
    }

    const theoryScoreNum = hasTheory ? parseInt(theoryScore) : 0;
    if (theoryScoreNum < 0 || theoryScoreNum > maxTheoryScore) {
      alert(`Theory score must be between 0 and ${maxTheoryScore}`);
      return;
    }

    onSubmit(submission.id, theoryScoreNum, feedback, true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Grade Submission</h2>
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full text-2xl">
              ×
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left - Student Info & Objective Grading */}
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {submission.student?.name}</p>
                  <p><strong>Class:</strong> {submission.student?.className}</p>
                  <p><strong>Assignment:</strong> {submission.assignment?.title}</p>
                  <p><strong>Max Score:</strong> {submission.maxScore}</p>
                </div>
              </div>

              {/* Auto-Grading Results */}
              {autoGradingResult && (
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Objective Questions (Auto-Graded)
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <span className="font-medium">Score:</span>
                      <span className="text-lg font-bold text-purple-600">
                        {autoGradingResult.totalObjectiveScore}/{autoGradingResult.maxObjectiveScore}
                      </span>
                    </div>
                    
                    {autoGradingResult.gradedQuestions?.map((q, idx) => (
                      <div key={idx} className={`p-3 rounded-lg ${q.isCorrect ? 'bg-green-50' : 'bg-red-50'}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">Q{q.questionNumber}: {q.question}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              Student: <span className="font-medium">{q.studentAnswer}</span>
                            </p>
                            <p className="text-xs text-gray-600">
                              Correct: <span className="font-medium">{q.correctAnswer}</span>
                            </p>
                          </div>
                          <div className="ml-3">
                            {q.isCorrect ? (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            ) : (
                              <XCircle className="w-5 h-5 text-red-600" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right - Theory Grading Form */}
            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                {hasTheory && (
                  <div className="bg-white border rounded-xl p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Theory Questions (Manual Grading)</h3>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Theory Score (out of {maxTheoryScore})
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={maxTheoryScore}
                        value={theoryScore}
                        onChange={(e) => setTheoryScore(e.target.value)}
                        className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter theory score"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Total Score Summary */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h3 className="font-semibold text-blue-900 mb-3">Total Score</h3>
                  <div className="space-y-2 text-sm">
                    {autoGradingResult && (
                      <div className="flex justify-between">
                        <span>Objective:</span>
                        <span className="font-bold">{autoGradingResult.totalObjectiveScore}/{autoGradingResult.maxObjectiveScore}</span>
                      </div>
                    )}
                    {hasTheory && (
                      <div className="flex justify-between">
                        <span>Theory:</span>
                        <span className="font-bold">{theoryScore || 0}/{maxTheoryScore}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t text-lg">
                      <span className="font-bold">Total:</span>
                      <span className="font-bold text-blue-600">
                        {(autoGradingResult?.totalObjectiveScore || 0) + (parseInt(theoryScore) || 0)}/{submission.maxScore}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feedback */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Feedback</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide feedback..."
                  />
                </div>

                {/* Submit Button */}
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-semibold flex items-center justify-center space-x-2"
                  >
                    <Save className="w-5 h-5" />
                    <span>Submit Final Grade</span>
                  </button>
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectTeacherGrading;