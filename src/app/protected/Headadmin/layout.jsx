'use client'
import React, { useState, useEffect } from 'react';

// Import your enhanced components
import Sidebar from '../../../Components/headadmin/Sidebar'; // Your enhanced sidebar
import Navbar from '../../../Components/headadmin//Navbar';   // Your enhanced navbar

const HeadAdminLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState('');

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
        // Redirect to login or unauthorized page
        window.location.href = '/protected';
        return;
      }

      const data = await response.json();
      
      // Check if user is head admin
      if (data.user?.role !== 'headadmin') {
        window.location.href = '/auth/unauthorized';
        return;
      }

      setUser(data.user);
    } catch (error) {
      console.error('Auth verification failed:', error);
      setError('Authentication failed');
      window.location.href = '/protected';
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/headadmin/notifications');
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
      
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      window.location.href = '/';
    }
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-6 font-medium text-lg">Verifying access...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we authenticate your session</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">Access Error</h2>
          <p className="text-gray-600 mb-6 text-lg">{error}</p>
          <button
            onClick={() => window.location.href = '/protected'}
            className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Layout Container */}
      <div className="flex min-h-screen">
        {/* Sidebar - Fixed width on large screens */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={handleSidebarClose}
          user={user}
          onLogout={handleLogout}
          currentPath={typeof window !== 'undefined' ? window.location.pathname : '/protected/headadmin'}
        />

        {/* Main Content Area - Takes remaining space */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-0">
          {/* Navbar - Spans full width of remaining space */}
          <Navbar
            onMenuClick={handleSidebarToggle}
            user={user}
            notifications={notifications}
            onLogout={handleLogout}
          />

          {/* Page Content - Full width with no gaps */}
          <main className="flex-1 overflow-auto">
            {/* Content wrapper with consistent padding */}
            <div className="w-full">
              {children}
            </div>
          </main>

          {/* Footer - Spans full width */}
          <footer className="bg-gradient-to-r from-white/70 to-gray-50/70 backdrop-blur-sm border-t border-gray-200/50 py-6">
            <div className="px-8">
              <div className="flex flex-col lg:flex-row justify-between items-center text-sm text-gray-600">
                <div className="flex items-center gap-6 mb-4 lg:mb-0">
                  <p className="font-medium">&copy; 2025 School Management System. All rights reserved.</p>
                  <div className="hidden lg:flex items-center gap-4 text-xs">
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-full border border-blue-200/50 font-medium">
                      v1.0.0
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 rounded-full border border-green-200/50">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-medium text-sm">System Online</span>
                  </span>
                  <span className="text-xs text-gray-500 hidden lg:inline">
                    Last updated: {new Date().toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Styles for smooth scrolling and animations */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(107, 114, 128, 0.7);
        }
        
        /* Ensure sidebar takes exact width on large screens */
        @media (min-width: 1024px) {
          .sidebar-container {
            width: 256px;
            flex-shrink: 0;
          }
        }
        
        /* Animation for page transitions */
        .page-transition {
          animation: fadeInUp 0.3s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        /* Focus styles for better accessibility */
        *:focus {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }
        
        /* Ensure proper text rendering */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
      `}</style>
    </div>
  );
};

export default HeadAdminLayout;