// /app/protected/teacher/class/layout.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Home,
  Users,
  TrendingUp,
  MessageSquare,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  X,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Award,
  Calendar,
  FileText,
  Mail
} from 'lucide-react';

const ClassTeacherLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Sidebar navigation items for Class Teacher
  const navigationItems = [
    {
      title: 'Dashboard',
      href: '/protected/teacher/class/dashboard',
      icon: Home,
      description: 'Overview of your assigned students'
    },
    {
      title: 'My Students',
      href: '/protected/teacher/class/students',
      icon: Users,
      description: 'View and manage your assigned students'
    },
    {
      title: 'Performance Tracker',
      href: '/protected/teacher/class/performance',
      icon: TrendingUp,
      description: 'Monitor student academic progress'
    },
    {
      title: 'Messages',
      href: '/protected/teacher/class/messages',
      icon: MessageSquare,
      description: 'Communicate with students and parents'
    },
    {
      title: 'Reports',
      href: '/protected/teacher/class/reports',
      icon: FileText,
      description: 'Generate and view student reports'
    },
    {
      title: 'Settings',
      href: '/protected/teacher/class/settings',
      icon: Settings,
      description: 'Manage your preferences'
    }
  ];

  useEffect(() => {
    fetchUserData();
    fetchNotifications();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/protected/teacher/profile');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSchool(data.school);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/protected');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActiveRoute = (href) => {
    return pathname === href || pathname.startsWith(href + '/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">Class Teacher</h1>
                <p className="text-xs text-gray-500">Student Mentor</p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-emerald-600 font-medium">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.teacherProfile?.coordinatorClass} Class Teacher
                </p>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-600">
              <p>{school?.name}</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                  isActiveRoute(item.href)
                    ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-500'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-xs text-gray-500 truncate">{item.description}</div>
                </div>
              </button>
            ))}
          </nav>

          {/* Quick Stats */}
          <div className="p-4 border-t bg-gray-50 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Assigned Students</span>
              <span className="font-semibold text-emerald-600">24</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Avg Performance</span>
              <span className="font-semibold text-blue-600">78%</span>
            </div>
          </div>

          {/* Logout */}
          <div className="p-4 border-t">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md hover:bg-gray-100"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Class Teacher Portal
                </h2>
                <p className="text-sm text-gray-500">
                  Monitor and support your assigned students
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="hidden md:block relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* User Menu */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                  <span className="text-emerald-600 text-sm font-medium">
                    {user?.firstName?.[0]}
                  </span>
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700">
                  {user?.firstName}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ClassTeacherLayout;