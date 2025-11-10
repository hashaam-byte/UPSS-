'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home, BookOpen, FileText, CheckSquare, Users, BarChart3, Upload,
  MessageSquare, Settings, LogOut, Menu, X, User, Bell, Calendar,
  Target, Loader2, FolderOpen, ChevronDown, Clock
} from 'lucide-react';

const ImprovedSubjectTeacherLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const router = useRouter();
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    verifySubjectTeacherAccess();
    fetchNotifications();
    fetchTodaySchedule();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const verifySubjectTeacherAccess = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Authentication failed');

      const data = await response.json();

      if (!data.authenticated || data.user.role !== 'teacher' || data.user.department !== 'subject_teacher') {
        router.push('/auth/unauthorized');
        return;
      }

      setUser(data.user);
      setSchool(data.school);
    } catch (error) {
      console.error('Auth verification failed:', error);
      router.push('/protected');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/notifications?limit=5&read=false');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.summary?.unreadTotal || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const fetchTodaySchedule = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/today-schedule');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTodaySchedule(data.schedule || []);
        }
      }
    } catch (error) {
      console.error('Failed to fetch schedule:', error);
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch('/api/protected/teacher/subject/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/protected/teacher/subject/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_all_read' })
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/protected');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment_submission':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'alert':
        return <Bell className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTimeDisplay = (time) => {
    if (!time) return '';
    // Convert "08:00" to "8:00 AM"
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const sidebarItems = [
    { name: 'Dashboard', href: '/protected/teacher/subject/dashboard', icon: Home },
    { name: 'My Subjects', href: '/protected/teacher/subject/subjects', icon: BookOpen },
    { name: 'Assignments', href: '/protected/teacher/subject/assignments', icon: FileText },
    { name: 'Online Tests', href: '/protected/teacher/subject/online-tests', icon: CheckSquare },
    { name: 'Grading', href: '/protected/teacher/subject/grading', icon: CheckSquare },
    { name: 'Students', href: '/protected/teacher/subject/students', icon: Users },
    { name: 'Analytics', href: '/protected/teacher/subject/analytics', icon: BarChart3 },
    { name: 'Resources', href: '/protected/teacher/subject/resources', icon: FolderOpen },
    { name: 'Messages', href: '/protected/teacher/subject/messages', icon: MessageSquare, badge: unreadCount > 0 ? unreadCount : null },
    { name: 'Reports', href: '/protected/teacher/subject/reports', icon: Target }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Verifying Access</h2>
            <p className="text-sm text-gray-600">Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !school) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex">
       {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 fixed inset-y-0 left-0 z-30 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-20'
      } lg:relative lg:inset-auto`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 transition-all ${sidebarOpen ? 'opacity-100' : 'opacity-0 lg:opacity-100'}`}>
              {sidebarOpen && (
                <>
                  <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 whitespace-nowrap">Subject Teacher</h1>
                    <p className="text-xs text-gray-500 truncate">{school.name}</p>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto" style={{ height: 'calc(100vh - 280px)' }}>
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors relative ${
                  sidebarOpen ? 'justify-start' : 'justify-center'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <>
                    <span className="font-medium">{item.name}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {!sidebarOpen && item.badge && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* Today's Schedule Preview */}
        {sidebarOpen && todaySchedule.length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-600 mb-2">Today's Classes</h3>
            <div className="space-y-2">
              {todaySchedule.slice(0, 2).map((lesson, index) => (
                <div key={index} className="bg-blue-50 rounded-lg p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-blue-900">{lesson.subject}</span>
                    <span className="text-blue-600">{lesson.className}</span>
                  </div>
                  <div className="flex items-center text-blue-700">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{getTimeDisplay(lesson.startTime)} - {getTimeDisplay(lesson.endTime)}</span>
                  </div>
                </div>
              ))}
              {todaySchedule.length > 2 && (
                <a href="/protected/teacher/subject/dashboard" className="text-xs text-blue-600 hover:underline">
                  +{todaySchedule.length - 2} more classes
                </a>
              )}
            </div>
          </div>
        )}

        {/* Settings Link */}
        {sidebarOpen && (
          <div className="p-4 border-t border-gray-200">
            <a
              href="/protected/teacher/subject/settings"
              className="flex items-center space-x-3 px-4 py-2 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </a>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex-shrink-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <p className="text-sm text-gray-600">Welcome back,</p>
                <p className="font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications Dropdown */}
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No new notifications</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              markNotificationAsRead(notification.id);
                              if (notification.actionUrl) {
                                router.push(notification.actionUrl);
                              }
                            }}
                          >
                            <div className="flex items-start space-x-3">
                              <div className="mt-1">
                                {getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900">
                                  {notification.title}
                                </p>
                                <p className="text-sm text-gray-600 mt-1">
                                  {notification.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notification.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 text-center">
                        <a
                          href="/protected/teacher/subject/notifications"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          View all notifications
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* School Name */}
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-gray-900">{school.name}</p>
                <p className="text-xs text-gray-500">
                  {school.subscriptionIsActive ? 'Active' : 'Inactive'} • {school.subscriptionPlan}
                </p>
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-sm font-semibold text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500">Subject Teacher</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Subject Teacher</p>
                    </div>
                    <div className="py-2">
                      <a
                        href="/protected/teacher/subject/settings"
                        className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 text-gray-700"
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </a>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 hover:bg-red-50 text-red-600"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ImprovedSubjectTeacherLayout;