'use client';

import { useState, useEffect } from 'react';
import { Users, BookOpen, AlertCircle, Check, X, Search, Filter } from 'lucide-react';

export default function TeacherAssignmentManager() {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [assignmentMode, setAssignmentMode] = useState('add'); // add or replace
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [viewMode, setViewMode] = useState('teachers'); // teachers or subjects

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/protected/admin/subjects/teacher-assignments');
      const data = await response.json();

      if (data.success) {
        setTeachers(data.data.teachers || []);
        setSubjects(data.data.subjects || []);
        setStats(data.data.stats);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignSubjects = async () => {
    if (!selectedTeacher || selectedSubjects.length === 0) {
      alert('Please select a teacher and at least one subject');
      return;
    }

    try {
      const response = await fetch(
        `/api/protected/admin/teachers/${selectedTeacher.id}/subjects/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            subjectIds: selectedSubjects,
            replaceExisting: assignmentMode === 'replace',
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        
        // Show warnings if any
        if (data.data.warnings && data.data.warnings.length > 0) {
          const warningMessage = data.data.warnings
            .map(w => `${w.subject}: ${w.reason}`)
            .join('\n');
          alert(`⚠️ Warnings:\n${warningMessage}`);
        }

        // Reset and refresh
        setSelectedTeacher(null);
        setSelectedSubjects([]);
        fetchData();
      } else {
        alert(data.error || 'Failed to assign subjects');
      }
    } catch (error) {
      alert('An error occurred');
    }
  };

  const toggleSubjectSelection = (subjectId) => {
    setSelectedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const getWorkloadColor = (status) => {
    const colors = {
      unassigned: 'text-red-600 bg-red-50',
      light: 'text-green-600 bg-green-50',
      moderate: 'text-yellow-600 bg-yellow-50',
      heavy: 'text-orange-600 bg-orange-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const getCoverageColor = (status) => {
    const colors = {
      critical: 'text-red-600 bg-red-50',
      minimal: 'text-orange-600 bg-orange-50',
      understaffed: 'text-yellow-600 bg-yellow-50',
      good: 'text-green-600 bg-green-50',
    };
    return colors[status] || 'text-gray-600 bg-gray-50';
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'ALL' || teacher.teacherRole === filterRole;
    
    return matchesSearch && matchesRole;
  });

  const filteredSubjects = subjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Teacher-Subject Assignment</h1>
        <p className="text-gray-600 mt-1">Assign subjects to teachers and monitor coverage</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Teachers</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</p>
              </div>
              <Users className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">With Assignments</p>
                <p className="text-2xl font-bold text-green-600">{stats.teachersWithAssignments}</p>
              </div>
              <Check className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Without Assignments</p>
                <p className="text-2xl font-bold text-red-600">{stats.teachersWithoutAssignments}</p>
              </div>
              <AlertCircle className="text-red-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Uncovered Subjects</p>
                <p className="text-2xl font-bold text-orange-600">{stats.subjectsWithoutTeachers}</p>
              </div>
              <BookOpen className="text-orange-600" size={32} />
            </div>
          </div>
        </div>
      )}

      {/* View Mode Tabs */}
      <div className="bg-white rounded-lg shadow p-1 flex gap-1">
        <button
          onClick={() => setViewMode('teachers')}
          className={`flex-1 px-4 py-2 rounded-lg transition ${
            viewMode === 'teachers'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Teacher View
        </button>
        <button
          onClick={() => setViewMode('subjects')}
          className={`flex-1 px-4 py-2 rounded-lg transition ${
            viewMode === 'subjects'
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          Subject Coverage View
        </button>
      </div>

      {/* Assignment Panel */}
      {selectedTeacher && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                Assigning to: {selectedTeacher.fullName}
              </h3>
              <p className="text-sm text-gray-600">
                Current assignments: {selectedTeacher.assignments.totalSubjects}
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedTeacher(null);
                setSelectedSubjects([]);
              }}
              className="text-gray-600 hover:text-gray-900"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="add"
                checked={assignmentMode === 'add'}
                onChange={(e) => setAssignmentMode(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Add to existing</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                value="replace"
                checked={assignmentMode === 'replace'}
                onChange={(e) => setAssignmentMode(e.target.value)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm text-gray-700">Replace all</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAssignSubjects}
              disabled={selectedSubjects.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign {selectedSubjects.length} Subject(s)
            </button>
            <button
              onClick={() => setSelectedSubjects([])}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={viewMode === 'teachers' ? "Search teachers..." : "Search subjects..."}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {viewMode === 'teachers' && (
            <div>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Roles</option>
                <option value="DIRECTOR">Directors</option>
                <option value="COORDINATOR">Coordinators</option>
                <option value="SUBJECT_TEACHER">Subject Teachers</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content Area */}
      {viewMode === 'teachers' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teachers List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">Teachers ({filteredTeachers.length})</h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredTeachers.map(teacher => (
                <div
                  key={teacher.id}
                  onClick={() => setSelectedTeacher(teacher)}
                  className={`px-6 py-4 border-b hover:bg-gray-50 cursor-pointer transition ${
                    selectedTeacher?.id === teacher.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{teacher.fullName}</h4>
                      <p className="text-sm text-gray-600">{teacher.employeeId}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {teacher.teacherRole}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getWorkloadColor(teacher.workload.status)}`}>
                          {teacher.workload.subjectCount} subjects
                        </span>
                      </div>
                    </div>
                    {selectedTeacher?.id === teacher.id && (
                      <Check className="text-blue-600" size={20} />
                    )}
                  </div>
                  
                  {teacher.assignments.totalSubjects > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      {teacher.assignments.subjects.slice(0, 3).map(s => s.name).join(', ')}
                      {teacher.assignments.totalSubjects > 3 && ` +${teacher.assignments.totalSubjects - 3} more`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Subjects List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b">
              <h3 className="font-semibold text-gray-900">
                Subjects ({selectedTeacher ? 'Select to assign' : 'Select a teacher first'})
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {filteredSubjects.map(subject => (
                <label
                  key={subject.id}
                  className={`flex items-center gap-3 px-6 py-4 border-b hover:bg-gray-50 cursor-pointer ${
                    !selectedTeacher ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedSubjects.includes(subject.id)}
                    onChange={() => toggleSubjectSelection(subject.id)}
                    disabled={!selectedTeacher}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <p className="text-sm text-gray-600">{subject.code}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                        {subject.subjectType}
                      </span>
                      {subject.teachers.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {subject.teachers.length} teacher(s)
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Subject Coverage View */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teachers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSubjects.map(subject => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-900">{subject.name}</p>
                      <p className="text-sm text-gray-600">{subject.code}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                      {subject.subjectType}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      {subject.teachers.length > 0 ? (
                        <div>
                          <p className="font-medium">{subject.coverage.teacherCount} assigned</p>
                          <p className="text-gray-500 text-xs">
                            {subject.teachers.slice(0, 2).map(t => t.name).join(', ')}
                            {subject.teachers.length > 2 && ` +${subject.teachers.length - 2}`}
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-600">No teachers</p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900">{subject.coverage.enrollmentCount}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${getCoverageColor(subject.coverage.status)}`}>
                      {subject.coverage.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
