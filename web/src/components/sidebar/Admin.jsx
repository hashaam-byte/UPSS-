'use client'
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap,
  BarChart3,
  Users,
  Bell,
  Calendar,
  Activity,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSidebar, useTheme } from '@/app/dashboard/layout/page';

const EnhancedAdminSidebar = ({ admin }) => {
  const { sidebarOpen, sidebarCollapsed, toggleCollapse } = useSidebar();
  const { theme } = useTheme();

  const sidebarItems = [
    { icon: BarChart3, label: "Overview", active: true },
    { icon: Users, label: "Manage Users", active: false },
    { icon: Bell, label: "Approvals", active: false },
    { icon: Calendar, label: "Timetables", active: false },
    { icon: Activity, label: "Events", active: false },
    { icon: FileText, label: "Reports", active: false }
  ];

  const sidebarVariants = {
    expanded: { width: 256 },
    collapsed: { width: 80 }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div 
        className="fixed inset-y-0 left-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 dark:border-gray-700 hidden lg:block"
        variants={sidebarVariants}
        animate={sidebarCollapsed ? "collapsed" : "expanded"}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        {/* Logo Section */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <motion.div 
            className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <GraduationCap className="w-6 h-6 text-white" />
          </motion.div>
          
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                  UPSS Plus
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapse Toggle - Desktop Only */}
          <motion.button
            onClick={toggleCollapse}
            className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </motion.button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {sidebarItems.map((item, index) => (
            <motion.button
              key={item.label}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group ${
                item.active 
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
              }`}
              whileHover={{ scale: 1.02, x: 4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.span 
                    className="font-medium"
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {/* Tooltip for collapsed state */}
              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 dark:bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </motion.button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <motion.div 
              className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              whileHover={{ scale: 1.1 }}
            >
              {admin.avatar}
            </motion.div>
            
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  className="flex-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{admin.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{admin.role}</p>
                </motion.div>
              )}
            </AnimatePresence>
            
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div 
                  className="flex flex-col gap-1"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.button 
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                  <motion.button 
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
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
            {/* Mobile Logo Section */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                  UPSS Plus
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
              </div>
            </div>

            {/* Mobile Navigation */}
            <nav className="p-4 space-y-2 flex-1">
              {sidebarItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg' 
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </motion.button>
              ))}
            </nav>

            {/* Mobile User Profile */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-900/20 dark:to-purple-900/20">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {admin.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{admin.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{admin.role}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                    <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedAdminSidebar;