'use client';

import React, { useState, useEffect } from 'react';
import HeadAdminNavbar from '../components/head/HeadAdminNavbar';
import HeadAdminSidebar from '../components/head/HeadAdminSidebar';

interface HeadAdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
}

const SIDEBAR_WIDTH = 64; // width in px for collapsed sidebar

const HeadAdminLayout: React.FC<HeadAdminLayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [isDark, setIsDark] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [internalActiveTab, setInternalActiveTab] = useState(activeTab || '');

  const setTab = setActiveTab || setInternalActiveTab;

  // Theme management
  useEffect(() => {
    if (typeof window === 'undefined') return;

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
    if (typeof window !== 'undefined') {
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    }
  };

  // Responsive sidebar collapse
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setIsSidebarCollapsed(window.innerWidth < 1024);
    };

    handleResize(); // initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex">
      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen z-40 transition-all duration-300`}
        style={{ width: isSidebarCollapsed ? SIDEBAR_WIDTH : SIDEBAR_WIDTH }}
      >
        <HeadAdminSidebar
          activeTab={internalActiveTab}
          setActiveTab={setInternalActiveTab}
          isCollapsed={true}
          setIsCollapsed={setIsSidebarCollapsed}
        />
      </div>

      {/* Main Content */}
      <div
        className="flex-1 flex flex-col min-h-screen"
        style={{ marginLeft: SIDEBAR_WIDTH }}
      >
        {/* Navbar */}
        <div className="fixed top-0 left-0 right-0 z-30" style={{ marginLeft: SIDEBAR_WIDTH }}>
          <HeadAdminNavbar isDark={isDark} toggleTheme={toggleTheme} />
        </div>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto pt-16 px-0" style={{ minHeight: '100vh', maxWidth: '100vw', overflowX: 'hidden' }}>
          <div className="max-w-6xl mx-auto px-2 py-4">{children}</div>
        </main>
      </div>

      {/* Mobile overlay */}
      {!isSidebarCollapsed && typeof window !== 'undefined' && window.innerWidth < 1024 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarCollapsed(true)}
        />
      )}
    </div>
  );
};

export default HeadAdminLayout;
