'use client'
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserCheck,
  BookOpen,
  Plus,
  Minus,
  CheckCircle,
  AlertCircle,
  Mail,
  Phone,
  Award,
  Calendar,
  Clock
} from 'lucide-react';

const CoordinatorTeachers = () => {
  const [teachersData, setTeachersData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    department: '',
    class: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalTeachers: 0
  });
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [assignment, setAssignment] = useState({
    subjectId: '',
    classes: [],
    action: 'assign'
  });
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchTeachersData();
  }, [filters, pagination.currentPage]);

  const fetchTeachersData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.department) params.append('department', filters.department);
      if (filters.class) params.append('class', filters.class);
      if (filters.search) params.append('search', filters.search);
      params.append('page', pagination.currentPage);
      params.append('limit', '20');

      const response = await fetch(`/api/protected/teachers/coordinator/teachers?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTeachersData(data.data);
        setPagination(data.data.pagination);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch teachers data');
      }
    } catch (error) {
      console.error('Teachers fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const openAssignModal = (teacher, action = 'assign') => {
    setSelectedTeacher(teacher);
    setAssignment({
      subjectId: '',
      classes: [],
      action
    });
    setShowAssignModal(true);
  };

  const handleAssignment = async () => {
    if (!selectedTeacher || !assignment.subjectId || assignment.classes.length === 0) {
      setError('Please select teacher, subject, and at least one class');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/protected/teachers/coordinator/teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          teacherId: selectedTeacher.id,
          subjectId: assignment.subjectId,
          classes: assignment.classes,
          action: assignment.action
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedTeacher(null);
        setAssignment({ subjectId: '', classes: [], action: 'assign' });
        fetchTeachersData(); // Refresh data
        alert(`Teacher ${assignment.action === 'assign' ? 'assigned' : 'unassigned'} successfully!`);
      } else {
        setError(data.error || 'Assignment failed');
      }
    } catch (error) {
      console.error('Assignment error:', error);
      setError('Network error occurred');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleClassToggle = (className) => {
    setAssignment(prev => ({
      ...prev,
      classes: prev.classes.includes(className)
        ? prev.classes.filter(c => c !== className)
        : [...prev.classes, className]
    }));
  };

  if (loading && !teachersData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600">Assign teachers to subjects and manage allocations</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-600">
            {teachersData?.statistics && (
              <>
                Total: {teachersData.statistics.totalTeachers} | 
                Subject: {teachersData.statistics.subjectTeachers} | 
                Class: {teachersData.statistics.classTeachers} |
                Unassigned: {teachersData.statistics.unassignedSubjects}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertCircle className="h-5 w-5 mr-3" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Teachers</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or subject..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
            >
              <option value="">All Departments</option>
              {teachersData?.filters?.availableDepartments?.map(dept => (
                <option key={dept} value={dept}>
                  {dept.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              value={filters.class}
              onChange={(e) => handleFilterChange('class', e.target.value)}
            >
              <option value="">All Classes</option>
              {teachersData?.filters?.coordinatorClasses?.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ subject: '', department: '', class: '', search: '' });
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center justify-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unassigned Subjects Alert */}
      {teachersData?.unassignedSubjects && teachersData.unassignedSubjects.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">
            Subjects Needing Teacher Assignment ({teachersData.unassignedSubjects.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {teachersData.unassignedSubjects.map(subject => (
              <div key={subject.id} className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                <div className="font-medium">{subject.name} ({subject.code})</div>
                <div className="text-xs">Classes: {subject.classes.join(', ')}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teachers List */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">
                Available Teachers ({teachersData?.teachers?.length || 0})
              </h3>
            </div>

            <div className="divide-y divide-gray-200">
              {teachersData?.teachers?.map((teacher) => (
                <div key={teacher.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <UserCheck className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-medium text-gray-900">{teacher.name}</h4>
                        <p className="text-sm text-gray-600">{teacher.department?.replace('_', ' ')}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500 flex items-center">
                            <Mail className="w-3 h-3 mr-1" />
                            {teacher.email}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" />
                            {teacher.totalSubjects} subjects
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <Users className="w-3 h-3 mr-1" />
                            {teacher.totalClasses} classes
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openAssignModal(teacher, 'assign')}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-1"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Assign</span>
                      </button>
                      {teacher.subjects.length > 0 && (
                        <button
                          onClick={() => openAssignModal(teacher, 'unassign')}
                          className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center space-x-1"
                        >
                          <Minus className="w-4 h-4" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Teacher's Current Assignments */}
                  {teacher.subjects.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Current Assignments:</h5>
                      <div className="space-y-2">
                        {teacher.subjects.map((subject, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {subject.name} ({subject.code})
                              </span>
                              <div className="text-xs text-gray-600">
                                Classes: {subject.assignedClasses.join(', ')}
                              </div>
                            </div>
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                              {subject.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-3 bg-gray-50 border-t">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.currentPage - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(pagination.currentPage + 1)}
                      disabled={!pagination.hasNext}
                      className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Subjects Overview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h3 className="text-lg font-medium text-gray-900">
                Subjects Overview
              </h3>
            </div>

            <div className="p-6">
              <div className="space-y-4">
                {teachersData?.subjects?.slice(0, 10).map((subject) => (
                  <div key={subject.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-gray-900">
                        {subject.name}
                      </h5>
                      <span className="text-xs text-gray-500">
                        ({subject.code})
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Classes: {subject.classes.join(', ')}
                    </div>

                    {subject.assignedTeachers.length > 0 ? (
                      <div className="space-y-1">
                        <div className="text-xs text-gray-500">Assigned Teachers:</div>
                        {subject.assignedTeachers.map((teacher, index) => (
                          <div key={index} className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                            {teacher.name} - {teacher.assignedClasses.join(', ')}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        No teacher assigned
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {assignment.action === 'assign' ? 'Assign Teacher' : 'Remove Assignment'}
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{selectedTeacher.name}</div>
              <div className="text-sm text-gray-600">{selectedTeacher.department?.replace('_', ' ')}</div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {assignment.action === 'assign' ? 'Select Subject to Assign' : 'Select Subject to Remove'} *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={assignment.subjectId}
                  onChange={(e) => setAssignment(prev => ({ ...prev, subjectId: e.target.value }))}
                >
                  <option value="">Select subject...</option>
                  {assignment.action === 'assign' 
                    ? teachersData?.subjects?.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code}) - {subject.category}
                        </option>
                      ))
                    : selectedTeacher.subjects?.map(subject => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name} ({subject.code})
                        </option>
                      ))
                  }
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Classes * ({assignment.classes.length} selected)
                </label>
                <div className="max-h-40 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {(assignment.action === 'assign' 
                    ? teachersData?.filters?.coordinatorClasses 
                    : selectedTeacher.availableClasses
                  )?.map(className => (
                    <label key={className} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={assignment.classes.includes(className)}
                        onChange={() => handleClassToggle(className)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">{className}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignment}
                disabled={isAssigning || !assignment.subjectId || assignment.classes.length === 0}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {assignment.action === 'assign' ? (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Assign Teacher</span>
                      </>
                    ) : (
                      <>
                        <Minus className="w-4 h-4" />
                        <span>Remove Assignment</span>
                      </>
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorTeachers;