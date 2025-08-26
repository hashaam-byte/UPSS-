'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Crown,
  Users, 
  TrendingUp,
  Award,
  Building,
  Menu,
  X,
  Plus,
  Eye,
  CheckCircle,
  AlertTriangle,
  Star,
  UserCheck,
  Calendar,
  Clock
} from 'lucide-react';
import HeadAdminSidebar from '@/components/sidebar/headAdmin';

const HeadAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const headAdmin = {
    name: "Hash cody",
    title: "Head Administrator",
    avatar: "HC",
    permissions: "Full System Access"
  };

  const systemStats = {
    totalSchools: 12,
    activeStudents: 3420,
    activeTeachers: 284,
    premiumSubscribers: 856,
    monthlyRevenue: 125000,
    systemUptime: "99.9%"
  };

  const premiumStats = [
    { school: "Unity High School", students: 450, revenue: 15000, status: "active" },
    { school: "Excellence Academy", students: 320, revenue: 12500, status: "active" },
    { school: "Future Leaders College", students: 180, revenue: 8500, status: "pending" },
    { school: "Progressive School", students: 220, revenue: 9800, status: "active" }
  ];

  const recentActivities = [
    {
      type: "school_added",
      description: "New school 'Bright Future Academy' added to system",
      time: "2 hours ago",
      status: "success"
    },
    {
      type: "premium_upgrade",
      description: "Unity High School upgraded to Premium Guild package",
      time: "5 hours ago",
      status: "success"
    },
    {
      type: "payment_received",
      description: "Payment of ₦15,000 received from Excellence Academy",
      time: "1 day ago",
      status: "success"
    },
    {
      type: "system_alert",
      description: "Server maintenance scheduled for this weekend",
      time: "2 days ago",
      status: "warning"
    }
  ];

  const guildSettings = {
    isActive: true,
    totalMembers: 856,
    monthlyGrowth: 12.5,
    features: [
      "Advanced Study Materials",
      "Exclusive Webinars", 
      "Priority Support",
      "Analytics Dashboard"
    ]
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-yellow-50">
      {/* Sidebar */}
      <HeadAdminSidebar sidebarOpen={sidebarOpen} headAdmin={headAdmin} />

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
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                  <Crown className="w-6 h-6 text-yellow-500" />
                  Head Admin Dashboard
                </h2>
                <p className="text-gray-600">
                  Welcome, {headAdmin.name}. You control UPSS Hub.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">System Status</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {systemStats.systemUptime} Uptime
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Executive Summary Cards */}
          <motion.div 
            className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.div 
              className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Total Schools</p>
                  <p className="text-3xl font-bold">{systemStats.totalSchools}</p>
                  <p className="text-sm text-blue-100 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" />
                    +2 this month
                  </p>
                </div>
                <Building className="w-8 h-8 text-blue-200" />
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-100">Active Users</p>
                  <p className="text-3xl font-bold">{(systemStats.activeStudents + systemStats.activeTeachers).toLocaleString()}</p>
                  <p className="text-sm text-emerald-100 flex items-center gap-1 mt-2">
                    <Users className="w-4 h-4" />
                    {systemStats.activeStudents.toLocaleString()} Students
                  </p>
                </div>
                <Users className="w-8 h-8 text-emerald-200" />
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-100">Premium Members</p>
                  <p className="text-3xl font-bold">{systemStats.premiumSubscribers.toLocaleString()}</p>
                  <p className="text-sm text-yellow-100 flex items-center gap-1 mt-2">
                    <Star className="w-4 h-4" />
                    Guild of Scholars
                  </p>
                </div>
                <Award className="w-8 h-8 text-yellow-200" />
              </div>
            </motion.div>

            <motion.div 
              className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Monthly Revenue</p>
                  <p className="text-3xl font-bold">₦{(systemStats.monthlyRevenue / 1000).toFixed(0)}K</p>
                  <p className="text-sm text-purple-100 flex items-center gap-1 mt-2">
                    <TrendingUp className="w-4 h-4" />
                    +18% growth
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-200" />
              </div>
            </motion.div>
          </motion.div>

          {/* Main Dashboard Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Premium School Performance */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Premium School Performance</h4>
                </div>
                <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:shadow-lg transition-all duration-200">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add School
                </button>
              </div>
              
              <div className="space-y-4">
                {premiumStats.map((school, index) => (
                  <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <Building className="w-5 h-5 text-gray-600" />
                          <div>
                            <h6 className="font-semibold text-gray-800">{school.school}</h6>
                            <p className="text-sm text-gray-600">{school.students} students</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₦{school.revenue.toLocaleString()}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            school.status === 'active' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {school.status}
                          </span>
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Eye className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Guild of Scholars Control */}
            <motion.div 
              className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6" />
                <h4 className="font-semibold">Guild of Scholars</h4>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-yellow-100">Total Members</p>
                  <p className="text-2xl font-bold">{guildSettings.totalMembers}</p>
                </div>
                
                <div>
                  <p className="text-sm text-yellow-100">Monthly Growth</p>
                  <p className="text-lg font-bold">+{guildSettings.monthlyGrowth}%</p>
                </div>
                
                <div className="pt-4 border-t border-white/20">
                  <p className="text-sm text-yellow-100 mb-2">Premium Features:</p>
                  <div className="space-y-1">
                    {guildSettings.features.map((feature, index) => (
                      <p key={index} className="text-xs text-yellow-50 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        {feature}
                      </p>
                    ))}
                  </div>
                </div>
                
                <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl font-medium hover:bg-white/30 transition-all duration-200 flex items-center justify-center gap-2">
                  Manage Settings
                </button>
              </div>
            </motion.div>

            {/* Recent System Activities */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-800">Recent System Activities</h4>
              </div>
              
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.status === 'success' ? 'bg-green-100' :
                      activity.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
                    }`}>
                      {activity.status === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : activity.status === 'warning' ? (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      ) : (
                        <X className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick System Controls */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <UserCheck className="w-5 h-5 text-gray-600" />
                <h4 className="font-semibold text-gray-800">Quick Controls</h4>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">System Backup</p>
                      <p className="text-xs text-gray-600">Last backup: 2 hours ago</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">User Permissions</p>
                      <p className="text-xs text-gray-600">Manage access levels</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 text-left bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Analytics Export</p>
                      <p className="text-xs text-gray-600">Generate reports</p>
                    </div>
                  </div>
                </button>

                <button className="w-full p-3 text-left bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Maintenance Mode</p>
                      <p className="text-xs text-gray-600">Schedule downtime</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Financial Overview */}
            <motion.div 
              className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-gray-800">Financial Dashboard</h4>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 bg-green-100 text-green-700 rounded-xl text-sm font-medium hover:bg-green-200 transition-all duration-200">
                    Export Report
                  </button>
                  <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-200 transition-all duration-200">
                    View Details
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <p className="text-sm font-medium text-gray-700">Total Revenue</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">₦{systemStats.monthlyRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">+18% from last month</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    <p className="text-sm font-medium text-gray-700">Premium Users</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">{systemStats.premiumSubscribers}</p>
                  <p className="text-xs text-blue-600 mt-1">+12.5% growth</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4 text-purple-600" />
                    <p className="text-sm font-medium text-gray-700">Avg Revenue/User</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-600">₦{Math.round(systemStats.monthlyRevenue / systemStats.premiumSubscribers)}</p>
                  <p className="text-xs text-purple-600 mt-1">+5% improvement</p>
                </div>

                <div className="p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Crown className="w-4 h-4 text-orange-600" />
                    <p className="text-sm font-medium text-gray-700">Active Schools</p>
                  </div>
                  <p className="text-2xl font-bold text-orange-600">{systemStats.totalSchools}</p>
                  <p className="text-xs text-orange-600 mt-1">2 new this month</p>
                </div>
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

export default HeadAdminDashboard;