'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  BookOpen, 
  FileText,
  Star,
  Clock,
  Menu,
  X,
  ChevronRight,
  Download
} from 'lucide-react';
import StudentSidebar from '@/components/sidebar/student';

const StudentDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const student = {
    name: "Alex Johnson",
    class: "SS3 Science",
    avatar: "AJ",
    isPremium: true
  };

  const announcements = [
    {
      id: 1,
      title: "Entrepreneurial Week 2025",
      content: "Join us for the annual Entrepreneurial Week starting Monday...",
      time: "2 hours ago",
      priority: "high"
    },
    {
      id: 2,
      title: "Library Hours Extended",
      content: "Library will be open until 8 PM during exam period...",
      time: "5 hours ago",
      priority: "normal"
    },
    {
      id: 3,
      title: "Sports Day Registration",
      content: "Register for Sports Day events before Friday...",
      time: "1 day ago",
      priority: "normal"
    }
  ];

  const todayClasses = [
    {
      subject: "Mathematics",
      time: "8:00 - 9:00 AM",
      teacher: "Mr. Okafor",
      room: "Room 12A",
      status: "upcoming"
    },
    {
      subject: "Physics",
      time: "9:15 - 10:15 AM", 
      teacher: "Mrs. Adebayo",
      room: "Lab 2",
      status: "current"
    },
    {
      subject: "Chemistry",
      time: "10:30 - 11:30 AM",
      teacher: "Dr. Emeka",
      room: "Lab 1",
      status: "upcoming"
    },
    {
      subject: "English Language",
      time: "12:00 - 1:00 PM",
      teacher: "Ms. Olumide",
      room: "Room 8B",
      status: "upcoming"
    }
  ];

  const assignments = [
    {
      subject: "Mathematics",
      title: "Calculus Problem Set 5",
      dueDate: "Tomorrow",
      status: "pending",
      priority: "high"
    },
    {
      subject: "Physics",
      title: "Wave Motion Lab Report",
      dueDate: "3 days",
      status: "in-progress",
      priority: "medium"
    },
    {
      subject: "Chemistry",
      title: "Organic Chemistry Notes",
      dueDate: "1 week",
      status: "not-started",
      priority: "low"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <StudentSidebar sidebarOpen={sidebarOpen} student={student} />

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
                <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
                <p className="text-gray-600">
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            
            {student.isPremium && (
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white text-sm font-medium">
                <Star className="w-4 h-4" />
                Premium Member
              </div>
            )}
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Welcome Banner */}
          <motion.div 
            className="mb-8 p-6 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-2xl text-white"
            {...fadeInUp}
          >
            <h3 className="text-2xl font-bold mb-2">Hi {student.name}! 👋</h3>
            <p className="text-emerald-100">Here's what's happening in your academic journey today.</p>
            <div className="mt-4 text-sm text-emerald-100">
              Current time: {currentTime.toLocaleTimeString()}
            </div>
          </motion.div>

          {/* Dashboard Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Announcements Card */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-gray-800">Latest Announcements</h4>
                </div>
                <button className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {announcements.map((announcement) => (
                  <div 
                    key={announcement.id}
                    className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium text-gray-800">{announcement.title}</h5>
                          {announcement.priority === 'high' && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                              High Priority
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{announcement.content}</p>
                        <p className="text-gray-400 text-xs mt-2">{announcement.time}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Today's Classes */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h4 className="font-semibold text-gray-800">Today's Timetable</h4>
              </div>
              
              <div className="space-y-3">
                {todayClasses.map((class_, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-xl border-l-4 ${
                      class_.status === 'current' 
                        ? 'bg-emerald-50 border-emerald-500' 
                        : 'bg-gray-50 border-gray-300'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h6 className="font-medium text-gray-800">{class_.subject}</h6>
                        <p className="text-sm text-gray-600">{class_.teacher}</p>
                        <p className="text-xs text-gray-500">{class_.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{class_.time}</p>
                        {class_.status === 'current' && (
                          <span className="text-xs text-emerald-600 font-medium">Now</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Assignments Due */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-800">Assignments Due</h4>
              </div>
              
              <div className="space-y-3">
                {assignments.map((assignment, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-800 text-sm">{assignment.title}</h6>
                        <p className="text-xs text-gray-600">{assignment.subject}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-xs text-gray-500">Due in {assignment.dueDate}</span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        assignment.priority === 'high' ? 'bg-red-100 text-red-600' :
                        assignment.priority === 'medium' ? 'bg-yellow-100 text-yellow-600' :
                        'bg-green-100 text-green-600'
                      }`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Study Resources */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-800">Quick Resources</h4>
              </div>
              
              <div className="space-y-3">
                <button className="w-full p-3 text-left bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Mathematics Notes</p>
                      <p className="text-xs text-gray-600">Calculus & Algebra</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Physics Lab Manual</p>
                      <p className="text-xs text-gray-600">Experiments & Procedures</p>
                    </div>
                  </div>
                </button>
                
                <button className="w-full p-3 text-left bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <Download className="w-4 h-4 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">Chemistry Formulas</p>
                      <p className="text-xs text-gray-600">Quick Reference Guide</p>
                    </div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Premium Guild Access */}
            {student.isPremium && (
              <motion.div 
                className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl shadow-lg p-6 text-white"
                variants={fadeInUp}
              >
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5" />
                  <h4 className="font-semibold">Guild of Scholars</h4>
                </div>
                
                <p className="text-sm text-yellow-100 mb-4">
                  Exclusive premium content and advanced study materials await you!
                </p>
                
                <button className="w-full py-3 bg-white/20 backdrop-blur-md rounded-xl font-medium hover:bg-white/30 transition-all duration-200">
                  Access Premium Content
                </button>
              </motion.div>
            )}
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

export default StudentDashboard;