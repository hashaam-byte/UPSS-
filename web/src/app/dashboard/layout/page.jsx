'use client'
import React, { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Menu, X } from 'lucide-react';

// Theme Context
const ThemeContext = createContext();
const SidebarContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

// Theme Provider
const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    // Check for saved theme in localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    setTheme(savedTheme || systemTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Sidebar Provider
const SidebarProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleCollapse = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <SidebarContext.Provider value={{
      sidebarOpen,
      sidebarCollapsed,
      toggleSidebar,
      toggleCollapse,
      closeSidebar,
      setSidebarOpen
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Enhanced Sidebar Component
const EnhancedSidebar = ({ children, user, sidebarItems, bottomContent }) => {
  const { sidebarOpen, sidebarCollapsed, toggleCollapse } = useSidebar();
  const { theme } = useTheme();

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        className={`fixed inset-y-0 left-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 dark:border-gray-700 transition-all duration-300 hidden lg:block ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {children}
      </motion.div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl lg:hidden"
            initial={{ x: -256 }}
            animate={{ x: 0 }}
            exit={{ x: -256 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Theme Toggle Button
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {theme === 'light' ? (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Mobile Menu Button
const MobileMenuButton = () => {
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <motion.button
      onClick={toggleSidebar}
      className="lg:hidden p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence mode="wait">
        {sidebarOpen ? (
          <motion.div
            key="x"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// Main Layout Component
const DashboardLayout = ({ children, userType = 'student' }) => {
  const { sidebarOpen, closeSidebar, sidebarCollapsed } = useSidebar();

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    closeSidebar();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleOverlayClick}
          />
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <MobileMenuButton />
              {children.props?.headerContent || (
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard</h2>
                  <p className="text-gray-600 dark:text-gray-400">Welcome back!</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <ThemeToggle />
              {children.props?.headerActions}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// Root Layout Export
export default function Layout({ children }) {
  return (
    <ThemeProvider>
      <SidebarProvider>
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </SidebarProvider>
    </ThemeProvider>
  );
}

// Export components for use in pages
export {
  ThemeProvider,
  SidebarProvider,
  EnhancedSidebar,
  ThemeToggle,
  MobileMenuButton,
  DashboardLayout
};