'use client'
import React, { useState, useEffect } from 'react';
import {
  Bell,
  Check,
  CheckAll,
  Trash2,
  Calendar,
  Users,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Filter,
  Eye
} from 'lucide-react';

const CoordinatorNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  const notificationTypes = [
    { id: 'all', label: 'All', count: 0 },
    { id: 'unread', label: 'Unread', count: 0 },
    { id: 'system', label: 'System', count: 0 },
    { id: 'timetable', label: 'Timetable', count: 0 },
    { id: 'student', label: 'Student', count: 0 },
    { id: 'teacher', label: 'Teacher', count: 0 }
  ];

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('filter', filter);

      const response = await fetch(`/api/protected/teachers/coordinator/notifications?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      const response = await fetch('/api/protected/teachers/coordinator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
        })
      });

      if (response.ok) {
        fetchNotifications(); // Refresh
        setSelectedNotifications([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to mark notifications as read');
      }
    } catch (error) {
      console.error('Mark as read error:', error);
      setError('Network error occurred');
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/protected/teachers/coordinator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      });

      if (response.ok) {
        fetchNotifications(); // Refresh
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to mark all notifications as read');
      }
    } catch (error) {
      console.error('Mark all as read error:', error);
      setError('Network error occurred');
    }
  };

  const deleteNotifications = async (notificationIds) => {
    if (!confirm('Are you sure you want to delete these notifications?')) return;

    try {
      const response = await fetch('/api/protected/teacherss/coordinator/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          notificationIds: Array.isArray(notificationIds) ? notificationIds : [notificationIds]
        })
      });

      if (response.ok) {
        fetchNotifications(); // Refresh
        setSelectedNotifications([]);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete notifications');
      }
    } catch (error) {
      console.error('Delete notifications error:', error);
      setError('Network error occurred');
    }
  };

  const handleSelectNotification = (notificationId) => {
    setSelectedNotifications(prev => 
      prev.includes(notificationId)
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const handleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(n => n.id));
    }
  };

  const getNotificationIcon = (type, priority) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'system':
        return <Info {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'success':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <X {...iconProps} className="w-5 h-5 text-red-500" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'border-l-red-500 bg-red-50';
      case 'high': return 'border-l-orange-500 bg-orange-50';
      case 'normal': return 'border-l-blue-500 bg-blue-50';
      case 'low': return 'border-l-gray-500 bg-gray-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Calculate counts for filters
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const systemCount = notifications.filter(n => n.type === 'system').length;
  const timetableCount = notifications.filter(n => n.title.toLowerCase().includes('timetable')).length;
  const studentCount = notifications.filter(n => n.title.toLowerCase().includes('student')).length;
  const teacherCount = notifications.filter(n => n.title.toLowerCase().includes('teacher')).length;

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-600">Stay updated with important information</p>
          </div>
          <div className="flex items-center space-x-3">
            {selectedNotifications.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => markAsRead(selectedNotifications)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Mark Read ({selectedNotifications.length})</span>
                </button>
                <button
                  onClick={() => deleteNotifications(selectedNotifications)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete ({selectedNotifications.length})</span>
                </button>
              </div>
            )}
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <CheckAll className="w-4 h-4" />
              <span>Mark All Read</span>
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Notifications</h3>
              <div className="space-y-2">
                {[
                  { id: 'all', label: 'All Notifications', count: notifications.length },
                  { id: 'unread', label: 'Unread', count: unreadCount },
                  { id: 'system', label: 'System', count: systemCount },
                  { id: 'timetable', label: 'Timetable', count: timetableCount },
                  { id: 'student', label: 'Students', count: studentCount },
                  { id: 'teacher', label: 'Teachers', count: teacherCount }
                ].map((filterOption) => (
                  <button
                    key={filterOption.id}
                    onClick={() => setFilter(filterOption.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors flex items-center justify-between ${
                      filter === filterOption.id
                        ? 'bg-purple-100 text-purple-800 border-purple-200'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{filterOption.label}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      filter === filterOption.id
                        ? 'bg-purple-200 text-purple-800'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {filterOption.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Notifications List */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border">
              {/* Header */}
              <div className="px-6 py-4 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-600">Select All</span>
                  </label>
                  <span className="text-sm text-gray-600">
                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Notifications */}
              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
                    <p className="text-gray-600">You're all caught up! Check back later for updates.</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.isRead ? 'bg-blue-25' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-4">
                        <input
                          type="checkbox"
                          checked={selectedNotifications.includes(notification.id)}
                          onChange={() => handleSelectNotification(notification.id)}
                          className="mt-1 rounded border-gray-300"
                        />
                        
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type, notification.priority)}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className={`text-sm font-medium ${
                              !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                              {!notification.isRead && (
                                <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block"></span>
                              )}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                notification.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                notification.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                notification.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {notification.priority.toUpperCase()}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <p className={`text-sm mt-1 ${
                            !notification.isRead ? 'text-gray-800' : 'text-gray-600'
                          }`}>
                            {notification.content}
                          </p>

                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center space-x-4">
                              {!notification.isRead && (
                                <button
                                  onClick={() => markAsRead(notification.id)}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Mark as read</span>
                                </button>
                              )}
                              {notification.actionUrl && (
                                <a
                                  href={notification.actionUrl}
                                  className="text-xs text-purple-600 hover:text-purple-800 font-medium"
                                >
                                  {notification.actionText || 'View Details'}
                                </a>
                              )}
                            </div>
                            
                            <button
                              onClick={() => deleteNotifications(notification.id)}
                              className="text-xs text-red-600 hover:text-red-800 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CoordinatorLayout>
  );
};

export default CoordinatorNotifications;