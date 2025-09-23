// /app/protected/student/timetable/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  Print,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const StudentTimetable = () => {
  const [timetableData, setTimetableData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week
  const [currentTime, setCurrentTime] = useState(new Date());

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const timeSlots = [
    '8:00-8:45', '9:00-9:45', '10:00-10:45', '11:15-12:00', 
    '12:15-1:00', '2:00-2:45', '3:00-3:45'
  ];

  useEffect(() => {
    fetchTimetable();
    // Update current time every minute
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

      const response = await fetch(`/api/protected/student/timetable?${params.toString()}`);
      
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
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    const friday = new Date(monday);
    friday.setDate(friday.getDate() + 4);
    
    return {
      start: monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      end: friday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    };
  };

  const isCurrentPeriod = (day, timeSlot) => {
    const now = new Date();
    const today = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    
    // Parse the time slot (e.g., "9:00-9:45")
    const [startTime, endTime] = timeSlot.split('-');
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHour * 60 + startMin;
    const endTotalMinutes = endHour * 60 + endMin;
    
    return day === today && 
           currentTotalMinutes >= startTotalMinutes && 
           currentTotalMinutes <= endTotalMinutes &&
           selectedWeek === 0; // Only highlight for current week
  };

  const getClassForPeriod = (day, timeSlot) => {
    if (!timetableData?.schedule) return null;
    
    return timetableData.schedule.find(item => 
      item.dayOfWeek === day && item.timeSlot === timeSlot
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading your timetable...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Timetable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchTimetable}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const weekRange = getWeekRange();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Timetable</h1>
              <p className="text-gray-600 mt-1">
                {timetableData?.studentInfo?.className || 'Class'} Schedule • Week of {weekRange.start} - {weekRange.end}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSelectedWeek(selectedWeek - 1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-sm font-medium text-gray-700 min-w-[100px] text-center">
                  {selectedWeek === 0 ? 'This Week' : 
                   selectedWeek === 1 ? 'Next Week' :
                   selectedWeek === -1 ? 'Last Week' :
                   `Week ${selectedWeek > 0 ? '+' + selectedWeek : selectedWeek}`
                  }
                </span>
                <button
                  onClick={() => setSelectedWeek(selectedWeek + 1)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <Print className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Time Display */}
        {selectedWeek === 0 && (
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">Current Time</h3>
                <p className="text-purple-100">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <p className="text-purple-200 text-sm">Live</p>
              </div>
            </div>
          </div>
        )}

        {/* Timetable Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Weekly Schedule</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Time
                  </th>
                  {daysOfWeek.map(day => (
                    <th key={day} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div>{day}</div>
                      <div className="text-gray-400 normal-case">
                        {(() => {
                          const date = new Date();
                          date.setDate(date.getDate() + (selectedWeek * 7));
                          const monday = new Date(date);
                          monday.setDate(monday.getDate() - monday.getDay() + 1);
                          const dayIndex = daysOfWeek.indexOf(day);
                          const dayDate = new Date(monday);
                          dayDate.setDate(dayDate.getDate() + dayIndex);
                          return dayDate.getDate();
                        })()}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timeSlots.map(timeSlot => (
                  <tr key={timeSlot} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 bg-gray-50">
                      {timeSlot}
                    </td>
                    {daysOfWeek.map(day => {
                      const classInfo = getClassForPeriod(day, timeSlot);
                      const isCurrentClass = isCurrentPeriod(day, timeSlot);
                      
                      return (
                        <td key={`${day}-${timeSlot}`} className="px-4 py-4 whitespace-nowrap text-sm">
                          {classInfo ? (
                            <div className={`p-3 rounded-lg border-l-4 ${
                              isCurrentClass 
                                ? 'bg-purple-100 border-purple-500 shadow-sm' 
                                : 'bg-blue-50 border-blue-400'
                            }`}>
                              <div className="font-semibold text-gray-900">
                                {classInfo.subject}
                              </div>
                              <div className="flex items-center text-xs text-gray-600 mt-1">
                                <User className="w-3 h-3 mr-1" />
                                <span>{classInfo.teacher || 'Teacher Name'}</span>
                              </div>
                              {classInfo.room && (
                                <div className="flex items-center text-xs text-gray-600 mt-1">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  <span>{classInfo.room}</span>
                                </div>
                              )}
                              {isCurrentClass && (
                                <div className="flex items-center text-xs text-purple-600 mt-1 font-medium">
                                  <Clock className="w-3 h-3 mr-1" />
                                  <span>Current Class</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 text-gray-400 text-center">
                              <span className="text-xs">Free Period</span>
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

        {/* Next Class Info */}
        {selectedWeek === 0 && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Next Class */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Next Class</span>
              </h3>
              
              <div className="space-y-3">
                {/* This would calculate the next class based on current time */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="font-semibold text-gray-900">Mathematics</div>
                  <div className="text-sm text-gray-600 mt-1">Room 203 • Mr. Johnson</div>
                  <div className="text-sm text-blue-600 mt-2">Starts at 10:15 AM (in 45 minutes)</div>
                </div>
              </div>
            </div>

            {/* Today's Summary */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Today's Summary</span>
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Classes:</span>
                  <span className="font-semibold">6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Classes Completed:</span>
                  <span className="font-semibold text-green-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Classes Remaining:</span>
                  <span className="font-semibold text-blue-600">3</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Free Periods:</span>
                  <span className="font-semibold">1</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-purple-100 border-l-4 border-purple-500 rounded"></div>
              <span className="text-sm text-gray-700">Current Class</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-50 border-l-4 border-blue-400 rounded"></div>
              <span className="text-sm text-gray-700">Scheduled Class</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-100 rounded"></div>
              <span className="text-sm text-gray-700">Free Period</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentTimetable;