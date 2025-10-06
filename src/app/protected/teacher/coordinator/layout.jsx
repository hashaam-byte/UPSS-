'use client'
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Users,
  FileText,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ChevronDown,
  BookOpen,
  UserCheck,
  BarChart3,
  Clock,
  Shield,
  AlertCircle,
  CheckCircle,
  User,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

const CoordinatorLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const userDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);

  useEffect(() => {
    checkAuthAndFetchData();
    fetchNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Verify user is a coordinator
        if (data.user.role !== 'teacher' || data.user.department !== 'coordinator') {
          router.push('/auth/unauthorized');
          return;
        }
        
        setUser(data.user);
      } else {
        router.push('/protected');
        return;
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError('Authentication failed');
      router.push('/protected?role=teacher');
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/teachers/coordinator/notifications?filter=unread', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.data.notifications.slice(0, 5)); // Get latest 5 notifications
      }
    } catch (error) {
      console.error('Notifications fetch error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      router.push('/protected');
    } catch (error) {
      console.error('Logout error:', error);
      router.push('/protected');
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      await fetch('/api/protected/teachers/coordinator/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [notificationId]
        })
      });
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Mark notification as read error:', error);
    }
  };

  const sidebarItems = [
    {
      href: '/protected/teacher/coordinator/dashboard',
      icon: Home,
      label: 'Dashboard',
      description: 'Overview and quick actions',
      badge: null
    },
    {
      href: '/protected/teacher/coordinator/students',
      icon: GraduationCap,
      label: 'Student Management',
      description: 'Assign arms and organize classes',
      badge: null
    },
    {
      href: '/protected/teacher/coordinator/timetable',
      icon: Calendar,
      label: 'Timetable Builder',
      description: 'Create and manage schedules',
      badge: null
    },
    {
      href: '/protected/teacher/coordinator/teachers',
      icon: UserCheck,
      label: 'Teacher Allocation',
      description: 'Assign subjects to teachers',
      badge: null
    },
    {
      href: '/protected/teacher/coordinator/reports',
      icon: FileText,
      label: 'Reports & Analytics',
      description: 'Generate coordination reports',
      badge: null
    },
    {
      href: '/protected/teacher/coordinator/messages',
      icon: MessageSquare,
      label: 'Messages',
      description: 'Communicate with teachers and admins',
      badge: null
    }
  ];

  const unreadNotifications = notifications.filter(n => !n.isRead).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'system':
        return <AlertCircle className="w-4 h-4 text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading coordinator dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/protected?role=teacher')}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-purple-600 to-blue-600">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">U PLUS</h1>
                <p className="text-purple-100 text-xs">Coordinator Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-white hover:bg-white/20 p-1 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="p-6 bg-gradient-to-b from-purple-50 to-white border-b">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">Academic Coordinator</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                    <Shield className="w-3 h-3" />
                    <span>Verified Access</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {sidebarItems.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg'
                      : 'text-gray-600 hover:bg-purple-50 hover:text-purple-600'
                    }
                  `}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className={`
                    w-5 h-5 mr-3 transition-transform duration-200
                    ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-purple-500'}
                    ${isActive ? 'scale-110' : 'group-hover:scale-105'}
                  `} />
                  <div className="flex-1">
                    <div className={isActive ? 'text-white' : 'group-hover:text-purple-600'}>
                      {item.label}
                    </div>
                    <div className={`
                      text-xs mt-0.5 transition-colors duration-200
                      ${isActive ? 'text-purple-100' : 'text-gray-400 group-hover:text-purple-400'}
                    `}>
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <span className="ml-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full ml-2" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <Link
              href="/protected/teacher/coordinator/notifications"
              className={`
                flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${pathname === '/protected/teacher/coordinator/notifications'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Bell className="w-4 h-4 mr-3" />
              Notifications
              {unreadNotifications > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                  {unreadNotifications}
                </span>
              )}
            </Link>
            
            <Link
              href="/protected/teacher/coordinator/settings"
              className={`
                flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200
                ${pathname === '/protected/teacher/coordinator/settings'
                  ? 'bg-purple-100 text-purple-600'
                  : 'text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Link>

            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b h-16 flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Coordinator Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Academic coordination and management portal
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick Actions */}
            <div className="hidden md:flex items-center space-x-2">
              <Link
                href="/protected/teacher/coordinator/timetable"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <Calendar className="w-4 h-4" />
                <span>Create Timetable</span>
              </Link>
              <Link
                href="/protected/teacher/coordinator/students"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-2"
              >
                <GraduationCap className="w-4 h-4" />
                <span>Assign Arms</span>
              </Link>
            </div>

            {/* Notifications Dropdown */}
            <div className="relative" ref={notificationDropdownRef}>
              <button
                onClick={() => {
                  setShowNotificationDropdown(!showNotificationDropdown);
                  setShowUserDropdown(false);
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotificationDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifications</h3>
                      <span className="text-xs text-gray-500">
                        {unreadNotifications} unread
                      </span>
                    </div>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center">
                        <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                            !notification.isRead ? 'bg-blue-25' : ''
                          }`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 mt-1">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <p className={`text-sm font-medium truncate ${
                                  !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                                }`}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2">
                                {notification.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  <div className="p-4 border-t bg-gray-50">
                    <Link
                      href="/protected/teacher/coordinator/notifications"
                      className="text-sm text-purple-600 hover:text-purple-800 font-medium"
                      onClick={() => setShowNotificationDropdown(false)}
                    >
                      View all notifications →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu Dropdown */}
            {user && (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => {
                    setShowUserDropdown(!showUserDropdown);
                    setShowNotificationDropdown(false);
                  }}
                  className="flex items-center space-x-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-600">Coordinator</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {/* User Dropdown */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Academic Coordinator</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href="/protected/teacher/coordinator/profile"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <User className="w-4 h-4 mr-3" />
                        My Profile
                      </Link>
                      
                      <Link
                        href="/protected/teacher/coordinator/settings"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </Link>
                      
                      <Link
                        href="/help"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <HelpCircle className="w-4 h-4 mr-3" />
                        Help & Support
                      </Link>
                    </div>
                    
                    <div className="border-t py-2">
                      <button
                        onClick={() => {
                          setShowUserDropdown(false);
                          handleLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4 mr-3" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="container mx-auto px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t px-6 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span>© 2025 U PLUS Education Platform</span>
              <span>•</span>
              <span>Coordinator Portal v2.0</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/help" className="hover:text-purple-600 transition-colors">
                Help & Support
              </Link>
              <Link href="/privacy" className="hover:text-purple-600 transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CoordinatorLayout;