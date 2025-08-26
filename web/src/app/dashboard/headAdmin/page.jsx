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
  Zap
} from 'lucide-react';

const HeadAdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data
  const headAdmin = {
    name: "Hash Cody",
    title: "Head Administrator",
    avatar: "HC",
    permissions: "Full System Access"
  };

  const systemStats = {
    totalSchools: 42,
    activeStudents: 8420,
    activeTeachers: 684,
    premiumSubscribers: 2156,
    monthlyRevenue: 485000,
    systemUptime: "99.94%",
    pendingApprovals: 12,
    suspendedAccounts: 3
  };

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

  const schoolsOverview = [
    { 
      name: "Unity High School", 
      students: 450, 
      teachers: 32, 
      status: "active", 
      revenue: 125000, 
      renewal: "2024-12-15",
      admin: "Mrs. Johnson"
    },
    { 
      name: "Excellence Academy", 
      students: 320, 
      teachers: 28, 
      status: "active", 
      revenue: 87500, 
      renewal: "2024-11-20",
      admin: "Dr. Williams"
    },
    { 
      name: "Future Leaders College", 
      students: 680, 
      teachers: 45, 
      status: "pending", 
      revenue: 200000, 
      renewal: "2024-12-01",
      admin: "Mr. Thompson"
    },
    { 
      name: "Progressive School", 
      students: 280, 
      teachers: 22, 
      status: "trial", 
      revenue: 0, 
      renewal: "2024-10-30",
      admin: "Ms. Davis"
    }
  ];

  const Sidebar = () => (
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

              {/* Tooltip for collapsed state */}
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
            {/* Mobile content same as desktop but without collapse functionality */}
            <div className="flex items-center gap-3 p-6 border-b border-gray-200">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">UPSS Hub</h1>
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

  const DashboardContent = () => (
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
            {schoolsOverview.map((school, index) => (
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50">
      <Sidebar />

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
                  Welcome back, {headAdmin.name}. You have full system control.
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
                  {systemStats.systemUptime} Uptime
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main>
          <DashboardContent />
        </main>
      </div>
    </div>
  );
};

export default HeadAdminDashboard;