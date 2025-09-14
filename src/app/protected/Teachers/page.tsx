import React, { useState, useEffect } from 'react';
import { 
  Home, BookOpen, FileText, BarChart3, MessageCircle, 
  FolderOpen, TrendingUp, User, Search, Bell, Menu,
  Plus, Clock, AlertCircle, Users, Award, Upload,
  Edit, Trash2, Eye, Download, Filter, Star,
  GraduationCap, Calendar, Target, CheckCircle
} from 'lucide-react';

const TeacherPortal = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Simulating auth check - replace with actual API call
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/auth';
          return;
        }

        // Mock user data - replace with actual API call
        const userData = {
          id: '1',
          firstName: 'Sarah',
          lastName: 'Adebayo',
          email: 'sarah.adebayo@school.com',
          role: 'teacher',
          avatar: 'SA',
          teacherProfile: {
            employeeId: 'TCH001',
            department: 'Science',
            subjects: ['Mathematics', 'Physics'],
            qualification: 'B.Sc Mathematics, M.Ed',
            experienceYears: 8
          }
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

  // Mock data for demonstration
  const teacherData = {
    pendingGrading: 12,
    totalStudents: 89,
    assignmentsCreated: 24,
    averageClassPerformance: 78.5,
    notifications: 5
  };

  const todayClasses = [
    { time: "8:00 AM", subject: "Mathematics", class: "SS2A", room: "Room 201", status: "current" },
    { time: "10:00 AM", subject: "Physics", class: "SS1B", room: "Lab 1", status: "next" },
    { time: "2:00 PM", subject: "Mathematics", class: "SS2B", room: "Room 201", status: "upcoming" },
  ];

  const recentAssignments = [
    { id: 1, title: "Quadratic Equations", subject: "Mathematics", class: "SS2A", submissions: 23, total: 30, created: "2 days ago" },
    { id: 2, title: "Laws of Motion", subject: "Physics", class: "SS1B", submissions: 18, total: 25, created: "3 days ago" },
    { id: 3, title: "Algebra Basics", subject: "Mathematics", class: "SS1A", submissions: 28, total: 28, created: "1 week ago" },
  ];

  const weakStudents = [
    { name: "John Okafor", class: "SS2A", subject: "Mathematics", average: 45, trend: "declining" },
    { name: "Mary Ibrahim", class: "SS1B", subject: "Physics", average: 52, trend: "stable" },
    { name: "David Adamu", class: "SS2A", subject: "Mathematics", average: 38, trend: "improving" },
  ];

  const submissions = [
    { 
      id: 1, 
      student: "Alice Johnson", 
      assignment: "Quadratic Equations", 
      subject: "Mathematics",
      submittedAt: "2 hours ago", 
      status: "pending",
      late: false
    },
    { 
      id: 2, 
      student: "Bob Smith", 
      assignment: "Laws of Motion", 
      subject: "Physics",
      submittedAt: "1 day ago", 
      status: "graded",
      grade: 85,
      late: true
    },
    { 
      id: 3, 
      student: "Carol Williams", 
      assignment: "Quadratic Equations", 
      subject: "Mathematics",
      submittedAt: "3 hours ago", 
      status: "pending",
      late: false
    },
  ];

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/teacher/dashboard' },
    { id: 'assignments', icon: BookOpen, label: 'Assignments', path: '/teacher/assignments' },
    { id: 'submissions', icon: FileText, label: 'Submissions', path: '/teacher/submissions' },
    { id: 'results', icon: BarChart3, label: 'Results', path: '/teacher/results' },
    { id: 'messages', icon: MessageCircle, label: 'Messages', path: '/teacher/messages' },
    { id: 'resources', icon: FolderOpen, label: 'Resources', path: '/teacher/resources' },
    { id: 'analytics', icon: TrendingUp, label: 'Analytics', path: '/teacher/analytics' },
    { id: 'profile', icon: User, label: 'Profile', path: '/teacher/profile' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
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
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Welcome back, {user.firstName}! 📚
          </h1>
          <p className="text-gray-600 mt-1">
            {user.teacherProfile.subjects.join(' & ')} Teacher • {user.teacherProfile.experienceYears} years experience
          </p>
        </div>
        <div className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full text-white text-sm font-medium">
          {user.teacherProfile.employeeId}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Grading</p>
              <p className="text-2xl font-bold text-orange-600">{teacherData.pendingGrading}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Students</p>
              <p className="text-2xl font-bold text-blue-600">{teacherData.totalStudents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Assignments Created</p>
              <p className="text-2xl font-bold text-green-600">{teacherData.assignmentsCreated}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Class Average</p>
              <p className="text-2xl font-bold text-purple-600">{teacherData.averageClassPerformance}%</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-lg">Today's Classes</h2>
          </div>
          <div className="space-y-3">
            {todayClasses.map((item, index) => (
              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                item.status === 'current' ? 'bg-green-50 border-green-400' :
                item.status === 'next' ? 'bg-blue-50 border-blue-400' :
                'bg-gray-50 border-gray-300'
              }`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-800">{item.subject}</p>
                    <p className="text-sm text-gray-600">{item.class} • {item.room}</p>
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

        {/* Weak Students Alert */}
        <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-red-600" />
            <h2 className="font-semibold text-lg">Students Needing Attention</h2>
          </div>
          <div className="space-y-3">
            {weakStudents.map((student, index) => (
              <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-xs text-gray-600">{student.class} • {student.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-red-600">{student.average}%</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      student.trend === 'declining' ? 'bg-red-200 text-red-800' :
                      student.trend === 'improving' ? 'bg-green-200 text-green-800' :
                      'bg-yellow-200 text-yellow-800'
                    }`}>
                      {student.trend}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Assignments */}
      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-lg">Recent Assignments</h2>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Assignment
          </button>
        </div>
        <div className="space-y-3">
          {recentAssignments.map((assignment) => (
            <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{assignment.title}</p>
                <p className="text-sm text-gray-600">{assignment.subject} • {assignment.class}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Submissions</p>
                  <p className="font-bold">{assignment.submissions}/{assignment.total}</p>
                </div>
                <span className="text-sm text-gray-500">{assignment.created}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAssignments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignments</h1>
        <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Create New Assignment
        </button>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="space-y-4">
          {recentAssignments.map((assignment) => (
            <div key={assignment.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{assignment.title}</h3>
                  <p className="text-gray-600">{assignment.subject} • {assignment.class}</p>
                  <p className="text-sm text-gray-500 mt-1">Created: {assignment.created}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Submissions</p>
                    <p className="text-lg font-bold text-indigo-600">
                      {assignment.submissions}/{assignment.total}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSubmissions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Student Submissions</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Pending</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Graded</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
            <Download className="w-4 h-4 mr-2 inline" />
            Export
          </button>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div key={submission.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg text-gray-800">{submission.student}</h3>
                  <p className="text-gray-600">{submission.assignment} • {submission.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-sm text-gray-500">Submitted: {submission.submittedAt}</p>
                    {submission.late && (
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Late</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {submission.status === 'graded' ? (
                    <div className="text-center">
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className="text-lg font-bold text-green-600">{submission.grade}%</p>
                    </div>
                  ) : (
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                      Grade Now
                    </button>
                  )}
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'assignments': return renderAssignments();
      case 'submissions': return renderSubmissions();
      case 'results': return (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Results Management</h2>
          <p className="text-gray-500">Enter and manage student grades...</p>
        </div>
      );
      case 'messages': return (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Messages</h2>
          <p className="text-gray-500">Communicate with students and colleagues...</p>
        </div>
      );
      case 'resources': return (
        <div className="text-center py-12">
          <FolderOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Learning Resources</h2>
          <p className="text-gray-500">Upload and manage teaching materials...</p>
        </div>
      );
      case 'analytics': return (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Analytics</h2>
          <p className="text-gray-500">Track class performance and trends...</p>
        </div>
      );
      case 'profile': return (
        <div className="space-y-6">
          <h1 className="text-3xl font-bold">Teacher Profile</h1>
          <div className="bg-white/70 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {user.avatar}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                <p className="text-gray-600">{user.teacherProfile.subjects.join(' & ')} Teacher</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                <p className="text-sm text-gray-500">Employee ID: {user.teacherProfile.employeeId}</p>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Department</p>
                <p className="font-semibold">{user.teacherProfile.department}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Experience</p>
                <p className="font-semibold">{user.teacherProfile.experienceYears} years</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                <p className="text-sm text-gray-600">Qualification</p>
                <p className="font-semibold">{user.teacherProfile.qualification}</p>
              </div>
            </div>
          </div>
        </div>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
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
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
              <span className="font-bold text-xl">UPSS Hub</span>
              <span className="text-sm text-gray-500">• Teacher Portal</span>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search students, assignments..."
                className="w-full pl-10 pr-4 py-2 bg-white/50 border border-white/30 rounded-lg focus:outline-none focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              {teacherData.notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {teacherData.notifications}
                </span>
              )}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.avatar}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-600">{user.teacherProfile.subjects.join(' & ')}</p>
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
              
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all ${
                    isActive 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                >
                  <Icon className="w-5 h-5" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
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

export default TeacherPortal;