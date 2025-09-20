'use client'
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Users,
  BookOpen,
  Plus,
  Save,
  Trash2,
  Edit,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Download,
  Upload
} from 'lucide-react';

const CoordinatorTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [showCreateSlot, setShowCreateSlot] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);
  const [conflicts, setConflicts] = useState([]);

  const [newSlot, setNewSlot] = useState({
    className: '',
    dayOfWeek: '',
    period: '',
    subject: '',
    teacherId: ''
  });

  const [bulkCreate, setBulkCreate] = useState({
    isActive: false,
    entries: []
  });

  useEffect(() => {
    fetchTimetableData();
  }, [selectedClass, viewMode]);

  const fetchTimetableData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('class', selectedClass);
      params.append('view', viewMode);

      const response = await fetch(`/api/protected/teachers/coordinator/timetable?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTimetableData(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch timetable data');
      }
    } catch (error) {
      console.error('Timetable fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!newSlot.className || !newSlot.dayOfWeek || !newSlot.period || !newSlot.subject || !newSlot.teacherId) {
      setError('All fields are required');
      return;
    }

    try {
      const response = await fetch('/api/protected/teachers/coordinator/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSlot)
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateSlot(false);
        setNewSlot({ className: '', dayOfWeek: '', period: '', subject: '', teacherId: '' });
        fetchTimetableData();
        alert('Timetable slot created successfully!');
      } else {
        if (response.status === 409) {
          // Conflict detected
          setConflicts([data]);
          setError(data.error + (data.suggestion ? ` ${data.suggestion}` : ''));
        } else {
          setError(data.error || 'Failed to create timetable slot');
        }
      }
    } catch (error) {
      console.error('Create slot error:', error);
      setError('Network error occurred');
    }
  };

  const handleUpdateSlot = async (slotId) => {
    if (!editingSlot) return;

    try {
      const response = await fetch(`/api/protected/teachers/coordinator/timetable?id=${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          className: editingSlot.className,
          dayOfWeek: editingSlot.dayOfWeek,
          period: editingSlot.period,
          subject: editingSlot.subject,
          teacherId: editingSlot.teacherId
        })
      });

      const data = await response.json();

      if (response.ok) {
        setEditingSlot(null);
        fetchTimetableData();
        alert('Timetable slot updated successfully!');
      } else {
        setError(data.error || 'Failed to update timetable slot');
      }
    } catch (error) {
      console.error('Update slot error:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm('Are you sure you want to delete this timetable slot?')) return;

    try {
      const response = await fetch(`/api/protected/teachers/coordinator/timetable?id=${slotId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        fetchTimetableData();
        alert('Timetable slot deleted successfully!');
      } else {
        setError(data.error || 'Failed to delete timetable slot');
      }
    } catch (error) {
      console.error('Delete slot error:', error);
      setError('Network error occurred');
    }
  };

  const handleBulkCreate = async () => {
    if (bulkCreate.entries.length === 0) {
      setError('No entries to create');
      return;
    }

    try {
      const response = await fetch('/api/protected/teachers/coordinator/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bulkEntries: bulkCreate.entries })
      });

      const data = await response.json();

      if (response.ok) {
        setBulkCreate({ isActive: false, entries: [] });
        fetchTimetableData();
        
        const summary = `
          Bulk creation completed:
          - Successful: ${data.data.successful.length}
          - Failed: ${data.data.failed.length}
          - Conflicts: ${data.data.conflicts.length}
        `;
        alert(summary);
        
        if (data.data.conflicts.length > 0) {
          setConflicts(data.data.conflicts);
        }
      } else {
        setError(data.error || 'Bulk creation failed');
      }
    } catch (error) {
      console.error('Bulk create error:', error);
      setError('Network error occurred');
    }
  };

  const renderGridView = () => {
    if (!timetableData?.timetable) return null;

    const { periods, daysOfWeek } = timetableData;
    const periodsArray = Object.keys(periods).filter(p => p !== 'BREAK' && p !== 'LUNCH');

    return (
      <div className="space-y-6">
        {timetableData.coordinatorClasses.map(className => (
          <div key={className} className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
              <h3 className="text-lg font-semibold">{className}</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                      Period / Day
                    </th>
                    {daysOfWeek.map(day => (
                      <th key={day} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {periodsArray.map(period => (
                    <tr key={period}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">Period {period}</div>
                        <div className="text-xs text-gray-500">
                          {periods[period].start} - {periods[period].end}
                        </div>
                      </td>
                      {daysOfWeek.map(day => {
                        const slot = timetableData.timetable[className]?.[day]?.[period];
                        return (
                          <td key={`${day}-${period}`} className="px-4 py-3 whitespace-nowrap">
                            {slot ? (
                              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 group hover:bg-purple-100 transition-colors">
                                <div className="text-sm font-medium text-gray-900 mb-1">
                                  {slot.subject}
                                </div>
                                <div className="text-xs text-gray-600 mb-2">
                                  {slot.teacher.name}
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => setEditingSlot({...slot, className, dayOfWeek: day, period})}
                                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSlot(slot.id)}
                                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => setNewSlot({
                                  className,
                                  dayOfWeek: day,
                                  period,
                                  subject: '',
                                  teacherId: ''
                                })}
                                className="w-full h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-600 transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderListView = () => {
    if (!timetableData?.timetable || !Array.isArray(timetableData.timetable)) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b">
          <h3 className="text-lg font-medium text-gray-900">Timetable Entries</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {timetableData.timetable.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {entry.className}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.dayOfWeek}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    Period {entry.period}
                    <div className="text-xs text-gray-500">
                      {entry.startTime} - {entry.endTime}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {entry.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{entry.teacher.name}</div>
                    <div className="text-xs text-gray-500">{entry.teacher.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEditingSlot(entry)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSlot(entry.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
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

  if (loading && !timetableData) {
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
          <h1 className="text-2xl font-bold text-gray-900">Timetable Builder</h1>
          <p className="text-gray-600">Create and manage class timetables</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Grid View
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'list' 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              List View
            </button>
          </div>
          <button
            onClick={() => setShowCreateSlot(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Slot</span>
          </button>
          <button
            onClick={() => setBulkCreate({ isActive: true, entries: [] })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Bulk Create</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
          <AlertTriangle className="h-5 w-5 mr-3" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">×</button>
        </div>
      )}

      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-yellow-100 border border-yellow-400 p-4 rounded-lg">
          <h4 className="font-medium text-yellow-800 mb-2">Timetable Conflicts Detected</h4>
          <div className="space-y-2">
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-sm text-yellow-700">
                {conflict.conflict}: {conflict.existing && JSON.stringify(conflict.existing)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      {timetableData && (
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Class</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {timetableData.coordinatorClasses?.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-3 flex items-end justify-end">
              <div className="text-sm text-gray-600">
                {timetableData.statistics && (
                  <>
                    Total Slots: {timetableData.statistics.totalSlots} | 
                    Own Slots: {timetableData.statistics.ownSlots} | 
                    Teachers: {timetableData.statistics.uniqueTeachers} |
                    Subjects: {timetableData.statistics.uniqueSubjects}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Content */}
      {viewMode === 'grid' ? renderGridView() : renderListView()}

      {/* Create Slot Modal */}
      {(showCreateSlot || newSlot.className) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Timetable Slot
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newSlot.className}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, className: e.target.value }))}
                >
                  <option value="">Select class...</option>
                  {timetableData?.coordinatorClasses?.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Day of Week *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newSlot.dayOfWeek}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, dayOfWeek: e.target.value }))}
                >
                  <option value="">Select day...</option>
                  {timetableData?.daysOfWeek?.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newSlot.period}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, period: e.target.value }))}
                >
                  <option value="">Select period...</option>
                  {timetableData?.periods && Object.keys(timetableData.periods)
                    .filter(p => p !== 'BREAK' && p !== 'LUNCH')
                    .map(period => (
                      <option key={period} value={period}>
                        Period {period} ({timetableData.periods[period].start} - {timetableData.periods[period].end})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newSlot.subject}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <option value="">Select subject...</option>
                  {timetableData?.subjects?.map(subject => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newSlot.teacherId}
                  onChange={(e) => setNewSlot(prev => ({ ...prev, teacherId: e.target.value }))}
                >
                  <option value="">Select teacher...</option>
                  {timetableData?.availableTeachers?.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateSlot(false);
                  setNewSlot({ className: '', dayOfWeek: '', period: '', subject: '', teacherId: '' });
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSlot}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Create Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Edit Timetable Slot
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={editingSlot.subject}
                  onChange={(e) => setEditingSlot(prev => ({ ...prev, subject: e.target.value }))}
                >
                  <option value="">Select subject...</option>
                  {timetableData?.subjects?.map(subject => (
                    <option key={subject.id} value={subject.name}>
                      {subject.name} ({subject.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher *</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={editingSlot.teacherId}
                  onChange={(e) => setEditingSlot(prev => ({ ...prev, teacherId: e.target.value }))}
                >
                  <option value="">Select teacher...</option>
                  {timetableData?.availableTeachers?.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.department})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setEditingSlot(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUpdateSlot(editingSlot.id)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center justify-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>Update Slot</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoordinatorTimetable;