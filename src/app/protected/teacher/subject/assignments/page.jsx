// /app/protected/teacher/subject/assignments/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  Download,
  Upload,
  BookOpen,
  Target,
  MoreVertical,
  Loader2,
  X
} from 'lucide-react';

const SubjectTeacherAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSubject, setFilterSubject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    fetchAssignments();
  }, [filterSubject, filterStatus, sortBy]);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filterSubject !== 'all') params.append('subjectId', filterSubject);
      if (filterStatus !== 'all') params.append('status', filterStatus);
      params.append('sortBy', sortBy);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/protected/teacher/subject/assignments?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch assignments: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAssignments(data.data.assignments || []);
      } else {
        throw new Error(data.error || 'Failed to load assignments');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch assignments error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/subjects');
      
      if (!response.ok) {
        console.error('Failed to fetch subjects');
        return;
      }

      const data = await response.json();
      if (data.success) {
        // API returns subjects directly, not nested in data.data
        setSubjects(data.subjects || []);
      }
    } catch (err) {
      console.error('Fetch subjects error:', err);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeoutId = setTimeout(() => {
      fetchAssignments();
    }, 500);
    
    setSearchTimeout(timeoutId);
  };

  const deleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/protected/teacher/subject/assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete assignment');
      }

      alert('Assignment deleted successfully');
      fetchAssignments();
    } catch (err) {
      console.error('Delete assignment error:', err);
      alert('Failed to delete assignment: ' + err.message);
    }
  };

  const toggleAssignmentStatus = async (assignmentId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'closed' : 'active';
      
      const response = await fetch(`/api/protected/teacher/subject/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update assignment');
      }

      fetchAssignments();
    } catch (err) {
      console.error('Toggle assignment status error:', err);
      alert('Failed to update assignment: ' + err.message);
    }
  };

  const getStatusColor = (status, dueDate) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    
    if (isOverdue) return 'bg-red-100 text-red-800';
    if (status === 'active') return 'bg-green-100 text-green-800';
    if (status === 'closed') return 'bg-gray-100 text-gray-800';
    if (status === 'draft') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status, dueDate) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    
    if (isOverdue) return <AlertTriangle className="w-4 h-4" />;
    if (status === 'active') return <CheckCircle2 className="w-4 h-4" />;
    if (status === 'closed') return <Clock className="w-4 h-4" />;
    if (status === 'draft') return <Edit className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusLabel = (status, dueDate) => {
    const isOverdue = new Date(dueDate) < new Date() && status === 'active';
    if (isOverdue) return 'Overdue';
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="text-gray-700">Loading assignments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Assignments</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAssignments}
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
              <h1 className="text-3xl font-bold text-gray-900">My Assignments</h1>
              <p className="text-gray-600 mt-1">
                Manage assignments across your subjects • {assignments.length} total
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = '/protected/teacher/subject/assignments/create'}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Assignment</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search assignments by title..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Subject Filter */}
            <div className="sm:w-48">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Subjects</option>
                {subjects.map(teacherSubject => (
                  <option key={teacherSubject.id} value={teacherSubject.subjectId}>
                    {teacherSubject.subject?.name || 'Unknown Subject'}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="sm:w-48">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="sm:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="dueDate">Sort by Due Date</option>
                <option value="title">Sort by Title</option>
                <option value="createdAt">Sort by Created Date</option>
              </select>
            </div>
          </div>
        </div>

        {/* Assignments Grid */}
        {assignments.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assignments.map((assignment) => {
              const isOverdue = new Date(assignment.dueDate) < new Date() && assignment.status === 'active';
              const submissionCount = assignment._count?.submissions || 0;
              const totalStudents = assignment.classes?.length > 0 ? 
                (assignment._count?.totalStudents || 0) : 0;
              const submissionPercentage = totalStudents > 0 ? 
                Math.round((submissionCount / totalStudents) * 100) : 0;
              
              return (
                <div key={assignment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                  {/* Assignment Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{assignment.title}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{assignment.subject?.name || 'Unknown Subject'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Assignment Type Badge */}
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {assignment.assignmentType?.replace('_', ' ').toUpperCase() || 'HOMEWORK'}
                    </span>
                  </div>

                  {/* Assignment Details */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Due Date:</span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                        {new Date(assignment.dueDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Submissions:</span>
                      <span className="font-medium text-gray-900">
                        {submissionCount}/{totalStudents}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Max Score:</span>
                      <span className="font-medium text-gray-900">
                        {assignment.maxScore} points
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Status:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(assignment.status, assignment.dueDate)}`}>
                        {getStatusIcon(assignment.status, assignment.dueDate)}
                        <span className="ml-1">
                          {getStatusLabel(assignment.status, assignment.dueDate)}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Classes */}
                  {assignment.classes && assignment.classes.length > 0 && (
                    <div className="mb-4">
                      <span className="text-xs text-gray-600">Classes: </span>
                      <span className="text-xs text-gray-900">
                        {assignment.classes.join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Submission Progress</span>
                      <span>{submissionPercentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${submissionPercentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => window.location.href = `/protected/teacher/subject/assignments/${assignment.id}`}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => window.location.href = `/protected/teacher/subject/grading?assignment=${assignment.id}`}
                      className="flex-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Grade</span>
                    </button>
                  </div>

                  {/* Additional Actions */}
                  <div className="flex space-x-2 mt-2">
                    <button
                      onClick={() => toggleAssignmentStatus(assignment.id, assignment.status)}
                      className="flex-1 px-3 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium"
                      disabled={assignment.status === 'draft'}
                    >
                      {assignment.status === 'active' ? 'Close' : assignment.status === 'closed' ? 'Reopen' : 'Activate'}
                    </button>
                    <button
                      onClick={() => window.location.href = `/protected/teacher/subject/assignments/${assignment.id}/edit`}
                      className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAssignment(assignment.id)}
                      className="px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Assignments Found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || filterSubject !== 'all' || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Create your first assignment to get started.'
              }
            </p>
            <button
              onClick={() => window.location.href = '/protected/teacher/subject/assignments/create'}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Assignment</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectTeacherAssignments;