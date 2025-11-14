// /app/protected/teacher/class/attendance/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Search,
  Filter,
  Download,
  User,
  Loader2,
  RefreshCw
} from 'lucide-react';

const AttendanceMarkingPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('full_day');
  const [searchTerm, setSearchTerm] = useState('');
  const [summary, setSummary] = useState(null);
  const [className, setClassName] = useState('');

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedPeriod]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        date: selectedDate,
        period: selectedPeriod
      });

      const response = await fetch(`/api/protected/teacher/class/attendance?${params}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch attendance data');
      }

      const data = await response.json();
      
      if (data.success) {
        setStudents(data.data.students);
        setSummary(data.data.summary);
        setClassName(data.data.className);
      } else {
        throw new Error(data.error || 'Failed to load attendance');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch attendance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = (studentId, status) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                ...student.attendance,
                status,
                arrivalTime: status === 'late' ? new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }) : null
              }
            }
          : student
      )
    );
  };

  const updateArrivalTime = (studentId, time) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                ...student.attendance,
                arrivalTime: time
              }
            }
          : student
      )
    );
  };

  const updateNotes = (studentId, notes) => {
    setStudents(prevStudents =>
      prevStudents.map(student =>
        student.id === studentId
          ? {
              ...student,
              attendance: {
                ...student.attendance,
                notes
              }
            }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setError(null);

      const attendanceData = students
        .filter(student => student.attendance?.status)
        .map(student => ({
          studentId: student.id,
          status: student.attendance.status,
          arrivalTime: student.attendance.arrivalTime,
          notes: student.attendance.notes
        }));

      if (attendanceData.length === 0) {
        alert('Please mark attendance for at least one student');
        return;
      }

      const response = await fetch('/api/protected/teacher/class/attendance', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          date: selectedDate,
          period: selectedPeriod,
          attendanceData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save attendance');
      }

      const data = await response.json();
      
      if (data.success) {
        alert('Attendance saved successfully!');
        fetchAttendance(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to save attendance');
      }
    } catch (err) {
      setError(err.message);
      console.error('Save attendance error:', err);
      alert('Failed to save attendance: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const markAllPresent = () => {
    setStudents(prevStudents =>
      prevStudents.map(student => ({
        ...student,
        attendance: {
          ...student.attendance,
          status: 'present'
        }
      }))
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'absent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'late':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'excused':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Attendance</h2>
            <p className="text-sm text-gray-600">Please wait...</p>
          </div>
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
              <h1 className="text-3xl font-bold text-gray-900">Mark Attendance</h1>
              <p className="text-gray-600 mt-1">
                {className} • {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchAttendance}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={saveAttendance}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Attendance</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="full_day">Full Day</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Students</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={markAllPresent}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{summary.total}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{summary.present}</div>
                <div className="text-sm text-green-600">Present</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{summary.absent}</div>
                <div className="text-sm text-red-600">Absent</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{summary.late}</div>
                <div className="text-sm text-yellow-600">Late</div>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{summary.excused}</div>
                <div className="text-sm text-blue-600">Excused</div>
              </div>
            </div>
          )}
        </div>

        {/* Student List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="divide-y divide-gray-200">
            {filteredStudents.map((student, index) => (
              <div key={student.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      {student.avatar ? (
                        <img
                          src={student.avatar}
                          alt={`${student.firstName} ${student.lastName}`}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {index + 1}. {student.firstName} {student.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Student ID: {student.studentId || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {student.attendance && (
                    <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.attendance.status)}`}>
                      {student.attendance.status?.toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Attendance Buttons */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  <button
                    onClick={() => markAttendance(student.id, 'present')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      student.attendance?.status === 'present'
                        ? 'bg-green-500 text-white shadow-lg'
                        : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-300'
                    }`}
                  >
                    <CheckCircle2 className="w-5 h-5 mx-auto mb-1" />
                    Present
                  </button>

                  <button
                    onClick={() => markAttendance(student.id, 'absent')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      student.attendance?.status === 'absent'
                        ? 'bg-red-500 text-white shadow-lg'
                        : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-300'
                    }`}
                  >
                    <XCircle className="w-5 h-5 mx-auto mb-1" />
                    Absent
                  </button>

                  <button
                    onClick={() => markAttendance(student.id, 'late')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      student.attendance?.status === 'late'
                        ? 'bg-yellow-500 text-white shadow-lg'
                        : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-300'
                    }`}
                  >
                    <Clock className="w-5 h-5 mx-auto mb-1" />
                    Late
                  </button>

                  <button
                    onClick={() => markAttendance(student.id, 'excused')}
                    className={`px-4 py-3 rounded-lg font-medium transition-all ${
                      student.attendance?.status === 'excused'
                        ? 'bg-blue-500 text-white shadow-lg'
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-300'
                    }`}
                  >
                    <AlertCircle className="w-5 h-5 mx-auto mb-1" />
                    Excused
                  </button>
                </div>

                {/* Additional Fields */}
                {student.attendance?.status === 'late' && (
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                    <input
                      type="time"
                      value={student.attendance.arrivalTime || ''}
                      onChange={(e) => updateArrivalTime(student.id, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {student.attendance?.status && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                    <textarea
                      value={student.attendance.notes || ''}
                      onChange={(e) => updateNotes(student.id, e.target.value)}
                      placeholder="Add any additional notes..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredStudents.length === 0 && (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Students Found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No students assigned to your class.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceMarkingPage;