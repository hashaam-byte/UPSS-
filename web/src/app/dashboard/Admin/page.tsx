'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Shield,
  Menu,
  X,
  CheckCircle,
  AlertCircle,
  BarChart3,
  School,
  Activity,
  Eye,
  Edit,
  Users,
  UserPlus,
  Calendar,
  Download
} from 'lucide-react';
import EnhancedAdminSidebar from '@/components/sidebar/Admin'; // Adjust the import path as needed

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const admin = {
    name: "Mr. John Okwu",
    role: "School Administrator",
    avatar: "JO",
    school: "UPSS Benin"
  };

  const schoolStats = {
    totalStudents: 1247,
    totalTeachers: 48,
    activeClasses: 36,
    pendingApprovals: 12,
    monthlyGrowth: 8.5
  };

  const pendingApprovals = [
    {
      id: 1,
      type: "announcement",
      title: "Entrepreneurial Week 2025",
      teacher: "Mrs. Adebayo",
      timeAgo: "2 hours ago",
      priority: "high"
    },
    {
      id: 2,
      type: "teacher",
      title: "New Teacher Registration",
      name: "Dr. Emmanuel Ike",
      subject: "Biology",
      timeAgo: "5 hours ago",
      priority: "medium"
    },
    {
      id: 3,
      type: "event",
      title: "Inter-House Sports Competition",
      organizer: "Sports Department",
      timeAgo: "1 day ago",
      priority: "medium"
    }
  ];

  const recentActivities = [
    {
      action: "Student registered",
      details: "Grace Emeka joined SS2B",
      time: "10 minutes ago",
      type: "student"
    },
    {
      action: "Announcement approved",
      details: "Library Hours Extension",
      time: "1 hour ago",
      type: "announcement"
    },
    {
      action: "Timetable updated",
      details: "SS3 Mathematics schedule changed",
      time: "3 hours ago",
      type: "schedule"
    }
  ];

  const upcomingEvents = [
    {
      name: "Entrepreneurial Week",
      date: "March 15-22, 2025",
      status: "approved",
      participants: 850
    },
    {
      name: "Mid-Term Examinations",
      date: "March 25-30, 2025",
      status: "scheduled",
      participants: 1247
    },
    {
      name: "Sports Day",
      date: "April 5, 2025",
      status: "pending",
      participants: 650
    }
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex">
      {/* Enhanced Sidebar Component */}
      <EnhancedAdminSidebar admin={admin} />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
                <p className="text-gray-600">
                  Welcome, {admin.name.split(' ')[1]}. Manage the school system.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full text-white text-sm font-medium">
                <Shield className="w-4 h-4" />
                {admin.school}
              </div>
              {schoolStats.pendingApprovals > 0 && (
                <div className="relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {schoolStats.pendingApprovals}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <motion.div 
            className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl text-white shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Students</p>
                  <p className="text-3xl font-bold">{schoolStats.totalStudents}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-blue-100 text-sm">+{schoolStats.monthlyGrowth}% this month</span>
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl text-white shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-100 text-sm">Teachers</p>
                  <p className="text-3xl font-bold">{schoolStats.totalTeachers}</p>
                </div>
                <Users className="w-8 h-8 text-emerald-200" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-emerald-100 text-sm">All verified</span>
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl text-white shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Classes</p>
                  <p className="text-3xl font-bold">{schoolStats.activeClasses}</p>
                </div>
                <School className="w-8 h-8 text-purple-200" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-purple-100 text-sm">Running smoothly</span>
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Pending Approvals</p>
                  <p className="text-3xl font-bold">{schoolStats.pendingApprovals}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-orange-200" />
              </div>
              <div className="flex items-center gap-1 mt-2">
                <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-orange-100 text-sm">Needs attention</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Main Content Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Pending Approvals */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  <h4 className="font-semibold text-gray-800">Pending Approvals</h4>
                </div>
                <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                  View All ({schoolStats.pendingApprovals})
                </button>
              </div>
              
              <div className="space-y-4">
                {pendingApprovals.map((item) => (
                  <div 
                    key={item.id}
                    className={`p-4 rounded-xl border-l-4 ${
                      item.priority === 'high' 
                        ? 'bg-red-50 border-red-500' 
                        : 'bg-yellow-50 border-yellow-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h6 className="font-medium text-gray-800">{item.title}</h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.type === 'announcement' ? 'bg-blue-100 text-blue-600' :
                            item.type === 'teacher' ? 'bg-green-100 text-green-600' :
                            'bg-purple-100 text-purple-600'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {item.type === 'teacher' 
                            ? `${item.name} - ${item.subject}` 
                            : item.type === 'announcement'
                            ? `By ${item.teacher}`
                            : `By ${item.organizer}`
                          }
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{item.timeAgo}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Activities */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Recent Activities</h4>
              </div>
              
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'student' ? 'bg-blue-500' :
                      activity.type === 'announcement' ? 'bg-green-500' :
                      'bg-purple-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 text-sm">{activity.action}</p>
                      <p className="text-xs text-gray-600">{activity.details}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* User Management Quick Actions */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-emerald-600" />
                <h4 className="font-semibold text-gray-800">User Management</h4>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <UserPlus className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Add New Teacher</p>
                      <p className="text-xs text-gray-600">Register verified teachers</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Manage Students</p>
                      <p className="text-xs text-gray-600">View & edit student records</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Role Permissions</p>
                      <p className="text-xs text-gray-600">Configure access levels</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Timetable Manager */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-800">Timetable Manager</h4>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">SS3 Classes</p>
                      <p className="text-xs text-gray-600">12 subjects scheduled</p>
                    </div>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Edit className="w-4 h-4 text-indigo-600" />
                    </button>
                  </div>
                </div>
                
                <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">SS2 Classes</p>
                      <p className="text-xs text-gray-600">Needs review</p>
                    </div>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    </button>
                  </div>
                </div>
                
                <button className="w-full py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all duration-200">
                  Manage All Timetables
                </button>
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Upcoming Events</h4>
                </div>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  Manage
                </button>
              </div>
              
              <div className="space-y-3">
                {upcomingEvents.map((event, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h6 className="font-medium text-gray-800 text-sm">{event.name}</h6>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            event.status === 'approved' ? 'bg-green-100 text-green-600' :
                            event.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{event.date}</p>
                        <p className="text-xs text-gray-500">{event.participants} participants</p>
                      </div>
                      <button className="p-1 hover:bg-gray-200 rounded">
                        <Eye className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* School Overview Analytics */}
            <motion.div 
              className="lg:col-span-2 bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  <h4 className="font-semibold">School Performance Overview</h4>
                </div>
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-lg hover:bg-white/30 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">92%</p>
                  <p className="text-sm text-blue-100">Attendance Rate</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">85%</p>
                  <p className="text-sm text-blue-100">Assignment Completion</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">78%</p>
                  <p className="text-sm text-blue-100">Average Score</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">96%</p>
                  <p className="text-sm text-blue-100">Parent Satisfaction</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Progress</span>
                  <span>+8.5%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full" style={{ width: '85%' }} />
                </div>
              </div>
              
              <div className="mt-4 flex gap-3">
                <button className="flex-1 py-2 bg-white/20 backdrop-blur-md rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                  View Detailed Analytics
                </button>
                <button className="flex-1 py-2 bg-white/20 backdrop-blur-md rounded-lg font-medium hover:bg-white/30 transition-all duration-200">
                  Export Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;