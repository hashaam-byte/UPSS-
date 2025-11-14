'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  BookOpen,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  ExternalLink
} from 'lucide-react';

const ClassTeacherLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const notificationRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    verifyClassTeacherAccess();
  }, []);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const verifyClassTeacherAccess = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      const data = await response.json();

      if (!data.authenticated) {
        router.push('/protected');
        return;
      }

      // Verify user is a teacher
      if (data.user.role !== 'teacher') {
        router.push('/auth/unauthorized');
        return;
      }

      // REMOVED: The unnecessary check for class assignment
      // Class teachers are always assigned during creation by admin
      // So this validation is not needed

      setUser(data.user);
      setSchool(data.school);
      
      // Fetch initial unread count
      fetchUnreadCount();
    } catch (error) {
      console.error('Auth verification failed:', error);
      router.push('/protected');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch('/api/protected/teacher/class/notifications/count', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setUnreadCount(data.count || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  const fetchTodaysNotifications = async () => {
    setLoadingNotifications(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/protected/teacher/class/notifications?date=${today}&limit=10`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.unreadCount || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const toggleNotificationDropdown = () => {
    if (!showNotificationDropdown) {
      fetchTodaysNotifications();
    }
    setShowNotificationDropdown(!showNotificationDropdown);
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/protected/teacher/class/notifications/mark-read', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ notificationId })
      });
      
      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/protected/teacher/class/notifications/mark-all-read', {
        method: 'PUT',
        credentials: 'include'
      });
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/protected');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/protected/teacher/class/dashboard',
      icon: Home
    },
    {
      name: 'My Students',
      href: '/protected/teacher/class/students',
      icon: Users
    },
    {
      name: 'Performance',
      href: '/protected/teacher/class/performance',
      icon: TrendingUp
    },
    {
      name: 'Attendance',
      href: '/protected/teacher/class/attendance',
      icon: Calendar
    },
    {
      name: 'Analytics',
      href: '/protected/teacher/class/analytics',
      icon: BarChart3
    },
    {
      name: 'Messages',
      href: '/protected/teacher/class/messages',
      icon: MessageSquare
    },
    {
      name: 'Calendar',
      href: '/protected/teacher/class/calendar',
      icon: Calendar
    },
    {
      name: 'Settings',
      href: '/protected/teacher/class/settings',
      icon: Settings
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Verifying Access</h2>
            <p className="text-sm text-gray-600">Please wait while we verify your permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user || !school) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } lg:w-64 flex flex-col fixed h-full z-30`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarOpen ? 'block' : 'hidden lg:flex'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Class Teacher</h1>
                <p className="text-xs text-gray-500">{school.name}</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors relative ${
                  sidebarOpen ? 'justify-start' : 'justify-center lg:justify-start'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                  {item.name}
                </span>
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={`${user.firstName} ${user.lastName}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-white" />
              )}
            </div>
            <div className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              <p className="font-semibold text-gray-900 text-sm">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500">Class Teacher</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center space-x-3 px-4 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors ${
              sidebarOpen ? 'justify-start' : 'justify-center lg:justify-start'
            }`}
          >
            <LogOut className="w-5 h-5" />
            <span className={`${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col ml-20 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 sticky top-0 z-20">
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
                  onClick={toggleNotificationDropdown}
                  className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown */}
                {showNotificationDropdown && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
                    {/* Dropdown Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-xl">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-lg">Today's Updates</h3>
                        <p className="text-xs text-gray-600 flex items-center space-x-1 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'short', 
                            day: 'numeric' 
                          })}</span>
                        </p>
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {/* Notifications List */}
                    <div className="flex-1 overflow-y-auto">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="text-center py-12 px-4">
                          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500 font-medium">No notifications today</p>
                          <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                                !notification.isRead ? 'bg-blue-50/30' : ''
                              }`}
                              onClick={() => {
                                if (!notification.isRead) {
                                  markAsRead(notification.id);
                                }
                                if (notification.actionUrl) {
                                  router.push(notification.actionUrl);
                                  setShowNotificationDropdown(false);
                                }
                              }}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0 mt-1">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <p className={`text-sm font-medium text-gray-900 ${
                                      !notification.isRead ? 'font-semibold' : ''
                                    }`}>
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <span className="ml-2 w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {notification.content}
                                  </p>
                                  <div className="flex items-center justify-between mt-2">
                                    <span className="text-xs text-gray-500">
                                      {formatTime(notification.createdAt)}
                                    </span>
                                    {notification.actionUrl && (
                                      <span className="flex items-center text-xs text-blue-600 hover:text-blue-700">
                                        View
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dropdown Footer */}
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
                        <button
                          onClick={() => {
                            router.push('/protected/teacher/class/notifications');
                            setShowNotificationDropdown(false);
                          }}
                          className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          View All Notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* School Info */}
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-gray-900">{school.name}</p>
                <p className="text-xs text-gray-500">
                  {school.subscriptionIsActive ? 'Active' : 'Inactive'} • {school.subscriptionPlan}
                </p>
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

export default ClassTeacherLayout;