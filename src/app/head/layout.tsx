'use client'
import React, { useState, useEffect } from 'react';
import HeadAdminNavbar from '../components/head/HeadAdminNavbar';
import HeadAdminSidebar from '../components/head/HeadAdminSidebar';

const SIDEBAR_WIDTH = 64; // Make sidebar smaller (was 256)

const HeadAdminLayout = ({ children, activeTab, setActiveTab }) => {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load theme preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    if (newTheme) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  // Handle responsive sidebar collapse
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Fixed Sidebar */}
      <div className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300 ${isSidebarCollapsed ? 'w-16' : 'w-16'}`}>
        <HeadAdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isCollapsed={true} // Always collapsed for smaller sidebar
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content Area */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{
          marginLeft: SIDEBAR_WIDTH, // px value for w-16
        }}
      >
        {/* Fixed Navbar */}
        <div className="fixed top-0 left-0 right-0 z-30" style={{
          marginLeft: SIDEBAR_WIDTH,
        }}>
          <HeadAdminNavbar
            isDark={isDark}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* Scrollable Page Content */}
        <main
          className="flex-1 overflow-y-auto pt-16 px-0"
          style={{
            minHeight: '100vh',
            maxWidth: '100vw',
            overflowX: 'hidden'
          }}
        >
          {/* Add top padding for navbar height */}
          <div className="max-w-6xl mx-auto px-2 py-4">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {!isSidebarCollapsed && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default HeadAdminLayout;