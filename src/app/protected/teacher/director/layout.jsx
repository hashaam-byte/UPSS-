'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  UserCheck,
  Calendar,
  FileText,
  BarChart3,
  MessageSquare,
  Settings,
  GraduationCap,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Crown,
  BookOpen
} from 'lucide-react';

const sidebarItems = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3, path: '/protected/teacher/director/dashboard' },
  { id: 'students', label: 'Students', icon: Users, path: '/protected/teacher/director/students' },
  { id: 'teachers', label: 'Teachers', icon: UserCheck, path: '/protected/teacher/director/teachers' },
  { id: 'subjects', label: 'Subjects', icon: BookOpen, path: '/protected/teacher/director/subjects' },
  { id: 'timetable', label: 'Timetable Approval', icon: Calendar, path: '/protected/teacher/director/timetable' },
  { id: 'reports', label: 'Reports', icon: FileText, path: '/protected/teacher/director/reports' },
  { id: 'messages', label: 'Messages', icon: MessageSquare, path: '/protected/teacher/director/messages' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/protected/teacher/director/settings' }
];

export default function DirectorLayout({ children }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    verifyAuthentication();
    fetchNotifications();
  }, []);

  const verifyAuthentication = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        window.location.href = '/protected';
        return;
      }

      const data = await response.json();
      
      if (data.user?.role !== 'director') {
        window.location.href = '/auth/unauthorized';
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Auth verification failed:', error);
      window.location.href = '/protected';
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/teachers/director/notifications', {
        credentials: 'include'
      });
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
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include' 
      });
      window.location.href = '/protected';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-white mt-6 font-medium text-lg">Verifying access...</p>
          <p className="text-gray-400 text-sm mt-2">Please wait while we authenticate your session</p>
        </div>
      </div>
    );
  }

  const Sidebar = ({ isOpen, onClose }) => (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white/95 to-gray-50/95 backdrop-blur-xl border-r border-white/20 transform ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    } transition-transform duration-300 lg:translate-x-0 shadow-2xl`}>
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900 text-lg">U PLUS</h1>
            <p className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-semibold">DIRECTOR PANEL</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Info */}
      <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.department} Director</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map(item => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-[1.02]'
                  : 'text-gray-700 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:scale-[1.02]'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span className="font-medium">{item.label}</span>
              {isActive && (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse ml-auto"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200/50 bg-gradient-to-r from-red-50/50 to-pink-50/30">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:text-white hover:bg-gradient-to-r hover:from-red-500 hover:to-pink-500 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-lg font-medium"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-100 group-hover:bg-white/20 transition-colors">
            <LogOut className="w-4 h-4" />
          </div>
          Logout
        </button>
      </div>
    </div>
  );

  const Navbar = () => (
    <header className="bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-xl border-b border-white/20 shadow-lg sticky top-0 z-40">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="hidden lg:flex items-center gap-6">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search anything..."
                className="bg-white/60 border border-gray-200/50 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all w-80"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-colors">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          <div className="flex items-center gap-3 px-3 py-2 bg-white/50 rounded-xl border border-gray-200/50 backdrop-blur-sm">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500">Director</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-900 to-slate-900">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div className="lg:ml-72 min-h-screen flex flex-col">
        <Navbar />
        
        <main className="flex-1">
          <div className="p-8">
            {children}
          </div>
        </main>

        <footer className="bg-gradient-to-r from-white/5 to-gray-50/5 backdrop-blur-sm border-t border-white/10 py-6">
          <div className="px-8">
            <div className="flex flex-col lg:flex-row justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-6 mb-4 lg:mb-0">
                <p className="font-medium">&copy; 2025 U PLUS School Management. All rights reserved.</p>
                <div className="hidden lg:flex items-center gap-4 text-xs">
                  <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30 font-medium">
                    Director v1.0
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">Online</span>
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}