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
  Download,
  Upload,
  Eye,
  MessageSquare,
  Filter,
  Search,
  ChevronDown,
  Save,
  RotateCcw,
  Loader2
} from 'lucide-react';

const SubjectTeacherGrading = () => {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradingMode, setGradingMode] = useState('individual'); // 'individual' or 'bulk'
  const [bulkGrades, setBulkGrades] = useState({});

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

      const [submissionsRes, assignmentsRes, subjectsRes] = await Promise.all([
        fetch(`/api/protected/teacher/subject/grading?${params.toString()}`),
        fetch('/api/protected/teacher/subject/assignments?status=active'),
        fetch('/api/protected/teacher/subject/subjects')
      ]);

      if (!submissionsRes.ok || !assignmentsRes.ok || !subjectsRes.ok) {
        throw new Error('Failed to fetch grading data');
      }

      const submissionsData = await submissionsRes.json();
      const assignmentsData = await assignmentsRes.json();
      const subjectsData = await subjectsRes.json();

      setSubmissions(submissionsData.data?.submissions || []);
      setAssignments(assignmentsData.data?.assignments || []);
      setSubjects(subjectsData.data?.teacherSubjects || []);

    } catch (err) {
      setError(err.message);
      console.error('Fetch grading data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const gradeSubmission = async (submissionId, score, feedback = '') => {
    try {
      const response = await fetch('/api/protected/teacher/subject/grading', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          score: parseInt(score),
          feedback,
          gradedAt: new Date()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit grade');
      }

      alert('Grade submitted successfully');
      fetchGradingData(); // Refresh the list
      setSelectedSubmission(null);
    } catch (err) {
      console.error('Grade submission error:', err);
      alert('Failed to submit grade: ' + err.message);
    }
  };

  const handleBulkGrading = async () => {
    if (Object.keys(bulkGrades).length === 0) {
      alert('No grades to submit');
      return;
    }

    try {
      const gradesArray = Object.entries(bulkGrades).map(([submissionId, data]) => ({
        submissionId,
        score: parseInt(data.score),
        feedback: data.feedback || ''
      }));

      const response = await fetch('/api/protected/teacher/subject/grading/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          grades: gradesArray
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit bulk grades');
      }

      alert(`${gradesArray.length} grades submitted successfully`);
      setBulkGrades({});
      fetchGradingData();
    } catch (err) {
      console.error('Bulk grading error:', err);
      alert('Failed to submit bulk grades: ' + err.message);
    }
  };

  const updateBulkGrade = (submissionId, field, value) => {
    setBulkGrades(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'graded': return 'bg-green-100 text-green-800';
      case 'late': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'graded': return <CheckSquare className="w-4 h-4" />;
      case 'late': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Grading Center</h1>
              <p className="text-gray-600 mt-1">
                Review and grade student submissions • {submissions.length} pending
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setGradingMode('individual')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    gradingMode === 'individual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Individual
                </button>
                <button
                  onClick={() => setGradingMode('bulk')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    gradingMode === 'bulk'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Bulk Grading
                </button>
              </div>
              {gradingMode === 'bulk' && Object.keys(bulkGrades).length > 0 && (
                <button
                  onClick={handleBulkGrading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Submit {Object.keys(bulkGrades).length} Grades</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Submissions to Grade</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {submissions.map((submission) => (
              <div key={submission.id} className="p-6 hover:bg-gray-50 transition-colors">
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
                            {getStatusIcon(submission.status)}
                            <span className="ml-1">{submission.status}</span>
                          </span>
                          {submission.isLateSubmission && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Late
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Assignment:</span> {submission.assignment?.title}
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">Subject:</span> {submission.assignment?.subject}
                        </p>
                        <p className="text-sm text-gray-500">
                          Submitted: {new Date(submission.submittedAt).toLocaleDateString()} at {new Date(submission.submittedAt).toLocaleTimeString()}
                        </p>
                        
                        {submission.attachments && submission.attachments.length > 0 && (
                          <div className="mt-2 flex items-center text-sm text-blue-600">
                            <FileText className="w-4 h-4 mr-1" />
                            {submission.attachments.length} file(s) attached
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="ml-6">
                    {gradingMode === 'individual' ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>Grade</span>
                        </button>
                      </div>
                    ) : (
                      // Bulk grading inputs
                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-gray-600">Score</label>
                          <input
                            type="number"
                            min="0"
                            max={submission.maxScore || 100}
                            placeholder="Score"
                            value={bulkGrades[submission.id]?.score || ''}
                            onChange={(e) => updateBulkGrade(submission.id, 'score', e.target.value)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                        <div className="flex flex-col space-y-1">
                          <label className="text-xs text-gray-600">Feedback</label>
                          <input
                            type="text"
                            placeholder="Quick feedback..."
                            value={bulkGrades[submission.id]?.feedback || ''}
                            onChange={(e) => updateBulkGrade(submission.id, 'feedback', e.target.value)}
                            className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Show current grade if already graded */}
                {submission.score !== null && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-green-800">
                          Grade: {submission.score}/{submission.maxScore} ({Math.round((submission.score/submission.maxScore) * 100)}%)
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
              <p className="text-gray-600">
                {selectedStatus === 'pending' 
                  ? 'All caught up! No pending submissions to grade.'
                  : 'Try changing your filter criteria.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Individual Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Grade Submission</h2>
                <button
                  onClick={() => setSelectedSubmission(null)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Submission Details */}
                <div>
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Student Information</h3>
                    <div className="space-y-2">
                      <p><strong>Name:</strong> {selectedSubmission.student?.name}</p>
                      <p><strong>Assignment:</strong> {selectedSubmission.assignment?.title}</p>
                      <p><strong>Subject:</strong> {selectedSubmission.assignment?.subject}</p>
                      <p><strong>Submitted:</strong> {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                      <p><strong>Max Score:</strong> {selectedSubmission.maxScore || 100}</p>
                    </div>
                  </div>

                  {selectedSubmission.content && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6">
                      <h4 className="font-semibold text-gray-900 mb-2">Submission Content</h4>
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedSubmission.content}</p>
                      </div>
                    </div>
                  )}

                  {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">Attachments</h4>
                      <div className="space-y-2">
                        {selectedSubmission.attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-500" />
                            <a 
                              href={attachment} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline"
                            >
                              Attachment {index + 1}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column - Grading Form */}
                <div>
                  <GradingForm 
                    submission={selectedSubmission}
                    onSubmit={gradeSubmission}
                    onCancel={() => setSelectedSubmission(null)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Grading Form Component
const GradingForm = ({ submission, onSubmit, onCancel }) => {
  const [score, setScore] = useState(submission.score || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');
  const [gradeLevel, setGradeLevel] = useState('');

  const maxScore = submission.maxScore || 100;

  const calculateGradeLevel = (score) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  const handleScoreChange = (value) => {
    setScore(value);
    if (value && !isNaN(value)) {
      setGradeLevel(calculateGradeLevel(parseInt(value)));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!score || isNaN(score)) {
      alert('Please enter a valid score');
      return;
    }

    const scoreNum = parseInt(score);
    if (scoreNum < 0 || scoreNum > maxScore) {
      alert(`Score must be between 0 and ${maxScore}`);
      return;
    }

    onSubmit(submission.id, scoreNum, feedback);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Grade This Submission</h3>

      {/* Score Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Score (out of {maxScore})
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="number"
            min="0"
            max={maxScore}
            value={score}
            onChange={(e) => handleScoreChange(e.target.value)}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter score"
            required
          />
          {gradeLevel && (
            <div className="px-4 py-3 bg-gray-100 rounded-xl font-semibold text-gray-900">
              {gradeLevel}
            </div>
          )}
        </div>
        {score && (
          <p className="text-sm text-gray-500 mt-1">
            Percentage: {Math.round((score / maxScore) * 100)}%
          </p>
        )}
      </div>

      {/* Feedback */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Feedback (Optional)
        </label>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          placeholder="Provide constructive feedback to help the student improve..."
        />
      </div>

      {/* Quick Feedback Templates */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Quick Feedback</label>
        <div className="grid grid-cols-1 gap-2">
          {[
            "Excellent work! Keep it up.",
            "Good effort, but needs improvement.",
            "Please review the requirements more carefully.",
            "Well done! Your understanding is clear.",
            "Needs more detail and explanation."
          ].map((template, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setFeedback(template)}
              className="text-left px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          type="submit"
          className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
        >
          <CheckSquare className="w-5 h-5" />
          <span>Submit Grade</span>
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
        >
          Cancel
        </button>
      </div>

      {/* Additional Actions */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => {
              // TODO: Implement return submission for revision
              alert('Feature coming soon: Return for revision');
            }}
            className="flex-1 px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Return for Revision</span>
          </button>
          <button
            type="button"
            onClick={() => {
              // TODO: Implement message student feature
              alert('Feature coming soon: Message student');
            }}
            className="flex-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Student</span>
          </button>
        </div>
      </div>
    </form>
  );
};

export default SubjectTeacherGrading;