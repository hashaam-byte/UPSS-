'use client'
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Users, BookOpen, Filter, Eye, Save, X, AlertCircle, RefreshCw } from 'lucide-react';

const TimetableManagementPage = () => {
  const [timetableData, setTimetableData] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [availableTeachers, setAvailableTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]); // New state for all subjects from subjects API
  const [periods, setPeriods] = useState({});
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [statistics, setStatistics] = useState({});
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    view: 'grid',
    className: '',
    dayOfWeek: '',
    teacherId: ''
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    className: '',
    dayOfWeek: '',
    period: '',
    subject: '',
    teacherId: ''
  });

  const viewOptions = [
    { value: 'grid', label: 'Grid View', icon: Calendar },
    { value: 'list', label: 'List View', icon: Clock },
    { value: 'teacher', label: 'Teacher View', icon: Users }
  ];

  useEffect(() => {
    fetchTimetableData();
    fetchAllSubjects(); // Fetch subjects when component mounts
  }, [filters]);

  // New function to fetch all subjects from the subjects API
  const fetchAllSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const response = await fetch('/api/protected/teachers/director/subjects', {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.data.subjects) {
        setAllSubjects(data.data.subjects);
      } else {
        console.error('Failed to fetch subjects:', data.error || 'Unknown error');
        // Fallback to empty array if subjects API fails
        setAllSubjects([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      // Fallback to empty array if request fails
      setAllSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const fetchTimetableData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.className) params.append('class', filters.className);
      if (filters.dayOfWeek) params.append('day', filters.dayOfWeek);
      if (filters.teacherId) params.append('teacher', filters.teacherId);
      params.append('view', filters.view);

      const response = await fetch(`/api/protected/teachers/director/timetable?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success) {
        setTimetableData(data.data.timetable || {});
        setAvailableClasses(data.data.availableClasses || []);
        setAvailableTeachers(data.data.availableTeachers || []);
        setSubjects(data.data.subjects || []); // Keep this for backward compatibility
        setPeriods(data.data.periods || {});
        setDaysOfWeek(data.data.daysOfWeek || []);
        setStatistics(data.data.statistics || {});
      } else {
        throw new Error(data.error || 'Failed to fetch timetable data');
      }
    } catch (error) {
      console.error('Error fetching timetable data:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter subjects based on selected class
  const getFilteredSubjects = () => {
    if (!formData.className) {
      return allSubjects;
    }

    // Filter subjects that are available for the selected class
    return allSubjects.filter(subject => 
      subject.classes && subject.classes.includes(formData.className)
    );
  };

  const handleAddEntry = async () => {
    if (!formData.className || !formData.dayOfWeek || !formData.period || !formData.subject || !formData.teacherId) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/protected/teachers/director/timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowAddModal(false);
        setFormData({ className: '', dayOfWeek: '', period: '', subject: '', teacherId: '' });
        fetchTimetableData(); // Refresh data
      } else {
        alert(result.error || 'Failed to create timetable entry');
      }
    } catch (error) {
      console.error('Error creating timetable entry:', error);
      alert('Failed to create timetable entry');
    } finally {
      setSaving(false);
    }
  };

  const handleEditEntry = async () => {
    if (!selectedEntry) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/protected/teachers/director/timetable?id=${selectedEntry.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setShowEditModal(false);
        setSelectedEntry(null);
        setFormData({ className: '', dayOfWeek: '', period: '', subject: '', teacherId: '' });
        fetchTimetableData(); // Refresh data
      } else {
        alert(result.error || 'Failed to update timetable entry');
      }
    } catch (error) {
      console.error('Error updating timetable entry:', error);
      alert('Failed to update timetable entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    if (!confirm('Are you sure you want to delete this timetable entry?')) return;

    try {
      const response = await fetch(`/api/protected/teachers/director/timetable?id=${entryId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        fetchTimetableData(); // Refresh data
      } else {
        alert(result.error || 'Failed to delete timetable entry');
      }
    } catch (error) {
      console.error('Error deleting timetable entry:', error);
      alert('Failed to delete timetable entry');
    }
  };

  const openEditModal = (entry) => {
    setSelectedEntry(entry);
    setFormData({
      className: entry.className || '',
      dayOfWeek: entry.dayOfWeek || '',
      period: entry.period?.toString() || '',
      subject: entry.subject || '',
      teacherId: entry.teacher?.id || ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      className: '',
      dayOfWeek: '',
      period: '',
      subject: '',
      teacherId: ''
    });
  };

  const renderGridView = () => {
    const periodKeys = Object.keys(periods).filter(p => p !== 'BREAK' && p !== 'LUNCH');
    
    return (
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                Time
              </th>
              {daysOfWeek.map(day => (
                <th key={day} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periodKeys.map((periodNum) => {
              const period = periods[periodNum];
              return (
                <tr key={periodNum} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div>
                      <div>Period {periodNum}</div>
                      <div className="text-xs text-gray-500">{period?.start} - {period?.end}</div>
                    </div>
                  </td>
                  {daysOfWeek.map(day => {
                    const entries = timetableData[day]?.[periodNum] || [];
                    return (
                      <td key={`${day}-${periodNum}`} className="px-4 py-4 text-sm">
                        {entries.length > 0 ? (
                          <div className="space-y-1">
                            {entries.map((entry) => (
                              <div key={entry.id} className="bg-blue-50 rounded p-2 border-l-4 border-blue-400">
                                <div className="font-medium text-gray-900 text-xs">{entry.subject}</div>
                                <div className="text-xs text-gray-600">{entry.className}</div>
                                <div className="text-xs text-gray-600">{entry.teacher.name}</div>
                                <div className="flex gap-1 mt-1">
                                  <button
                                    onClick={() => openEditModal(entry)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteEntry(entry.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="h-16 flex items-center justify-center text-gray-400">
                            <button
                              onClick={() => {
                                setFormData({
                                  className: filters.className || '',
                                  dayOfWeek: day,
                                  period: periodNum,
                                  subject: '',
                                  teacherId: ''
                                });
                                setShowAddModal(true);
                              }}
                              className="text-gray-400 hover:text-blue-600"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderListView = () => {
    if (!Array.isArray(timetableData)) return null;

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Timetable Entries</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timetableData.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.dayOfWeek}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Period {entry.period}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {entry.startTime} - {entry.endTime}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.className}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.teacher.name}
                    {entry.teacher.department && (
                      <div className="text-xs text-gray-500">{entry.teacher.department}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(entry)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderTeacherView = () => {
    return (
      <div className="space-y-6">
        {Object.entries(timetableData).map(([teacherName, teacherData]) => (
          <div key={teacherName} className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">{teacherName}</h3>
              {teacherData.teacher?.department && (
                <p className="text-sm text-gray-600">{teacherData.teacher.department}</p>
              )}
            </div>
            <div className="p-6">
              <div className="grid grid-cols-5 gap-4">
                {daysOfWeek.map(day => (
                  <div key={day} className="space-y-2">
                    <h4 className="font-medium text-gray-900 text-center">{day}</h4>
                    <div className="space-y-1">
                      {Object.entries(teacherData.schedule?.[day] || {}).map(([period, entries]) => (
                        <div key={period} className="bg-gray-50 rounded p-2">
                          <div className="text-xs text-gray-600">Period {period}</div>
                          {entries.map((entry, idx) => (
                            <div key={idx} className="text-sm">
                              <div className="font-medium">{entry.subject}</div>
                              <div className="text-xs text-gray-600">{entry.className}</div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading timetable...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Timetable</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchTimetableData()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      );
    }

    switch (filters.view) {
      case 'grid':
        return renderGridView();
      case 'list':
        return renderListView();
      case 'teacher':
        return renderTeacherView();
      default:
        return renderGridView();
    }
  };

  const renderModal = (isEdit = false) => {
    const isVisible = isEdit ? showEditModal : showAddModal;
    const title = isEdit ? 'Edit Timetable Entry' : 'Add Timetable Entry';
    const actionText = isEdit ? 'Update Entry' : 'Create Entry';
    const handleAction = isEdit ? handleEditEntry : handleAddEntry;
    const handleClose = () => {
      if (isEdit) {
        setShowEditModal(false);
        setSelectedEntry(null);
      } else {
        setShowAddModal(false);
      }
      resetForm();
    };

    if (!isVisible) return null;

    // Get filtered subjects based on selected class
    const availableSubjectsForClass = getFilteredSubjects();

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                value={formData.className}
                onChange={(e) => {
                  setFormData(prev => ({ 
                    ...prev, 
                    className: e.target.value,
                    subject: '' // Reset subject when class changes
                  }));
                }}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Class</option>
                {availableClasses.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Day *</label>
              <select
                value={formData.dayOfWeek}
                onChange={(e) => setFormData(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Day</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
              <select
                value={formData.period}
                onChange={(e) => setFormData(prev => ({ ...prev, period: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Period</option>
                {Object.keys(periods).filter(p => p !== 'BREAK' && p !== 'LUNCH').map(periodNum => (
                  <option key={periodNum} value={periodNum}>
                    Period {periodNum} ({periods[periodNum]?.start} - {periods[periodNum]?.end})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject *
                {loadingSubjects && (
                  <span className="ml-2 text-xs text-gray-500">(Loading...)</span>
                )}
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={loadingSubjects || !formData.className}
              >
                <option value="">
                  {!formData.className 
                    ? 'Select a class first' 
                    : loadingSubjects 
                    ? 'Loading subjects...' 
                    : 'Select Subject'}
                </option>
                {availableSubjectsForClass.map(subject => (
                  <option key={subject.id} value={subject.name}>
                    {subject.name} {subject.code && `(${subject.code})`}
                    {subject.category && ` - ${subject.category}`}
                  </option>
                ))}
              </select>
              {formData.className && availableSubjectsForClass.length === 0 && !loadingSubjects && (
                <p className="text-xs text-amber-600 mt-1">
                  No subjects available for {formData.className}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teacher *</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Teacher</option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} {teacher.department && `(${teacher.department})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleAction}
              disabled={saving || loadingSubjects}
              className="flex-1 bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {actionText}
                </>
              )}
            </button>
            <button
              onClick={handleClose}
              disabled={saving}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />
            Timetable Management
          </h1>
          <p className="text-gray-600 mt-2">Create, manage, and organize class schedules</p>
        </div>

        {/* Statistics Cards */}
        {statistics.totalSlots !== undefined && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Slots</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.totalSlots}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.uniqueTeachers}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Classes</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.uniqueClasses}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.uniqueSubjects}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow mb-8 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4">
              {/* View Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                {viewOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilters(prev => ({ ...prev, view: option.value }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        filters.view === option.value
                          ? 'bg-white text-blue-600 shadow'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <IconComponent className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Filters */}
              <select
                value={filters.className}
                onChange={(e) => setFilters(prev => ({ ...prev, className: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Classes</option>
                {availableClasses.map(className => (
                  <option key={className} value={className}>{className}</option>
                ))}
              </select>

              <select
                value={filters.dayOfWeek}
                onChange={(e) => setFilters(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Days</option>
                {daysOfWeek.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>

              <select
                value={filters.teacherId}
                onChange={(e) => setFilters(prev => ({ ...prev, teacherId: e.target.value }))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Teachers</option>
                {availableTeachers.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => fetchTimetableData()}
                disabled={loading}
                className="bg-gray-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white rounded-md px-4 py-2 text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Entry
              </button>
            </div>
          </div>
        </div>

        {/* Timetable Content */}
        {renderContent()}

        {/* Modals */}
        {renderModal(false)} {/* Add Modal */}
        {renderModal(true)}  {/* Edit Modal */}
      </div>
    </div>
  );
};

export default TimetableManagementPage;