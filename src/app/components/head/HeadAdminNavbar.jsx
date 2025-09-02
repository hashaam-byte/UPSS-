'use client'
import React, { useState } from 'react';
import { 
  Users, 
  School, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Sun, 
  Moon, 
  Settings, 
  Bell,
  User,
  Shield,
  LogOut,
  Key,
  Mail,
  Palette,
  Globe,
  HelpCircle,
  ChevronDown,
  Camera,
  Check,
  X,
  LayoutDashboard, 
  BarChart3, 
  MessageSquare,
  Download,
  Upload,
  RefreshCw,
  Activity,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

// Navbar Component
const HeadAdminNavbar = ({ isDark, toggleTheme }) => {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New School Registration",
      message: "Rainbow College has requested platform access",
      time: "2 minutes ago",
      type: "info",
      unread: true
    },
    {
      id: 2,
      title: "Payment Received",
      message: "Future Leaders Academy - ₦112,500 payment confirmed",
      time: "1 hour ago",
      type: "success",
      unread: true
    },
    {
      id: 3,
      title: "Trial Expiring Soon",
      message: "5 schools have trials ending in 3 days",
      time: "3 hours ago",
      type: "warning",
      unread: false
    }
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, unread: false } : n
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, unread: false }))
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return '🎉';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return 'ℹ️';
    }
  };

  return (
    <nav className="h-16 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-lg flex items-center justify-center">
            <Shield className="text-white" size={18} />
          </div>
          <div>
            <h1 className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
              U PLUS
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Head Admin</p>
          </div>
        </div>

        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search schools, users..."
              className="pl-10 pr-4 py-2 w-80 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative">
          <button
            onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
            className="relative p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105"
            title="Notifications"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotificationsDropdown && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-96 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 cursor-pointer ${
                      notification.unread ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </h4>
                          {notification.unread && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200 hover:scale-105"
            title="Settings"
          >
            <Settings size={20} />
          </button>

          {showSettingsDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50">
              <div className="p-3 border-b border-gray-200 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">Quick Settings</h3>
              </div>
              
              <div className="p-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                  <User size={16} />
                  Profile Settings
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors font-medium">
                  <Settings size={16} />
                  Go to Settings Page
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
 export default HeadAdminNavbar;