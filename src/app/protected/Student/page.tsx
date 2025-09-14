'use client'
import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, Calendar, BarChart3, FolderOpen, 
  MessageCircle, Mic, User, Search, Bell, Menu,
  Clock, AlertCircle, TrendingUp, Download, Send,
  Video, Play, Settings, Upload, Filter, Star
} from 'lucide-react';

const StudentPortal = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for auth token
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/auth';
          return;
        }

        // Fetch user data from database - replace with actual API call
        const userData = {
          id: '1',
          firstName: 'Alex',
          lastName: 'Johnson',
          email: 'alex.johnson@student.com',
          role: 'student',
          avatar: 'AJ',
          studentProfile: {
            studentId: 'STU2024001',
            className: 'SS2A',
            section: 'Science',
            admissionDate: '2023-09-15',
            parentName: 'Mr. Johnson',
            parentPhone: '+234-801-234-5678'
          },
          school: {
            name: 'Excellence High School',
            logo: null
          },
          isPremium: true // Based on school's subscription status
        };

        setUser(userData);
        setLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/auth';
      }
    };

    checkAuth();
  }, []);

  // Mock data for demonstration - replace with API calls
  const todaySchedule = [
    { time: "8:00 AM", subject: "Mathematics", teacher: "Mr. Adebayo", status: "current" },
    { time: "9:00 AM", subject: "Physics", teacher: "Mrs. Okafor", status: "next" },
    { time: "10:00 AM", subject: "Chemistry", teacher: "Dr. Ibrahim", status: "upcoming" },
  ];

  const assignments = [
    { id: 1, title: "Quadratic Equations", subject: "Mathematics", teacher: "Mr. Adebayo", due: "Today", status: "pending", priority: "high" },
    { id: 2, title: "Photosynthesis Essay", subject: "Biology", teacher: "Mrs. Ogun", due: "Tomorrow", status: "submitted", priority: "medium" },
    { id: 3, title: "Nigerian History", subject: "History", teacher: "Mr. Bello", due: "3 days", status: "graded", grade: "85%", priority: "low" },
  ];

  const results = [
    { subject: "Mathematics", test: 78, exam: 82, total: 80, grade: "B" },
    { subject: "Physics", test: 85, exam: 88, total: 86.5, grade: "A" },
    { subject: "Chemistry", test: 72, exam: 75, total: 73.5, grade: "B" },
  ];

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/student/dashboard' },
    { id: 'assignments', icon: BookOpen, label: 'Assignments', path: '/student/assignments' },
    { id: 'timetable', icon: Calendar, label: 'Timetable', path: '/student/timetable' },
    { id: 'results', icon: BarChart3, label: 'Results', path: '/student/results' },
    { id: 'resources', icon: FolderOpen, label: 'Resources', path: '/student/resources' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/student/messages' },
    { id: 'guild', icon: Mic, label: 'Guild of Scholars', path: '/student/guild', premium: true },
    { id: 'profile', icon: User, label: 'Profile', path: '/student/profile' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            {user.studentProfile.className} • {user.studentProfile.section} • {user.school.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {user.isPremium && (
            <div className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white text-sm font-medium">
              ⭐ Premium Student
            </div>
          )}
          <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {user.studentProfile.studentId}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-lg">Today's Schedule</h2>
          </div>
          <div className="space-y-3">
            {todaySchedule.map((item, index) => (
              <div key={index} className={`p-3 rounded-lg border-l-4 ${
                item.status === 'current' ? 'bg-green-50 border-green-400' :
                item.status === 'next' ? 'bg-blue-50 border-blue-400' :
                'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{item.subject}</p>
                    <p className="text-sm text-gray-600">{item.teacher}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.time}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.status === 'current' ? 'bg-green-200 text-green-800' :
                      item.status === 'next' ? 'bg-blue-200 text-blue-800' :
                      'bg-gray-200 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold">Assignments Due</h3>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {assignments.filter(a => a.status === 'pending').length}
            </p>
            <p className="text-sm text-gray-600">This week</p>
          </div>

          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Average Grade</h3>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {Math.round(results.reduce((acc, r) => acc + r.total, 0) / results.length)}%
            </p>
            <p className="text-sm text-gray-600">This term</p>
          </div>
        </div>

        {/* Recent Assignments */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-lg">Recent Assignments</h2>
            <button 
              onClick={() => setCurrentPage('assignments')}
              className="text-blue-600 text-sm hover:underline"
            >
              View all
            </button>
          </div>
          <div className="space-y-3">
            {assignments.slice(0, 3).map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{assignment.title}</p>
                  <p className="text-sm text-gray-600">{assignment.subject} • {assignment.teacher}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    assignment.status === 'pending' ? 'bg-red-100 text-red-700' :
                    assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {assignment.status}
                  </span>
                  <span className="text-sm text-gray-500">Due: {assignment.due}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Guild Quick Access */}
        {user.isPremium && (
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5" />
              <h2 className="font-semibold text-lg">Guild of Scholars</h2>
            </div>
            <p className="text-sm mb-4 text-purple-100">Next session: Advanced Physics</p>
            <button className="w-full bg-white/20 backdrop-blur-md rounded-lg py-2 px-4 text-sm font-medium hover:bg-white/30 transition-all">
              Join Session
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">All</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Pending</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Submitted</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Graded</button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{assignment.title}</h3>
                  <p className="text-gray-600">{assignment.subject} • {assignment.teacher}</p>
                  <p className="text-sm text-gray-500 mt-1">Due: {assignment.due}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    assignment.status === 'pending' ? 'bg-red-100 text-red-700' :
                    assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {assignment.status}
                  </span>
                  {assignment.status === 'graded' && (
                    <span className="font-bold text-green-600">{assignment.grade}</span>
                  )}
                  {assignment.status === 'pending' && (
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <Upload className="w-4 h-4 mr-2 inline" />
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderResults = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Academic Results</h1>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <h2 className="font-semibold text-lg mb-4">Current Term Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3">Subject</th>
                <th className="text-left p-3">Test</th>
                <th className="text-left p-3">Exam</th>
                <th className="text-left p-3">Total</th>
                <th className="text-left p-3">Grade</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{result.subject}</td>
                  <td className="p-3">{result.test}%</td>
                  <td className="p-3">{result.exam}%</td>
                  <td className="p-3 font-semibold">{result.total}%</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      result.grade === 'A' ? 'bg-green-100 text-green-700' :
                      result.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {result.grade}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Student Profile</h1>
      
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center gap-6 mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {user.avatar}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
            <p className="text-gray-600">{user.studentProfile.className} • {user.studentProfile.section}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="text-sm text-gray-500">Student ID: {user.studentProfile.studentId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Academic Information</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">School</p>
                <p className="font-semibold">{user.school.name}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Class & Section</p>
                <p className="font-semibold">{user.studentProfile.className} - {user.studentProfile.section}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Admission Date</p>
                <p className="font-semibold">{new Date(user.studentProfile.admissionDate).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Parent Information</h3>
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Parent Name</p>
                <p className="font-semibold">{user.studentProfile.parentName}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Parent Phone</p>
                <p className="font-semibold">{user.studentProfile.parentPhone}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Subscription Status</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    user.isPremium ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {user.isPremium ? 'Premium Active' : 'Basic'}
                  </span>
                  {user.isPremium && <Star className="w-4 h-4 text-yellow-500" />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'assignments': return renderAssignments();
      case 'results': return renderResults();
      case 'profile': return renderProfile();
      case 'timetable': return (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Timetable</h2>
          <p className="text-gray-500">Weekly schedule view coming soon...</p>
        </div>
      );
      case 'resources': return (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Resources</h2>
          <p className="text-gray-500">Study materials and resources...</p>
        </div>
      );
      case 'messages': return (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Messages</h2>
          <p className="text-gray-500">Chat with teachers and classmates...</p>
        </div>
      );
      case 'guild': return (
        <div className="text-center py-12">
          {!user.isPremium ? (
            <>
              <Mic className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600">Guild of Scholars</h2>
              <p className="text-gray-500 mb-4">Premium feature - Upgrade to access collaborative sessions</p>
              <button className="px-6 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg">
                ⭐ Upgrade to Premium
              </button>
            </>
          ) : (
            <>
              <Mic className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h2 className="text-xl font-semibold text-gray-600">Guild of Scholars</h2>
              <p className="text-gray-500">Premium collaborative sessions...</p>
            </>
          )}
        </div>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Navbar */}
      <nav className="bg-white/70 backdrop-blur-md border-b border-white/20 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                U+
              </div>
              <span className="font-bold text-xl">U Plus Hub</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search assignments, resources..."
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:border-blue-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.avatar}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-600">{user.studentProfile.className}</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white/70 backdrop-blur-md border-r border-white/20 transition-all duration-300 ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        } min-h-screen`}>
          <div className="p-4 space-y-2">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const isPremiumItem = item.premium && !user.isPremium;
              
              return (
                <button
                  key={item.id}
                  onClick={() => !isPremiumItem && setCurrentPage(item.id)}
                  disabled={isPremiumItem}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg' 
                      : isPremiumItem
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && (
                    <span className={`font-medium ${isPremiumItem ? 'line-through' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {!sidebarCollapsed && item.premium && !user.isPremium && (
                    <Star className="w-4 h-4 text-yellow-500" />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default StudentPortal;