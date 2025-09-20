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
  MapPin
} from 'lucide-react';

const CoordinatorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    class: '',
    arm: '',
    search: ''
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalStudents: 0
  });
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableArms, setAvailableArms] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [showAssignArm, setShowAssignArm] = useState(false);
  const [armAssignment, setArmAssignment] = useState({
    arm: '',
    className: ''
  });
  const [isAssigning, setIsAssigning] = useState(false);

  const armOptions = ['silver', 'diamond', 'mercury', 'platinum', 'gold', 'ruby'];
  const classLevels = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];

  useEffect(() => {
    fetchStudents();
  }, [filters, pagination.currentPage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.class) params.append('class', filters.class);
      if (filters.arm) params.append('arm', filters.arm);
      if (filters.search) params.append('search', filters.search);
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

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
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

  const handleAssignArm = async () => {
    if (!armAssignment.arm || !armAssignment.className || selectedStudents.length === 0) {
      setError('Please select students, arm, and class level');
      return;
    }

    setIsAssigning(true);
    try {
      const response = await fetch('/api/protected/teachers/coordinator/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          studentIds: selectedStudents,
          arm: armAssignment.arm,
          className: armAssignment.className
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowAssignArm(false);
        setSelectedStudents([]);
        setArmAssignment({ arm: '', className: '' });
        fetchStudents(); // Refresh data
        alert(`Successfully assigned ${data.data.successful.length} students to ${data.data.className}`);
      } else {
        setError(data.error || 'Failed to assign arms');
      }
    } catch (error) {
      console.error('Assign arm error:', error);
      setError('Network error occurred');
    } finally {
      setIsAssigning(false);
    }
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
          <p className="text-gray-600">Organize students into classes and arms</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAssignArm(true)}
            disabled={selectedStudents.length === 0}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Assign Arms ({selectedStudents.length})</span>
          </button>
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

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilters({ class: '', arm: '', search: '' });
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
              Students ({pagination.totalStudents})
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
                  Current Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    <div className="text-sm text-gray-900">
                      {student.className || 'Not assigned'}
                    </div>
                    {student.arm && (
                      <div className="text-xs text-purple-600 font-medium">
                        {student.arm.toUpperCase()} ARM
                      </div>
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
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      student.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
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

      {/* Assign Arm Modal */}
      {showAssignArm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Assign Students to Arm
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selected Students: {selectedStudents.length}
                </label>
                <div className="text-sm text-gray-600">
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
                  value={armAssignment.className}
                  onChange={(e) => setArmAssignment(prev => ({ ...prev, className: e.target.value }))}
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
                  value={armAssignment.arm}
                  onChange={(e) => setArmAssignment(prev => ({ ...prev, arm: e.target.value }))}
                >
                  <option value="">Select arm...</option>
                  {armOptions.map(arm => (
                    <option key={arm} value={arm}>{arm.charAt(0).toUpperCase() + arm.slice(1)}</option>
                  ))}
                </select>
              </div>

              {armAssignment.className && armAssignment.arm && (
                <div className="p-3 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-800">
                    Students will be assigned to: <strong>{armAssignment.className} {armAssignment.arm}</strong>
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAssignArm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button
                onClick={handleAssignArm}
                disabled={isAssigning || !armAssignment.className || !armAssignment.arm}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {isAssigning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Assigning...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Assign Arms</span>
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