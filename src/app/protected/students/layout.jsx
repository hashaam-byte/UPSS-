'use client'
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  FileText,
  BarChart3,
  Calendar,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Download,
  Award,
  GraduationCap,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

const StudentLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    verifyStudentAccess();
    fetchNotifications();
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

  const verifyStudentAccess = async () => {
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

      if (data.user.role !== 'student') {
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
      setLoadingNotifications(true);
      const response = await fetch('/api/protected/students/notifications?limit=10&read=false');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data.notifications || []);
          setUnreadCount(data.data.summary?.unreadTotal || 0);
        }
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch('/api/protected/students/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notificationId,
          markAsRead: true
        })
      });

      if (response.ok) {
        // Remove notification from list
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const response = await fetch('/api/protected/students/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          markAsRead: true
        })
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
      }
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

  const formatNotificationTime = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffInMinutes = Math.floor((now - notifDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return notifDate.toLocaleDateString();
  };

  const sidebarItems = [
    {
      name: 'Dashboard',
      href: '/protected/students/dashboard',
      icon: Home
    },
    {
      name: 'My Subjects',
      href: '/protected/students/subjects',
      icon: BookOpen
    },
    {
      name: 'Assignments',
      href: '/protected/students/assignments',
      icon: FileText
    },
    {
      name: 'Grades',
      href: '/protected/students/grades',
      icon: Award
    },
    {
      name: 'Performance',
      href: '/protected/students/performance',
      icon: BarChart3
    },
    {
      name: 'Timetable',
      href: '/protected/students/timetable',
      icon: Calendar
    },
    {
      name: 'Resources',
      href: '/protected/students/resources',
      icon: Download
    },
    {
      name: 'Messages',
      href: '/protected/students/messages',
      icon: MessageSquare
    },
      
    {
      name: 'Tests',
      href: '/protected/students/tests',
      icon: FileText,
    }

  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Verifying Access</h2>
            <p className="text-sm text-gray-600">Please wait...</p>
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
      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white shadow-xl transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      }`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {sidebarOpen && (
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Student Portal</h1>
                  <p className="text-xs text-gray-500 truncate max-w-[150px]">{school.name}</p>
                </div>
              </div>
            )}
            {!sidebarOpen && (
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mx-auto">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
            )}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${!sidebarOpen && 'hidden'}`}
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          {!sidebarOpen && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="mt-4 w-full p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors ${
                  sidebarOpen ? 'justify-start' : 'justify-center'
                }`}
                title={!sidebarOpen ? item.name : ''}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span className="font-medium">{item.name}</span>}
              </a>
            );
          })}
        </nav>

        {/* School Name at Bottom */}
        <div className="p-4 border-t border-gray-200">
          {sidebarOpen ? (
            <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Enrolled at</p>
              <p className="font-semibold text-gray-900 text-sm">{school.name}</p>
            </div>
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl flex items-center justify-center mx-auto" title={school.name}>
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      {mobileSidebarOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="lg:hidden fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50 flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-gray-900">Student Portal</h1>
                    <p className="text-xs text-gray-500">{school.name}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileSidebarOpen(false)}
                    className="flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{item.name}</span>
                  </a>
                );
              })}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                <p className="text-xs text-gray-500 mb-1">Enrolled at</p>
                <p className="font-semibold text-gray-900 text-sm">{school.name}</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
              >
                <Menu className="w-5 h-5 text-gray-600" />
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
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    if (!showNotifications) {
                      fetchNotifications();
                    }
                  }}
                  className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="overflow-y-auto max-h-80">
                      {loadingNotifications ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="w-6 h-6 text-purple-600 animate-spin" />
                        </div>
                      ) : notifications.length > 0 ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleMarkAsRead(notification.id)}
                          >
                            <div className="flex items-start justify-between mb-1">
                              <h4 className="font-medium text-gray-900 text-sm">{notification.title}</h4>
                              <span className="text-xs text-gray-500">{formatNotificationTime(notification.createdAt)}</span>
                            </div>
                            <p className="text-sm text-gray-600">{notification.content}</p>
                            {notification.actionUrl && (
                              <a
                                href={notification.actionUrl}
                                className="text-xs text-purple-600 hover:text-purple-700 font-medium mt-2 inline-block"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {notification.actionText || 'View'}
                              </a>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                          <Bell className="w-12 h-12 mb-2 text-gray-300" />
                          <p className="text-sm">No new notifications</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu Dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
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
                  <span className="hidden md:block font-medium text-gray-900">
                    {user.firstName}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b border-gray-200">
                      <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {user.studentProfile?.className} • {user.studentProfile?.studentId}
                      </p>
                    </div>

                    <div className="py-2">
                      <a
                        href="/protected/students/profile"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">Profile</span>
                      </a>

                      <a
                        href="/protected/students/settings"
                        className="flex items-center space-x-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </a>

                      <button
                        onClick={() => {
                          setShowUserMenu(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Logout</span>
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
    </div>
  );
};

export default StudentLayout;