'use client';

import React, { useState, useEffect } from 'react';
import {
  Menu,
  Search,
  Bell,
  Crown,
  Shield,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react';

const Navbar = ({ onMenuClick, user, notifications = [], onLogout }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e?.preventDefault?.();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  const handleNotificationClick = () => {
    setShowNotifications((prev) => !prev);
    setShowProfileMenu(false);
  };

  const handleProfileClick = () => {
    setShowProfileMenu((prev) => !prev);
    setShowNotifications(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const target = event.target;
      // guard for non-Element targets (text nodes, etc.)
      if (!(target instanceof Element)) return;
      if (!target.closest('.dropdown-container')) {
        setShowProfileMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 px-4 sm:px-6 lg:px-8 sticky top-0 z-30">
      <div className="flex justify-between items-center h-16">
        {/* Left Section */}
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-blue-100/50 transition-all duration-200"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center shadow-lg mr-3">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              HeadAdmin Panel
            </span>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:block flex-1 max-w-md mx-6">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search schools, users..."
              className="w-full pl-10 pr-4 py-2 bg-white/60 border border-gray-300/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200"
            />
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Mobile Search Button */}
          <button className="md:hidden p-2 text-gray-400 hover:text-gray-500 hover:bg-blue-100/50 rounded-xl transition-all duration-200">
            <Search className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative dropdown-container">
            <button
              onClick={handleNotificationClick}
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-blue-100/50 rounded-xl transition-all duration-200 group"
            >
              <Bell className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                  {notifications.length > 9 ? '9+' : notifications.length}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-gradient-to-br from-white/90 to-blue-50/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/50 z-50 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
                  <h3 className="text-sm font-semibold text-white">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Bell className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-sm font-medium">No new notifications</p>
                      <p className="text-xs text-gray-400 mt-1">You're all caught up!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100/50">
                      {notifications.slice(0, 5).map((notification, index) => (
                        <div key={index} className="p-4 hover:bg-blue-50/50 transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1.5 flex-shrink-0 animate-pulse" />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title || 'New Notification'}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notification.message || 'You have a new notification'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{notification.time || 'Just now'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">View all notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative dropdown-container">
            <button
              onClick={handleProfileClick}
              className="flex items-center gap-2 p-2 text-gray-700 hover:bg-blue-100/50 rounded-xl transition-all duration-200 group"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-200">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">{user?.firstName || 'Admin'}</p>
                <p className="text-xs text-gray-500">Head Admin</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400 hidden sm:block group-hover:rotate-180 transition-transform duration-200" />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-gradient-to-br from-white/90 to-purple-50/90 backdrop-blur-lg rounded-xl shadow-2xl border border-white/50 z-50 overflow-hidden">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-white truncate">{user?.firstName} {user?.lastName}</p>
                      <p className="text-sm text-purple-100 truncate">{user?.email}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-100/20 to-orange-100/20 text-white text-xs font-medium rounded-full border border-white/20 backdrop-blur-sm">Head Administrator</span>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.href = '/protected/headadmin/settings/profile';
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                      <User className="w-4 h-4 text-blue-600" />
                    </div>
                    <span className="font-medium">Profile Settings</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      window.location.href = '/protected/headadmin/settings';
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-gray-700 hover:bg-blue-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                      <Settings className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="font-medium">System Settings</span>
                  </button>
                </div>

                <div className="border-t border-gray-200/50 py-2">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      onLogout?.();
                    }}
                    className="flex items-center w-full px-4 py-3 text-sm text-red-700 hover:bg-red-50/50 transition-colors group"
                  >
                    <div className="w-8 h-8 bg-gradient-to-br from-red-100 to-pink-100 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200">
                      <LogOut className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden border-t border-gray-200/50 px-4 py-3">
        <form onSubmit={handleSearch} className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search schools, users..."
            className="w-full pl-10 pr-4 py-2 bg-white/60 border border-gray-300/50 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 backdrop-blur-sm transition-all duration-200 placeholder-gray-500"
          />
        </form>
      </div>
    </div>
  );
};

export default Navbar;
