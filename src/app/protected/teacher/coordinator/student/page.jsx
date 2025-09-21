'use client'
import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Toggle,
  BookOpen
} from 'lucide-react';

const CoordinatorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAssigned, setShowAssigned] = useState(true); // Toggle state
  const [filters, setFilters] = useState({
    class: '',
    arm: '',
    department: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableArms, setAvailableArms] = useState([]);
  const [availableDepartments, setAvailableDepartments] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [assignmentForm, setAssignmentForm] = useState({
    arm: '',
    className: '',
    department: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [summary, setSummary] = useState({});

  const armOptions = ['silver', 'diamond', 'mercury', 'platinum', 'gold', 'ruby'];
  const classLevels = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];
  const departments = ['science', 'arts', 'social_science'];

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.currentPage, showAssigned]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.arm) params.append('arm', filters.arm);
      if (filters.department) params.append('department', filters.department);
      if (filters.search) params.append('search', filters.search);
      params.append('assigned', showAssigned.toString());
      params.append('page', pagination.currentPage);
      params.append('limit', '20');

      const response = await fetch(`/api/protected/teachers/coordinator/students?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students);
        setPagination(data.data.pagination);
        setAvailableClasses(data.data.filters.availableClasses);
        setAvailableArms(data.data.filters.availableArms);
        setAvailableDepartments(data.data.filters.availableDepartments);
        setSummary(data.data.summary);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Students fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleToggleView = () => {
    setShowAssigned(!showAssigned);
    setSelectedStudents([]);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleAssignStudents = async () => {
    if (!assignmentForm.arm || !assignmentForm.className || selectedStudents.length === 0) {
      setError('Please select students, arm, and class level');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/protected/teachers/coordinator/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentIds: selectedStudents,
          arm: assignmentForm.arm,
          className: assignmentForm.className,
          department: assignmentForm.department || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowAssignModal(false);
        setSelectedStudents([]);
        setAssignmentForm({ arm: '', className: '', department: '' });
        fetchStudents();
        alert(`Successfully assigned ${data.data.successful.length} students`);
      } else {
        setError(data.error || 'Failed to assign students');
      }
    } catch (error) {
      console.error('Assign students error:', error);
      setError('Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditStudent = async () => {
    if (!editingStudent || !assignmentForm.className) {
      setError('Class name is required');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/protected/teachers/coordinator/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentId: editingStudent.id,
          className: assignmentForm.className,
          department: assignmentForm.department || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditModal(false);
        setEditingStudent(null);
        setAssignmentForm({ arm: '', className: '', department: '' });
        fetchStudents();
        alert('Student assignment updated successfully');
      } else {
        setError(data.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Edit student error:', error);
      setError('Network error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setAssignmentForm({
      arm: student.arm || '',
      className: student.className || '',
      department: student.department || ''
    });
    setShowEditModal(true);
  };

  const isSSLevel = (className) => {
    return className && className.startsWith('SS');
  };

  if (loading && students.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600">
            {showAssigned ? 'Manage assigned students' : 'Assign unassigned students'}
          </p>
        </div>
        <div className="flex space-x-3">
          {/* Toggle Button */}
          <button
            onClick={handleToggleView}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200 ${
              showAssigned 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            <Toggle className="w-4 h-4" />
            <span>{showAssigned ? 'Showing Assigned' : 'Showing Unassigned'}</span>
          </button>

          {/* Action Button */}
          {showAssigned ? (
            <span className="text-sm text-gray-500 flex items-center">
              Click edit to modify assignments
            </span>
          ) : (
            <button
              onClick={() => setShowAssignModal(true)}
              disabled={selectedStudents.length === 0}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Selected ({selectedStudents.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalStudents || 0}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-green-600">{summary.assignedCount || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Unassigned</p>
              <p className="text-2xl font-bold text-orange-600">{summary.unassignedCount || 0}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-2xl font-bold text-purple-600">{summary.classCount || 0}</p>
            </div>
            <BookOpen className="w-8 h-8 text-purple-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or ID..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {showAssigned && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.class}
                  onChange={(e) => handleFilterChange('class', e.target.value)}
                >
                  <option value="">All Classes</option>
                  {availableClasses.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Arm</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.arm}
                  onChange={(e) => handleFilterChange('arm', e.target.value)}
                >
                  <option value="">All Arms</option>
                  {availableArms.map(arm => (
                    <option key={arm} value={arm}>{arm}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={filters.department}
                  onChange={(e) => handleFilterChange('department', e.target.value)}
                >
                  <option value="">All Departments</option>
                  {availableDepartments.map(dept => (
                    <option key={dept} value={dept}>
                      {dept === 'science' ? 'Science' : 
                       dept === 'arts' ? 'Arts' : 
                       dept === 'social_science' ? 'Social Science' : dept}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ class: '', arm: '', department: '', search: '' });
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

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {showAssigned ? 'Assigned Students' : 'Unassigned Students'} ({pagination.totalStudents})
            </h3>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedStudents.length === students.length && students.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-600">Select All</span>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Select
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {showAssigned ? 'Current Assignment' : 'Status'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {student.studentId || 'Not assigned'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {showAssigned ? (
                      <div>
                        <div className="text-sm text-gray-900">
                          {student.className || 'Not assigned'}
                        </div>
                        {student.arm && (
                          <div className="text-xs text-purple-600 font-medium">
                            {student.arm.toUpperCase()} ARM
                          </div>
                        )}
                        {student.department && (
                          <div className="text-xs text-blue-600">
                            {student.department === 'science' ? 'Science' :
                             student.department === 'arts' ? 'Arts' :
                             student.department === 'social_science' ? 'Social Science' :
                             student.department}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {student.email && (
                        <div className="flex items-center space-x-1 mb-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="truncate max-w-32">{student.email}</span>
                        </div>
                      )}
                      {student.parentPhone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span>{student.parentPhone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {showAssigned && (
                      <button
                        onClick={() => openEditModal(student)}
                        className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-1 text-sm bg-white border rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
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

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Students to Class
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Students: {selectedStudents.length}
                </label>
                <div className="text-sm text-gray-600 max-h-20 overflow-y-auto">
                  {students
                    .filter(s => selectedStudents.includes(s.id))
                    .map(s => s.fullName)
                    .join(', ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Level *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={assignmentForm.className}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, className: e.target.value }))}
                >
                  <option value="">Select class level...</option>
                  {classLevels.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arm *
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={assignmentForm.arm}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, arm: e.target.value }))}
                >
                  <option value="">Select arm...</option>
                  {armOptions.map(arm => (
                    <option key={arm} value={arm}>{arm.charAt(0).toUpperCase() + arm.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Department field for SS classes only */}
              {assignmentForm.className && isSSLevel(assignmentForm.className) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Optional for SS classes)
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={assignmentForm.department}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select department (optional)...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept === 'science' ? 'Science' :
                         dept === 'arts' ? 'Arts' :
                         dept === 'social_science' ? 'Social Science' : dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {assignmentForm.className && assignmentForm.arm && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Students will be assigned to: <strong>{assignmentForm.className} {assignmentForm.arm}</strong>
                    {assignmentForm.department && (
                      <span className="block text-xs mt-1">
                        Department: {assignmentForm.department === 'science' ? 'Science' :
                                   assignmentForm.department === 'arts' ? 'Arts' :
                                   assignmentForm.department === 'social_science' ? 'Social Science' :
                                   assignmentForm.department}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignStudents}
                disabled={isProcessing || !assignmentForm.className || !assignmentForm.arm}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Assign Students</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Student Assignment
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Student
                </label>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium">{editingStudent.fullName}</p>
                  <p className="text-xs text-gray-500">ID: {editingStudent.studentId || 'Not assigned'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Assignment *
                </label>
                <input
                  type="text"
                  placeholder="e.g., SS1 silver"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={assignmentForm.className}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, className: e.target.value }))}
                />
              </div>

              {/* Department field for SS classes only */}
              {assignmentForm.className && isSSLevel(assignmentForm.className) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department (Optional for SS classes)
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    value={assignmentForm.department}
                    onChange={(e) => setAssignmentForm(prev => ({ ...prev, department: e.target.value }))}
                  >
                    <option value="">Select department (optional)...</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>
                        {dept === 'science' ? 'Science' :
                         dept === 'arts' ? 'Arts' :
                         dept === 'social_science' ? 'Social Science' : dept}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Previous:</strong> {editingStudent.className || 'Unassigned'}
                  {editingStudent.department && (
                    <span className="block text-xs">
                      Department: {editingStudent.department}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleEditStudent}
                disabled={isProcessing || !assignmentForm.className}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Update Assignment</span>
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

export default CoordinatorStudents;