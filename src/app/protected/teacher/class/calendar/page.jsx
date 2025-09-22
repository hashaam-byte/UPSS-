// /app/protected/teacher/class/calendar/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Plus,
  Clock,
  Users,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Phone,
  User,
  FileText,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2
} from 'lucide-react';

const ClassTeacherCalendar = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // month, week, day
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCalendarEvents();
  }, [currentDate, viewMode, filterType]);

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true);
      setError(null);

      const startDate = getViewStartDate(currentDate, viewMode);
      const endDate = getViewEndDate(currentDate, viewMode);

      const params = new URLSearchParams();
      params.append('startDate', startDate.toISOString());
      params.append('endDate', endDate.toISOString());
      if (filterType !== 'all') params.append('eventType', filterType);
      if (searchTerm) params.append('search', searchTerm);

      const response = await fetch(`/api/protected/teacher/class/calendar?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch calendar events: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setEvents(data.data.events || []);
      } else {
        throw new Error(data.error || 'Failed to load calendar events');
      }
    } catch (err) {
      setError(err.message);
      console.error('Calendar fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createEvent = async (eventData) => {
    try {
      const response = await fetch('/api/protected/teacher/class/calendar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      });

      if (!response.ok) {
        throw new Error('Failed to create event');
      }

      const data = await response.json();
      
      if (data.success) {
        setShowCreateModal(false);
        fetchCalendarEvents(); // Refresh events
        alert('Event created successfully');
      } else {
        throw new Error(data.error || 'Failed to create event');
      }
    } catch (err) {
      console.error('Create event error:', err);
      alert('Failed to create event: ' + err.message);
    }
  };

  const deleteEvent = async (eventId) => {
    if (!confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`/api/protected/teacher/class/calendar?id=${eventId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      fetchCalendarEvents(); // Refresh events
      setShowEventModal(false);
      alert('Event deleted successfully');
    } catch (err) {
      console.error('Delete event error:', err);
      alert('Failed to delete event: ' + err.message);
    }
  };

  const getViewStartDate = (date, view) => {
    const start = new Date(date);
    if (view === 'month') {
      start.setDate(1);
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    } else if (view === 'week') {
      start.setDate(start.getDate() - start.getDay()); // Start from Sunday
    }
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getViewEndDate = (date, view) => {
    const end = new Date(date);
    if (view === 'month') {
      end.setMonth(end.getMonth() + 1, 0); // Last day of month
      end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday
    } else if (view === 'week') {
      end.setDate(end.getDate() + (6 - end.getDay())); // End on Saturday
    }
    end.setHours(23, 59, 59, 999);
    return end;
  };

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (7 * direction));
    } else if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    }
    setCurrentDate(newDate);
  };

  const getEventTypeColor = (eventType) => {
    switch (eventType) {
      case 'class': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'meeting': return 'bg-green-100 text-green-800 border-green-200';
      case 'parent_meeting': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'deadline': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'event': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'class': return <BookOpen className="w-4 h-4" />;
      case 'exam': return <FileText className="w-4 h-4" />;
      case 'meeting': return <Users className="w-4 h-4" />;
      case 'parent_meeting': return <User className="w-4 h-4" />;
      case 'deadline': return <Clock className="w-4 h-4" />;
      case 'event': return <Calendar className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDateRange = (startDate, endDate, isAllDay) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isAllDay) {
      return start.toDateString() === end.toDateString() 
        ? start.toLocaleDateString()
        : `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }

    if (start.toDateString() === end.toDateString()) {
      return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
    }

    return `${start.toLocaleDateString()} ${start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - ${end.toLocaleDateString()} ${end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
  };

  const renderCalendarGrid = () => {
    const startDate = getViewStartDate(currentDate, viewMode);
    const endDate = getViewEndDate(currentDate, viewMode);
    const days = [];
    const currentDay = new Date(startDate);

    while (currentDay <= endDate) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    if (viewMode === 'month') {
      return (
        <div className="grid grid-cols-7 gap-px bg-gray-200">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="bg-gray-50 p-2 text-center text-sm font-medium text-gray-700">
              {day}
            </div>
          ))}
          
          {/* Calendar days */}
          {days.map(day => {
            const dayEvents = events.filter(event => {
              const eventStart = new Date(event.startDate);
              return eventStart.toDateString() === day.toDateString();
            });

            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-24 bg-white p-1 ${
                  !isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''
                } ${isToday ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      onClick={() => {
                        setSelectedEvent(event);
                        setShowEventModal(true);
                      }}
                      className={`text-xs p-1 rounded cursor-pointer border ${getEventTypeColor(event.eventType)}`}
                    >
                      <div className="flex items-center space-x-1">
                        {getEventIcon(event.eventType)}
                        <span className="truncate">{event.title}</span>
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">+{dayEvents.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    } else if (viewMode === 'week') {
      // Week view implementation
      return (
        <div className="bg-white rounded-lg shadow">
          <div className="grid grid-cols-8 gap-px bg-gray-200">
            <div className="bg-gray-50 p-3"></div>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            {/* Time slots */}
            {Array.from({length: 12}, (_, i) => i + 7).map(hour => (
              <React.Fragment key={hour}>
                <div className="bg-gray-50 p-2 text-xs text-gray-600 text-right">
                  {hour}:00
                </div>
                {days.slice(0, 7).map(day => {
                  const hourEvents = events.filter(event => {
                    const eventStart = new Date(event.startDate);
                    return eventStart.toDateString() === day.toDateString() && 
                           eventStart.getHours() === hour;
                  });
                  
                  return (
                    <div key={`${day.toISOString()}-${hour}`} className="bg-white p-1 min-h-16 border-r border-gray-100">
                      {hourEvents.map(event => (
                        <div
                          key={event.id}
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventModal(true);
                          }}
                          className={`text-xs p-1 rounded mb-1 cursor-pointer border ${getEventTypeColor(event.eventType)}`}
                        >
                          <div className="flex items-center space-x-1">
                            {getEventIcon(event.eventType)}
                            <span className="truncate">{event.title}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      );
    } else {
      // Day view implementation
      const todayEvents = events.filter(event => {
        const eventStart = new Date(event.startDate);
        return eventStart.toDateString() === currentDate.toDateString();
      }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

      return (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </h3>
            <div className="space-y-3">
              {todayEvents.map(event => (
                <div
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  className={`p-4 rounded-lg cursor-pointer border ${getEventTypeColor(event.eventType)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getEventIcon(event.eventType)}
                      <div>
                        <h4 className="font-medium">{event.title}</h4>
                        <p className="text-sm opacity-75">
                          {formatDateRange(event.startDate, event.endDate, event.isAllDay)}
                        </p>
                        {event.description && (
                          <p className="text-sm mt-1 opacity-75">{event.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.priority === 'high' && <AlertTriangle className="w-4 h-4 text-orange-500" />}
                      {event.priority === 'urgent' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                    </div>
                  </div>
                </div>
              ))}
              {todayEvents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No events scheduled for today</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Loading Calendar</h2>
            <p className="text-sm text-gray-600">Fetching your schedule...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Calendar</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchCalendarEvents}
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
              <h1 className="text-3xl font-bold text-gray-900">Calendar</h1>
              <p className="text-gray-600 mt-1">
                Manage your schedule and events
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Controls */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateDate(-1)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Today
                </button>
                <button
                  onClick={() => navigateDate(1)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900">
                {viewMode === 'month' && currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                {viewMode === 'week' && `Week of ${getViewStartDate(currentDate, 'week').toLocaleDateString()}`}
                {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="all">All Events</option>
                <option value="class">Classes</option>
                <option value="exam">Exams</option>
                <option value="meeting">Meetings</option>
                <option value="parent_meeting">Parent Meetings</option>
                <option value="deadline">Deadlines</option>
                <option value="event">Events</option>
              </select>

              <div className="flex bg-gray-100 rounded-lg p-1">
                {['month', 'week', 'day'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors capitalize ${
                      viewMode === mode ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {renderCalendarGrid()}
      </div>

      {/* Event Detail Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Event Details</h2>
                <button
                  onClick={() => setShowEventModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="flex items-start space-x-4 mb-6">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getEventTypeColor(selectedEvent.eventType)}`}>
                  {getEventIcon(selectedEvent.eventType)}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedEvent.title}</h3>
                  <p className="text-gray-600 mb-2">
                    {formatDateRange(selectedEvent.startDate, selectedEvent.endDate, selectedEvent.isAllDay)}
                  </p>
                  {selectedEvent.location && (
                    <p className="text-gray-600 text-sm">📍 {selectedEvent.location}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {selectedEvent.priority === 'high' && (
                    <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                      High Priority
                    </span>
                  )}
                  {selectedEvent.priority === 'urgent' && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                      Urgent
                    </span>
                  )}
                </div>
              </div>

              {selectedEvent.description && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}

              {selectedEvent.classes && selectedEvent.classes.length > 0 && (
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-2">Classes</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.classes.map(className => (
                      <span key={className} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    // Edit functionality would go here
                    console.log('Edit event:', selectedEvent.id);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteEvent(selectedEvent.id)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="text-center py-8 text-gray-500">
                <Plus className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="mb-4">Event creation form would go here</p>
                <p className="text-sm">This would include fields for title, date/time, type, description, etc.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTeacherCalendar;