'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Printer,
  AlertTriangle,
  Loader2,
  Download,
  RefreshCw,
  MapPin,
  Bell
} from 'lucide-react';

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'list'

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  useEffect(() => {
    fetchTimetable();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, [selectedWeek]);

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedWeek !== 0) {
        const weekDate = new Date();
        weekDate.setDate(weekDate.getDate() + (selectedWeek * 7));
        params.append('week', weekDate.toISOString().split('T')[0]);
      }

      const response = await fetch(`/api/protected/students/timetable?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch timetable: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setTimetableData(data.data);
      } else {
        throw new Error(data.error || 'Failed to load timetable');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch timetable error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + (selectedWeek * 7));
    return date;
  };

  const getWeekRange = () => {
    const currentWeekDate = getCurrentWeekDate();
    const monday = new Date(currentWeekDate);
    const day = monday.getDay();
    const diff = monday.getDate() - day + (day === 0 ? -6 : 1);
    monday.setDate(diff);
    
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    
    return {
      start: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      year: monday.getFullYear()
    };
  };

  const isCurrentPeriod = (day, timeSlot) => {
    if (selectedWeek !== 0) return false;
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    const [startTime, endTime] = timeSlot.split('-');
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    
    return day === today && 
           currentTotalMinutes >= startTotalMinutes && 
           currentTotalMinutes <= endTotalMinutes;
  };

  const isToday = (day) => {
    if (selectedWeek !== 0) return false;
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    return day === today;
  };

  const getClassesForDayAndTime = (day, timeSlot) => {
    if (!timetableData?.schedule) return [];
    
    return timetableData.schedule.filter(item => 
      item.dayOfWeek === day && item.timeSlot === timeSlot
    );
  };

  const getTimeSlots = () => {
    if (!timetableData?.schedule) return [];
    
    const slots = new Set();
    timetableData.schedule.forEach(item => {
      slots.add(item.timeSlot);
    });
    
    return Array.from(slots).sort((a, b) => {
      const aStart = a.split('-')[0];
      const bStart = b.split('-')[0];
      return aStart.localeCompare(bStart);
    });
  };

  const getTodayClasses = () => {
    if (!timetableData?.schedule || selectedWeek !== 0) return [];
    
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    
    return timetableData.schedule
      .filter(item => item.dayOfWeek === today)
      .sort((a, b) => a.timeSlot.localeCompare(b.timeSlot));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
          <span className="text-gray-700 text-lg font-medium">Loading your timetable...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-md">
          <div className="bg-red-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oops! Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchTimetable}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const weekRange = getWeekRange();
  const timeSlots = getTimeSlots();
  const todayClasses = getTodayClasses();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                My Timetable
              </h1>
              <p className="text-gray-500 mt-1 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {currentTime.toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchTimetable}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Today's Quick View - Only show for current week */}
        {selectedWeek === 0 && todayClasses.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-6 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5" />
              <h2 className="text-xl font-bold">Today's Classes</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayClasses.map((cls, index) => {
                const isCurrent = isCurrentPeriod(cls.dayOfWeek, cls.timeSlot);
                return (
                  <div
                    key={index}
                    className={`bg-white bg-opacity-20 backdrop-blur-sm rounded-xl p-4 ${
                      isCurrent ? 'ring-2 ring-yellow-300 shadow-lg' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-semibold text-sm">{cls.timeSlot}</span>
                      {isCurrent && (
                        <span className="ml-auto bg-yellow-400 text-yellow-900 text-xs px-2 py-0.5 rounded-full font-bold">
                          NOW
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-lg mb-1">{cls.subject}</div>
                    <div className="text-sm opacity-90">{cls.teacherName}</div>
                    {cls.room && (
                      <div className="text-xs opacity-75 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {cls.room}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Week Navigation */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelectedWeek((prev) => prev - 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Previous
            </button>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <span className="text-lg font-bold text-gray-900">
                  {weekRange.start} - {weekRange.end}, {weekRange.year}
                </span>
              </div>
              {selectedWeek === 0 && (
                <span className="text-sm text-indigo-600 font-medium">Current Week</span>
              )}
              {selectedWeek !== 0 && (
                <button
                  onClick={() => setSelectedWeek(0)}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium underline"
                >
                  Back to Current Week
                </button>
              )}
            </div>
            
            <button
              onClick={() => setSelectedWeek((prev) => prev + 1)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all shadow-sm font-medium"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timetable */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gradient-to-r from-indigo-500 to-purple-600">
                  <th className="px-4 py-4 text-left text-sm font-bold text-white border-r border-indigo-400">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Time
                    </div>
                  </th>
                  {daysOfWeek.map((day) => (
                    <th
                      key={day}
                      className={`px-4 py-4 text-center text-sm font-bold text-white border-r border-indigo-400 last:border-r-0 ${
                        isToday(day) ? 'bg-yellow-400 bg-opacity-30' : ''
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <span>{day}</span>
                        {isToday(day) && (
                          <span className="text-xs font-normal bg-yellow-300 text-yellow-900 px-2 py-0.5 rounded-full mt-1">
                            Today
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((timeSlot, idx) => (
                  <tr key={timeSlot} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="px-4 py-4 text-sm font-semibold text-gray-700 border-r border-b border-gray-200 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        {timeSlot}
                      </div>
                    </td>
                    {daysOfWeek.map((day) => {
                      const classes = getClassesForDayAndTime(day, timeSlot);
                      const isCurrent = isCurrentPeriod(day, timeSlot);
                      return (
                        <td
                          key={`${day}-${timeSlot}`}
                          className={`px-4 py-4 text-sm border-r border-b border-gray-200 last:border-r-0 ${
                            isCurrent ? 'bg-yellow-100 ring-2 ring-inset ring-yellow-400' : ''
                          } ${isToday(day) && !isCurrent ? 'bg-indigo-50' : ''}`}
                        >
                          {classes.length > 0 ? (
                            <div className="space-y-2">
                              {classes.map((cls, index) => (
                                <div
                                  key={index}
                                  className={`p-3 rounded-xl shadow-sm transition-all hover:shadow-md ${
                                    isCurrent 
                                      ? 'bg-gradient-to-br from-yellow-200 to-yellow-300 border-2 border-yellow-400' 
                                      : 'bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="font-bold text-gray-900 flex items-center gap-1">
                                      <BookOpen className="w-4 h-4 text-indigo-600" />
                                      {cls.subject}
                                    </div>
                                    {isCurrent && (
                                      <span className="bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                        NOW
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-gray-700 flex items-center gap-1 mb-1">
                                    <User className="w-3 h-3 text-gray-500" />
                                    {cls.teacherName}
                                  </div>
                                  <div className="text-xs text-gray-600 font-medium">
                                    {cls.className}
                                  </div>
                                  {cls.room && (
                                    <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      Room: {cls.room}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <span className="text-gray-400 text-sm">No Class</span>
                            </div>
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

        {/* Action Buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-lg font-medium"
          >
            <Printer className="w-5 h-5" />
            Print Timetable
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body {
            background: white;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentTimetable;