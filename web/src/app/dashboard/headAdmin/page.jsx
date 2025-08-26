'use client'
import React, { useState, useEffect } from 'react';
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
  Clock,
  DollarSign,
  CreditCard,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  MessageSquare,
  Bell,
  Search,
  Filter,
  Download,
  Activity,
  Shield,
  Zap,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Send,
  FileText,
  Upload,
  Save,
  RefreshCw,
  MoreVertical,
  AlertCircle
} from 'lucide-react';

// Mock Data Store
const mockData = {
  headAdmin: {
    name: "Hash Cody",
    title: "Head Administrator",
    avatar: "HC",
    permissions: "Full System Access"
  },
  
  systemStats: {
    totalSchools: 42,
    activeStudents: 8420,
    activeTeachers: 684,
    premiumSubscribers: 2156,
    monthlyRevenue: 485000,
    systemUptime: "99.94%",
    pendingApprovals: 12,
    suspendedAccounts: 3
  },

  schools: [
    { 
      id: 1,
      name: "Unity High School", 
      students: 450, 
      teachers: 32, 
      status: "active", 
      revenue: 125000, 
      renewal: "2024-12-15",
      admin: "Mrs. Johnson",
      email: "admin@unityhigh.edu.ng",
      phone: "+234 803 123 4567",
      address: "15 Unity Road, Victoria Island, Lagos"
    },
    { 
      id: 2,
      name: "Excellence Academy", 
      students: 320, 
      teachers: 28, 
      status: "active", 
      revenue: 87500, 
      renewal: "2024-11-20",
      admin: "Dr. Williams",
      email: "williams@excellence.edu.ng",
      phone: "+234 807 987 6543",
      address: "23 Excellence Avenue, GRA, Abuja"
    },
    { 
      id: 3,
      name: "Future Leaders College", 
      students: 680, 
      teachers: 45, 
      status: "pending", 
      revenue: 200000, 
      renewal: "2024-12-01",
      admin: "Mr. Thompson",
      email: "thompson@futureleaders.edu.ng",
      phone: "+234 809 555 7890",
      address: "8 Leadership Close, New GRA, Port Harcourt"
    },
    { 
      id: 4,
      name: "Progressive School", 
      students: 280, 
      teachers: 22, 
      status: "trial", 
      revenue: 0, 
      renewal: "2024-10-30",
      admin: "Ms. Davis",
      email: "davis@progressive.edu.ng",
      phone: "+234 811 234 5678",
      address: "12 Progressive Street, Ikeja, Lagos"
    }
  ],

  subscriptions: [
    {
      id: 1,
      schoolId: 1,
      schoolName: "Unity High School",
      term: "2024-Term-3",
      type: "school-wide",
      claimedStudents: 450,
      claimedTeachers: 32,
      verifiedStudents: 445,
      verifiedTeachers: 32,
      amount: 125000,
      status: "approved",
      createdAt: "2024-10-15"
    },
    {
      id: 2,
      schoolId: 3,
      schoolName: "Future Leaders College",
      term: "2024-Term-3",
      type: "school-wide",
      claimedStudents: 680,
      claimedTeachers: 45,
      verifiedStudents: 675,
      verifiedTeachers: 43,
      amount: 200000,
      status: "pending",
      createdAt: "2024-10-20"
    }
  ],

  messages: [
    {
      id: 1,
      schoolId: 1,
      schoolName: "Unity High School",
      subject: "Payment Processing Issue",
      lastMessage: "We're experiencing delays with our bank transfer...",
      unread: true,
      timestamp: "2024-10-25 14:30"
    },
    {
      id: 2,
      schoolId: 2,
      schoolName: "Excellence Academy",
      subject: "Feature Request: Grade Analytics",
      lastMessage: "Could we get more detailed analytics for student performance?",
      unread: false,
      timestamp: "2024-10-24 09:15"
    }
  ]
};

// Sidebar Component
const Sidebar = ({ 
  sidebarOpen, 
  setSidebarOpen, 
  sidebarCollapsed, 
  setSidebarCollapsed, 
  currentPage, 
  setCurrentPage,
  systemStats,
  headAdmin
}) => {
  const sidebarItems = [
    { 
      id: 'dashboard',
      icon: BarChart3, 
      label: "Dashboard", 
      active: currentPage === 'dashboard',
      count: null
    },
    { 
      id: 'schools',
      icon: Building, 
      label: "Schools", 
      active: currentPage === 'schools',
      count: systemStats.totalSchools
    },
    { 
      id: 'subscriptions',
      icon: CreditCard, 
      label: "Subscriptions", 
      active: currentPage === 'subscriptions',
      count: systemStats.pendingApprovals
    },
    { 
      id: 'accounts',
      icon: Users, 
      label: "Accounts", 
      active: currentPage === 'accounts',
      count: null
    },
    { 
      id: 'messages',
      icon: MessageSquare, 
      label: "Messages", 
      active: currentPage === 'messages',
      count: 7
    },
    { 
      id: 'broadcast',
      icon: Zap, 
      label: "Broadcast", 
      active: currentPage === 'broadcast',
      count: null
    },
    { 
      id: 'settings',
      icon: Settings, 
      label: "Settings", 
      active: currentPage === 'settings',
      count: null
    }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 bg-white/95 backdrop-blur-xl shadow-2xl border-r border-gray-200 transition-all duration-300 hidden lg:block ${
        sidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Logo Section */}
        <div className="flex items-center gap-3 p-6 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">UPSS Plus</h1>
              <p className="text-xs text-gray-500">Head Admin Portal</p>
            </div>
          )}

          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
                item.active 
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              
              {!sidebarCollapsed && (
                <>
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.count && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.active 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </>
              )}

              {sidebarCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                  {item.count && ` (${item.count})`}
                </div>
              )}
            </button>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {headAdmin.avatar}
            </div>
            
            {!sidebarCollapsed && (
              <>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{headAdmin.name}</p>
                  <p className="text-xs text-gray-500">{headAdmin.title}</p>
                </div>
                
                <div className="flex flex-col gap-1">
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <LogOut className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">UPSS Plus</h1>
                <p className="text-xs text-gray-500">Head Admin Portal</p>
              </div>
            </div>

            <nav className="p-4 space-y-2 flex-1">
              {sidebarItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                    item.active 
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium flex-1 text-left">{item.label}</span>
                  {item.count && (
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.active 
                        ? 'bg-white/20 text-white' 
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                      {item.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-50 to-purple-100">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {headAdmin.avatar}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{headAdmin.name}</p>
                  <p className="text-xs text-gray-500">{headAdmin.title}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <Settings className="w-4 h-4 text-gray-500" />
                  </button>
                  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
                    <LogOut className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Dashboard Content Component
const DashboardContent = ({ systemStats, schools, recentActivities }) => (
  <div className="p-6">
    {/* Executive Summary Cards */}
    <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-100">Total Schools</p>
            <p className="text-3xl font-bold">{systemStats.totalSchools}</p>
            <p className="text-sm text-blue-100 flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4" />
              +8 this month
            </p>
          </div>
          <Building className="w-8 h-8 text-blue-200" />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl shadow-lg">
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
      </div>

      <div className="p-6 bg-gradient-to-br from-yellow-500 to-orange-500 text-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-yellow-100">Premium Users</p>
            <p className="text-3xl font-bold">{systemStats.premiumSubscribers.toLocaleString()}</p>
            <p className="text-sm text-yellow-100 flex items-center gap-1 mt-2">
              <Star className="w-4 h-4" />
              24% conversion rate
            </p>
          </div>
          <Award className="w-8 h-8 text-yellow-200" />
        </div>
      </div>

      <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-purple-100">Monthly Revenue</p>
            <p className="text-3xl font-bold">₦{(systemStats.monthlyRevenue / 1000).toFixed(0)}K</p>
            <p className="text-sm text-purple-100 flex items-center gap-1 mt-2">
              <TrendingUp className="w-4 h-4" />
              +28% growth
            </p>
          </div>
          <DollarSign className="w-8 h-8 text-purple-200" />
        </div>
      </div>
    </div>

    {/* Main Content Grid */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Schools Overview */}
      <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Schools Overview</h4>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-200 transition-all">
              <Filter className="w-4 h-4 inline mr-1" />
              Filter
            </button>
            <button className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {schools.map((school, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Building className="w-5 h-5 text-gray-600" />
                    <div>
                      <h6 className="font-semibold text-gray-800">{school.name}</h6>
                      <p className="text-sm text-gray-600">{school.students} students • {school.teachers} teachers • Admin: {school.admin}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-green-600">₦{school.revenue.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      school.status === 'active' ? 'bg-green-100 text-green-600' :
                      school.status === 'trial' ? 'bg-blue-100 text-blue-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {school.status}
                    </span>
                    <span className="text-xs text-gray-500">Renews {school.renewal}</span>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <Eye className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Health & Quick Actions */}
      <div className="space-y-6">
        {/* System Status */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            <h4 className="font-semibold text-gray-800">System Health</h4>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-bold text-green-600">{systemStats.systemUptime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Sessions</span>
              <span className="text-sm font-bold text-blue-600">1,247</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending Approvals</span>
              <span className="text-sm font-bold text-orange-600">{systemStats.pendingApprovals}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Suspended Accounts</span>
              <span className="text-sm font-bold text-red-600">{systemStats.suspendedAccounts}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <h4 className="font-semibold text-gray-800">Quick Actions</h4>
          </div>
          
          <div className="space-y-3">
            <button className="w-full p-3 text-left bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-emerald-600" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Create School Admin</p>
                  <p className="text-xs text-gray-600">Add new school to platform</p>
                </div>
              </div>
            </button>

            <button className="w-full p-3 text-left bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Verify Quotes</p>
                  <p className="text-xs text-gray-600">{systemStats.pendingApprovals} pending approvals</p>
                </div>
              </div>
            </button>

            <button className="w-full p-3 text-left bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <Zap className="w-5 h-5 text-purple-600" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Send Broadcast</p>
                  <p className="text-xs text-gray-600">Message all schools</p>
                </div>
              </div>
            </button>

            <button className="w-full p-3 text-left bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:shadow-md transition-all duration-200">
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-orange-600" />
                <div>
                  <p className="font-medium text-gray-800 text-sm">Export Reports</p>
                  <p className="text-xs text-gray-600">Financial & usage data</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="lg:col-span-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-indigo-600" />
          <h4 className="font-semibold text-gray-800">Recent System Activities</h4>
        </div>
        
        <div className="space-y-3">
          {recentActivities.map((activity, index) => (
            <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                activity.status === 'success' ? 'bg-green-100' :
                activity.status === 'warning' ? 'bg-yellow-100' :
                activity.status === 'pending' ? 'bg-blue-100' : 'bg-red-100'
              }`}>
                {activity.status === 'success' ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : activity.status === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                ) : activity.status === 'pending' ? (
                  <Clock className="w-4 h-4 text-blue-600" />
                ) : (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{activity.description}</p>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-xs text-gray-500">{activity.time}</p>
                  <p className="text-xs text-gray-600">by {activity.user}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Schools Management Component
const SchoolsContent = ({ schools }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSchool, setSelectedSchool] = useState(null);

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.admin.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || school.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Schools Management</h3>
          <p className="text-gray-600">Manage all schools and their administrators</p>
        </div>
        <button className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <Plus className="w-4 h-4 inline mr-2" />
          Add New School
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search schools or administrators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all">
            <Download className="w-4 h-4 inline mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSchools.map((school) => (
          <div key={school.id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6 hover:shadow-xl transition-all duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h5 className="font-semibold text-gray-800">{school.name}</h5>
                  <p className="text-sm text-gray-600">{school.admin}</p>
                </div>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                school.status === 'active' ? 'bg-green-100 text-green-600' :
                school.status === 'trial' ? 'bg-blue-100 text-blue-600' :
                school.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                'bg-red-100 text-red-600'
              }`}>
                {school.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{school.students} students, {school.teachers} teachers</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{school.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{school.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span className="line-clamp-2">{school.address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div>
                <p className="text-lg font-bold text-green-600">₦{school.revenue.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Renews {school.renewal}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedSchool(school)}
                  className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* School Detail Modal */}
      {selectedSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full m-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-800">{selectedSchool.name}</h4>
                    <p className="text-gray-600">School Details & Management</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedSchool(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Administrator</label>
                    <p className="text-gray-800">{selectedSchool.admin}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Email</label>
                    <p className="text-gray-800">{selectedSchool.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Phone</label>
                    <p className="text-gray-800">{selectedSchool.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Address</label>
                    <p className="text-gray-800">{selectedSchool.address}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Students</label>
                    <p className="text-2xl font-bold text-blue-600">{selectedSchool.students}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Teachers</label>
                    <p className="text-2xl font-bold text-green-600">{selectedSchool.teachers}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Revenue</label>
                    <p className="text-2xl font-bold text-purple-600">₦{selectedSchool.revenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full ${
                      selectedSchool.status === 'active' ? 'bg-green-100 text-green-600' :
                      selectedSchool.status === 'trial' ? 'bg-blue-100 text-blue-600' :
                      selectedSchool.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {selectedSchool.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  <CheckCircle className="w-4 h-4 inline mr-2" />
                  Approve Subscription
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  Suspend School
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <MessageSquare className="w-4 h-4 inline mr-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subscriptions Content Component
const SubscriptionsContent = ({ subscriptions }) => {
  const [activeTab, setActiveTab] = useState('quotes');
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Subscriptions Management</h3>
          <p className="text-gray-600">Manage quotes, invoices, and payments</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 mb-6">
        <div className="flex border-b border-gray-200">
          {['quotes', 'invoices', 'payments'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-4 font-medium capitalize ${
                activeTab === tab 
                  ? 'text-purple-600 border-b-2 border-purple-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="p-6">
          {activeTab === 'quotes' && (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Building className="w-5 h-5 text-gray-600" />
                        <div>
                          <h6 className="font-semibold text-gray-800">{sub.schoolName}</h6>
                          <p className="text-sm text-gray-600">
                            {sub.claimedStudents} students, {sub.claimedTeachers} teachers • 
                            Verified: {sub.verifiedStudents}S, {sub.verifiedTeachers}T
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₦{sub.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          sub.status === 'approved' ? 'bg-green-100 text-green-600' :
                          sub.status === 'pending' ? 'bg-yellow-100 text-yellow-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {sub.status}
                        </span>
                        <span className="text-xs text-gray-500">{sub.createdAt}</span>
                        {sub.status === 'pending' && (
                          <button className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 transition-colors">
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'invoices' && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Invoice management interface would be displayed here</p>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="text-center py-12">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Payment tracking interface would be displayed here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Messages Content Component
const MessagesContent = ({ messages }) => {
  const [selectedMessage, setSelectedMessage] = useState(null);
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Messages & Communication</h3>
          <p className="text-gray-600">Communicate with school administrators</p>
        </div>
        <button className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <Zap className="w-4 h-4 inline mr-2" />
          New Broadcast
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Recent Conversations</h4>
          <div className="space-y-3">
            {messages.map((message) => (
              <div 
                key={message.id}
                onClick={() => setSelectedMessage(message)}
                className={`p-3 rounded-xl cursor-pointer transition-colors ${
                  message.unread ? 'bg-purple-50 border border-purple-200' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {message.schoolName.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h6 className={`text-sm font-medium truncate ${message.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {message.schoolName}
                    </h6>
                    <p className="text-xs text-gray-600 mb-1">{message.subject}</p>
                    <p className="text-xs text-gray-500 truncate">{message.lastMessage}</p>
                    <p className="text-xs text-gray-400 mt-1">{message.timestamp}</p>
                  </div>
                  {message.unread && (
                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50">
          {selectedMessage ? (
            <div className="h-full flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {selectedMessage.schoolName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800">{selectedMessage.schoolName}</h4>
                    <p className="text-sm text-gray-600">{selectedMessage.subject}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex-1 p-6">
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-800">{selectedMessage.lastMessage}</p>
                  <p className="text-xs text-gray-500 mt-2">{selectedMessage.timestamp}</p>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200">
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Type your reply..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select a message to view conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Broadcast Content Component
const BroadcastContent = () => {
  const [recipients, setRecipients] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Broadcast Messages</h3>
          <p className="text-gray-600">Send announcements to multiple schools</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/50 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <select 
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Schools</option>
              <option value="active">Active Schools Only</option>
              <option value="trial">Trial Schools Only</option>
              <option value="pending">Pending Schools Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input 
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter message subject..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea 
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your broadcast message here..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3">
            <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Send className="w-4 h-4 inline mr-2" />
              Send Broadcast
            </button>
            <button className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
              <Save className="w-4 h-4 inline mr-2" />
              Save Draft
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Head Admin Dashboard Component
const HeadAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock recent activities
  const recentActivities = [
    {
      type: "school_added",
      description: "New school 'Bright Future Academy' registered",
      time: "2 hours ago",
      status: "success",
      user: "System"
    },
    {
      type: "subscription_approved",
      description: "Unity High School subscription approved - ₦125,000",
      time: "4 hours ago",
      status: "success",
      user: "Hash Cody"
    },
    {
      type: "payment_received",
      description: "Payment verified: Excellence Academy - ₦87,500",
      time: "6 hours ago",
      status: "success",
      user: "Auto-Payment"
    },
    {
      type: "account_suspended",
      description: "Teacher account suspended: John Doe (Overdue payment)",
      time: "1 day ago",
      status: "warning",
      user: "Hash Cody"
    },
    {
      type: "quote_pending",
      description: "Quote verification needed: Future Leaders College (450+ users)",
      time: "1 day ago",
      status: "pending",
      user: "System"
    }
  ];

  const renderPageContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardContent 
          systemStats={mockData.systemStats} 
          schools={mockData.schools} 
          recentActivities={recentActivities} 
        />;
      case 'schools':
        return <SchoolsContent schools={mockData.schools} />;
      case 'subscriptions':
        return <SubscriptionsContent subscriptions={mockData.subscriptions} />;
      case 'messages':
        return <MessagesContent messages={mockData.messages} />;
      case 'broadcast':
        return <BroadcastContent />;
      case 'accounts':
        return (
          <div className="p-6 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Accounts management interface coming soon</p>
          </div>
        );
      case 'settings':
        return (
          <div className="p-6 text-center">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Settings interface coming soon</p>
          </div>
        );
      default:
        return <DashboardContent 
          systemStats={mockData.systemStats} 
          schools={mockData.schools} 
          recentActivities={recentActivities} 
        />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <Sidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        systemStats={mockData.systemStats}
        headAdmin={mockData.headAdmin}
      />

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Bar */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200 p-4 sticky top-0 z-30">
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
                  <Crown className="w-6 h-6 text-purple-600" />
                  Head Admin Dashboard
                </h2>
                <p className="text-gray-600">
                  Welcome back, {mockData.headAdmin.name}. You have full system control.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <button className="relative p-2 rounded-xl hover:bg-gray-100">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                  3
                </span>
              </button>
              
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">System Status</p>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  {mockData.systemStats.systemUptime} Uptime
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>
          {renderPageContent()}
        </main>
      </div>
    </div>
  );
};

export default HeadAdminDashboard;