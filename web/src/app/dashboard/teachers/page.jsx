'use client'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Calendar, 
  FileText,
  Users,
  Clock,
  Menu,
  X,
  Upload,
  Send,
  BarChart3,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import TeacherSidebar from '@/components/sidebar/teacher';

const TeacherDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const teacher = {
    name: "Mrs. Sarah Adebayo",
    subject: "Mathematics",
    avatar: "SA",
    classes: ["SS1A", "SS2B", "SS3C"]
  };

  const recentSubmissions = [
    {
      student: "David Okonkwo",
      assignment: "Quadratic Equations",
      class: "SS2B",
      submittedAt: "2 hours ago",
      status: "pending"
    },
    {
      student: "Grace Emeka",
      assignment: "Calculus Problem Set",
      class: "SS3C",
      submittedAt: "4 hours ago",
      status: "graded"
    },
    {
      student: "John Adamu",
      assignment: "Algebra Worksheet",
      class: "SS1A",
      submittedAt: "1 day ago",
      status: "pending"
    }
  ];

  const todayClasses = [
    {
      class: "SS1A Mathematics",
      time: "8:00 - 9:00 AM",
      topic: "Linear Equations",
      room: "Room 12A",
      status: "completed"
    },
    {
      class: "SS2B Mathematics",
      time: "10:30 - 11:30 AM",
      topic: "Quadratic Functions",
      room: "Room 12A",
      status: "current"
    },
    {
      class: "SS3C Mathematics",
      time: "2:00 - 3:00 PM",
      topic: "Calculus Review",
      room: "Room 12A",
      status: "upcoming"
    }
  ];

  const classPerformance = [
    { class: "SS1A", students: 28, avgScore: 78, submissions: 25 },
    { class: "SS2B", students: 32, avgScore: 82, submissions: 30 },
    { class: "SS3C", students: 24, avgScore: 85, submissions: 22 }
  ];

  const handlePostAnnouncement = () => {
    if (announcementText.trim()) {
      // Here you would send to backend
      alert('Announcement posted successfully!');
      setAnnouncementText('');
      setShowAnnouncementForm(false);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Sidebar */}
      <TeacherSidebar sidebarOpen={sidebarOpen} teacher={teacher} />

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
                <h2 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h2>
                <p className="text-gray-600">
                  Good day, {teacher.name.split(' ')[1]}! Manage your classes here.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full text-white text-sm font-medium">
              <Users className="w-4 h-4" />
              {teacher.classes.length} Classes
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="p-6">
          {/* Quick Actions */}
          <motion.div 
            className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            <motion.button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Post Announcement</p>
                  <p className="text-sm text-blue-100">Share updates with students</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              className="p-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <Upload className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">Upload Assignment</p>
                  <p className="text-sm text-emerald-100">Create new assignment</p>
                </div>
              </div>
            </motion.button>

            <motion.button
              className="p-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-2xl hover:shadow-lg transition-all duration-200"
              variants={fadeInUp}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold">View Analytics</p>
                  <p className="text-sm text-purple-100">Track student progress</p>
                </div>
              </div>
            </motion.button>
          </motion.div>

          {/* Announcement Form */}
          {showAnnouncementForm && (
            <motion.div 
              className="mb-6 p-6 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              <h4 className="font-semibold text-gray-800 mb-4">Post New Announcement</h4>
              <textarea
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="What would you like to announce to your students?"
                className="w-full p-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                rows="4"
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => setShowAnnouncementForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handlePostAnnouncement}
                  className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Post Announcement
                </button>
              </div>
            </motion.div>
          )}

          {/* Dashboard Grid */}
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
            variants={staggerChildren}
            initial="initial"
            animate="animate"
          >
            {/* Today's Classes */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-semibold text-gray-800">Today's Classes</h4>
                </div>
                <p className="text-sm text-gray-500">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </div>
              
              <div className="space-y-4">
                {todayClasses.map((class_, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-xl border-l-4 ${
                      class_.status === 'current' ? 'bg-emerald-50 border-emerald-500' :
                      class_.status === 'completed' ? 'bg-gray-50 border-gray-400' :
                      'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-800">{class_.class}</h6>
                        <p className="text-sm text-gray-600 mt-1">Topic: {class_.topic}</p>
                        <p className="text-xs text-gray-500">{class_.room}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-700">{class_.time}</p>
                        <span className={`text-xs font-medium ${
                          class_.status === 'current' ? 'text-emerald-600' :
                          class_.status === 'completed' ? 'text-gray-500' :
                          'text-blue-600'
                        }`}>
                          {class_.status === 'current' ? 'In Progress' :
                           class_.status === 'completed' ? 'Completed' : 'Upcoming'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recent Submissions */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  <h4 className="font-semibold text-gray-800">Recent Submissions</h4>
                </div>
                <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                  View All
                </button>
              </div>
              
              <div className="space-y-3">
                {recentSubmissions.map((submission, index) => (
                  <div key={index} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h6 className="font-medium text-gray-800 text-sm">{submission.student}</h6>
                        <p className="text-xs text-gray-600">{submission.assignment}</p>
                        <p className="text-xs text-gray-500">{submission.class} • {submission.submittedAt}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {submission.status === 'pending' ? (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <button className="p-1 hover:bg-gray-200 rounded">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Class Performance */}
            <motion.div 
              className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                <h4 className="font-semibold text-gray-800">Class Performance Overview</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classPerformance.map((classData, index) => (
                  <div key={index} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl">
                    <h6 className="font-semibold text-gray-800 mb-3">{classData.class}</h6>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Students:</span>
                        <span className="font-medium">{classData.students}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Avg Score:</span>
                        <span className="font-medium text-emerald-600">{classData.avgScore}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Submissions:</span>
                        <span className="font-medium">{classData.submissions}/{classData.students}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full"
                          style={{ width: `${(classData.submissions / classData.students) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Quick Stats */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6"
              variants={fadeInUp}
            >
              <h4 className="font-semibold text-gray-800 mb-4">Quick Stats</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Graded</p>
                      <p className="text-xs text-gray-600">This week</p>
                    </div>
                  </div>
                  <span className="font-bold text-emerald-600">24</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Pending</p>
                      <p className="text-xs text-gray-600">To review</p>
                    </div>
                  </div>
                  <span className="font-bold text-orange-600">8</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Total Students</p>
                      <p className="text-xs text-gray-600">All classes</p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-600">84</span>
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

export default TeacherDashboard;