// /app/protected/teacher/subject/grading/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Clock,
  Users,
  FileText,
  Download,
  Upload,
  Search,
  Filter,
  Eye,
  Edit,
  Save,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Star,
  BookOpen,
  User,
  Loader2
} from 'lucide-react';

const SubjectTeacherGrading = () => {
  const [submissions, setSubmissions] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showGradingModal, setShowGradingModal] = useState(false);
  const [gradingData, setGradingData] = useState({ score: '', feedback: '' });

  useEffect(() => {
    fetchSubmissions();
    fetchAssignments();
  }, [selectedAssignment, selectedStatus, sortBy]);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedAssignment !== 'all') params.append('assignmentId', selectedAssignment);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (sortBy !== 'submittedAt') params.append('sortBy', sortBy);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/protected/teacher/subject/grading?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch submissions: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubmissions(data.data.submissions || []);
      } else {
        throw new Error(data.error || 'Failed to load submissions');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch submissions error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/assignments?status=active');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAssignments(data.data.assignments || []);
        }
      }
    } catch (err) {
      console.error('Fetch assignments error:', err);
    }
  };

  const gradeSubmission = async (submissionId, score, feedback) => {
    try {
      const response = await fetch('/api/protected/teacher/subject/grading', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId,
          score: parseInt(score),
          feedback,
          status: 'graded'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to grade submission');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowGradingModal(false);
        setSelectedSubmission(null);
        setGradingData({ score: '', feedback: '' });
        fetchSubmissions(); // Refresh submissions
        alert('Submission graded successfully');
      } else {
        throw new Error(data.error || 'Failed to grade submission');
      }
    } catch (err) {
      console.error('Grade submission error:', err);
      alert('Failed to grade submission: ' + err.message);
    }
  };

  const bulkGrade = async (submissionIds, score) => {
    try {
      const response = await fetch('/api/protected/teacher/subject/grading/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionIds,
          score: parseInt(score),
          feedback: `Bulk graded: ${score} points`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to bulk grade submissions');
      }

      const data = await response.json();
      
      if (data.success) {
        fetchSubmissions(); // Refresh submissions
        alert(`Successfully graded ${data.data.gradedCount} submissions`);
      } else {
        throw new Error(data.error || 'Failed to bulk grade submissions');
      }
    } catch (err) {
      console.error('Bulk grade error:', err);
      alert('Failed to bulk grade: ' + err.message);
    }
  };

  const getStatusColor = (status, isLate) => {
    if (isLate && status !== 'graded') return 'bg-red-100 text-red-800 border-red-200';
    if (status === 'graded') return 'bg-green-100 text-green-800 border-green-200';
    if (status === 'submitted') return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status, isLate) => {
    if (isLate && status !== 'graded') return <Clock className="w-4 h-4" />;
    if (status === 'graded') return <CheckCircle className="w-4 h-4" />;
    if (status === 'submitted') return <FileText className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const submissionDate = new Date(date);
    const diffInMinutes = Math.floor((now - submissionDate) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    if (searchTerm === '') return true;
    
    const studentName = `${submission.student.firstName} ${submission.student.lastName}`.toLowerCase();
    const assignmentTitle = submission.assignment.title.toLowerCase();
    
    return studentName.includes(searchTerm.toLowerCase()) || 
           assignmentTitle.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Submissions</h2>
            <p className="text-sm text-gray-600">Fetching assignments to grade...</p>
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
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Submissions</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchSubmissions}
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
                Grade assignments and provide feedback • {filteredSubmissions.length} submissions
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const pendingIds = filteredSubmissions
                    .filter(s => s.status === 'submitted')
                    .map(s => s.id);
                  if (pendingIds.length > 0) {
                    const score = prompt('Enter score for bulk grading (out of 100):');
                    if (score && !isNaN(score)) {
                      bulkGrade(pendingIds, score);
                    }
                  } else {
                    alert('No pending submissions to grade');
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Bulk Grade</span>
              </button>
              <button
                onClick={() => window.location.href = '/protected/teacher/subject/reports?type=grading_summary'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by student name or assignment..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={selectedAssignment}
                onChange={(e) => setSelectedAssignment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Assignments</option>
                {assignments.map(assignment => (
                  <option key={assignment.id} value={assignment.id}>{assignment.title}</option>
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
                <option value="submitted">Pending Grading</option>
                <option value="graded">Graded</option>
                <option value="late">Late Submissions</option>
              </select>
            </div>

            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="submittedAt">Sort by Date</option>
                <option value="student">Sort by Student</option>
                <option value="assignment">Sort by Assignment</option>
                <option value="score">Sort by Score</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submissions List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Submissions ({filteredSubmissions.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assignment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {submission.student.firstName} {submission.student.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{submission.student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{submission.assignment.title}</div>
                      <div className="text-sm text-gray-500">
                        Due: {new Date(submission.assignment.dueDate).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(submission.submittedAt).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatTimeAgo(submission.submittedAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(submission.status, submission.isLateSubmission)}`}>
                        {getStatusIcon(submission.status, submission.isLateSubmission)}
                        <span className="ml-1">
                          {submission.isLateSubmission && submission.status !== 'graded' ? 'Late' : 
                           submission.status === 'graded' ? 'Graded' : 'Pending'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {submission.score !== null ? (
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {submission.score}/{submission.maxScore}
                          </span>
                          <span className="ml-2 text-sm text-gray-500">
                            ({Math.round((submission.score / submission.maxScore) * 100)}%)
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not graded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setGradingData({
                              score: submission.score || '',
                              feedback: submission.feedback || ''
                            });
                            setShowGradingModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          {submission.status === 'graded' ? <Edit className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => {
                            // View submission details
                            window.open(`/protected/teacher/subject/submissions/${submission.id}`, '_blank');
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredSubmissions.length === 0 && (
            <div className="p-12 text-center">
              <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Submissions Found</h3>
              <p className="text-gray-600">
                {searchTerm || selectedAssignment !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'No submissions available for grading yet.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grading Modal */}
      {showGradingModal && selectedSubmission && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Grade Submission</h2>
                <button
                  onClick={() => setShowGradingModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Student & Assignment Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Student</label>
                    <p className="text-gray-900">
                      {selectedSubmission.student.firstName} {selectedSubmission.student.lastName}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Assignment</label>
                    <p className="text-gray-900">{selectedSubmission.assignment.title}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Submitted</label>
                    <p className="text-gray-900">
                      {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Max Score</label>
                    <p className="text-gray-900">{selectedSubmission.maxScore} points</p>
                  </div>
                </div>
              </div>

              {/* Submission Content */}
              {selectedSubmission.content && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Submission Content</label>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-48 overflow-y-auto">
                    <p className="text-gray-900 whitespace-pre-wrap">{selectedSubmission.content}</p>
                  </div>
                </div>
              )}

              {/* Attachments */}
              {selectedSubmission.attachments && selectedSubmission.attachments.length > 0 && (
                <div className="mb-6">
                  <label className="text-sm font-medium text-gray-700 block mb-2">Attachments</label>
                  <div className="space-y-2">
                    {selectedSubmission.attachments.map((attachment, index) => (
                      <a
                        key={index}
                        href={attachment}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        <FileText className="w-5 h-5 text-blue-600 mr-3" />
                        <span className="text-blue-700">Attachment {index + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Grading Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Score (out of {selectedSubmission.maxScore})
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={selectedSubmission.maxScore}
                    value={gradingData.score}
                    onChange={(e) => setGradingData({...gradingData, score: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter score"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">Feedback</label>
                  <textarea
                    value={gradingData.feedback}
                    onChange={(e) => setGradingData({...gradingData, feedback: e.target.value})}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Provide feedback to the student..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    if (!gradingData.score || isNaN(gradingData.score)) {
                      alert('Please enter a valid score');
                      return;
                    }
                    gradeSubmission(selectedSubmission.id, gradingData.score, gradingData.feedback);
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Grade</span>
                </button>
                <button
                  onClick={() => setShowGradingModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectTeacherGrading;