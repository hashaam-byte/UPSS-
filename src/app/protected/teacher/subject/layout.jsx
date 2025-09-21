// /app/protected/teacher/subject/layout.jsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Home,
  BookOpen,
  FileText,
  CheckSquare,
  Users,
  BarChart3,
  Upload,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  User,
  Bell,
  Calendar,
  Target,
  Loader2,
  FolderOpen
} from 'lucide-react';

const SubjectTeacherLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    verifySubjectTeacherAccess();
    fetchNotifications();
  }, []);

  const verifySubjectTeacherAccess = async () => {
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

      // Verify user is a subject teacher
      if (data.user.role !== 'teacher' || data.user.department !== 'subject_teacher') {
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
      href: '/protected/teacher/subject/dashboard',
      icon: Home
    },
    {
      name: 'My Subjects',
      href: '/protected/teacher/subject/subjects',
      icon: BookOpen
    },
    {
      name: 'Assignments',
      href: '/protected/teacher/subject/assignments',
      icon: FileText
    },
    {
      name: 'Grading',
      href: '/protected/teacher/subject/grading',
      icon: CheckSquare
    },
    {
      name: 'Students',
      href: '/protected/teacher/subject/students',
      icon: Users
    },
    {
      name: 'Analytics',
      href: '/protected/teacher/subject/analytics',
      icon: BarChart3
    },
    {
      name: 'Resources',
      href: '/protected/teacher/subject/resources',
      icon: FolderOpen
    },
    {
      name: 'Messages',
      href: '/protected/teacher/subject/messages',
      icon: MessageSquare,
      badge: unreadCount > 0 ? unreadCount : null
    },
    {
      name: 'Reports',
      href: '/protected/teacher/subject/reports',
      icon: Target
    },
    {
      name: 'Settings',
      href: '/protected/teacher/subject/settings',
      icon: Settings
    }
  ];

  // Show loading screen while verifying authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Verifying Access</h2>
            <p className="text-sm text-gray-600">Please wait while we verify your permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render anything if user is not authenticated (redirect will happen)
  if (!user || !school) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-xl transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-20'
      } lg:w-64 flex flex-col`}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarOpen ? 'block' : 'hidden lg:flex'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-blue-600 rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Subject Teacher</h1>
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
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors relative ${
                  sidebarOpen ? 'justify-start' : 'justify-center lg:justify-start'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`font-medium ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
                  {item.name}
                </span>
                {item.badge && (
                  <span className={`ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1 ${
                    sidebarOpen ? 'block' : 'hidden lg:block'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </a>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center">
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
              <p className="text-xs text-gray-500">Subject Teacher</p>
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
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
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
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => router.push('/protected/teacher/subject/notifications')}
                  className="p-2 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>

              {/* School Info */}
              <div className="text-right">
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

export default SubjectTeacherLayout;