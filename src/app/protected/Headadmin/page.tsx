'use client'
import React, { useState, useEffect } from 'react';
import { 
  Home, School, Receipt, MessageSquare, Settings, Search, Bell, Menu,
  Plus, Users, DollarSign, TrendingUp, AlertTriangle, CheckCircle,
  XCircle, Clock, Eye, Edit, Trash2, Send, Download, Filter,
  Building2, UserCheck, Shield, Activity, Mail, Phone, Globe,
  Calendar, CreditCard, Play, BarChart3, Target
} from 'lucide-react';

const HeadAdminPortal = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/auth';
          return;
        }

        // Head Admin user data
        const userData = {
          id: '1',
          firstName: 'Admin',
          lastName: 'Master',
          email: 'admin@uplus.com',
          role: 'headadmin',
          avatar: 'AM',
          company: 'U Plus Hub'
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

  // Mock data - replace with API calls
  const platformStats = {
    totalSchools: 247,
    activeSchools: 231,
    suspendedSchools: 16,
    pendingVerification: 5,
    totalRevenue: 15650000, // In Naira
    monthlyGrowth: 12.5,
    totalStudents: 89234,
    totalTeachers: 3421
  };

  const recentSchools = [
    { 
      id: 1, 
      name: "Excellence High School", 
      slug: "excellence-high",
      status: "active",
      students: 450,
      teachers: 28,
      subscription: "paid",
      lastActive: "2 hours ago",
      revenue: 450000
    },
    { 
      id: 2, 
      name: "Future Leaders Academy", 
      slug: "future-leaders",
      status: "pending",
      students: 320,
      teachers: 22,
      subscription: "trial",
      lastActive: "1 day ago",
      revenue: 0
    },
    { 
      id: 3, 
      name: "Bright Stars School", 
      slug: "bright-stars",
      status: "suspended",
      students: 280,
      teachers: 18,
      subscription: "overdue",
      lastActive: "2 weeks ago",
      revenue: 280000
    },
    { 
      id: 4, 
      name: "Unity International", 
      slug: "unity-intl",
      status: "active",
      students: 680,
      teachers: 45,
      subscription: "paid",
      lastActive: "5 minutes ago",
      revenue: 680000
    },
  ];

  const invoices = [
    { 
      id: 1, 
      school: "Excellence High School", 
      term: "2024 Term 2", 
      amount: 450000, 
      status: "paid", 
      date: "2024-08-15",
      students: 450,
      teachers: 28
    },
    { 
      id: 2, 
      school: "Unity International", 
      term: "2024 Term 2", 
      amount: 680000, 
      status: "pending", 
      date: "2024-09-01",
      students: 680,
      teachers: 45
    },
    { 
      id: 3, 
      school: "Bright Stars School", 
      term: "2024 Term 2", 
      amount: 280000, 
      status: "overdue", 
      date: "2024-07-20",
      students: 280,
      teachers: 18
    },
  ];

  const sidebarItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/head-admin/dashboard' },
    { id: 'schools', icon: School, label: 'Schools', path: '/head-admin/schools' },
    { id: 'invoices', icon: Receipt, label: 'Invoices', path: '/head-admin/invoices' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/head-admin/messages' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/head-admin/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
            Platform Overview 📊
          </h1>
          <p className="text-gray-600 mt-1">Managing {platformStats.totalSchools} schools across Nigeria</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New School
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Schools</p>
              <p className="text-2xl font-bold text-slate-800">{platformStats.totalSchools}</p>
              <p className="text-xs text-green-600">+{platformStats.monthlyGrowth}% this month</p>
            </div>
            <div className="p-3 bg-slate-100 rounded-full">
              <School className="w-6 h-6 text-slate-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Schools</p>
              <p className="text-2xl font-bold text-green-600">{platformStats.activeSchools}</p>
              <p className="text-xs text-gray-500">{platformStats.suspendedSchools} suspended</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(platformStats.totalRevenue)}</p>
              <p className="text-xs text-emerald-600">This term</p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-full">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Reviews</p>
              <p className="text-2xl font-bold text-orange-600">{platformStats.pendingVerification}</p>
              <p className="text-xs text-orange-600">Need attention</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Schools</h2>
            <button 
              onClick={() => setCurrentPage('schools')}
              className="text-slate-600 text-sm hover:underline"
            >
              View all schools
            </button>
          </div>
          <div className="space-y-4">
            {recentSchools.map((school) => (
              <div key={school.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                    {school.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{school.name}</p>
                    <p className="text-sm text-gray-600">{school.students} students • {school.teachers} teachers</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(school.revenue)}</p>
                    <p className="text-xs text-gray-500">{school.lastActive}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    school.status === 'active' ? 'bg-green-100 text-green-700' :
                    school.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {school.status}
                  </span>
                  <div className="flex gap-1">
                    <button className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-600 hover:bg-slate-50 rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Platform Users</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Students</span>
                <span className="font-bold">{platformStats.totalStudents.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Teachers</span>
                <span className="font-bold">{platformStats.totalTeachers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Schools</span>
                <span className="font-bold">{platformStats.totalSchools}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-6 text-white">
            <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-white/20 rounded-lg p-3 text-left hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  <span className="text-sm">Create New School</span>
                </div>
              </button>
              <button 
                onClick={() => setCurrentPage('invoices')}
                className="w-full bg-white/20 rounded-lg p-3 text-left hover:bg-white/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  <span className="text-sm">Review Invoices</span>
                </div>
              </button>
              <button className="w-full bg-white/20 rounded-lg p-3 text-left hover:bg-white/30 transition-colors">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-sm">Broadcast Message</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSchools = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Schools Management</h1>
        <div className="flex gap-3">
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">All</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Active</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Suspended</button>
            <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Pending</button>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add School
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">School</th>
                <th className="text-left p-4 font-medium text-gray-600">Students</th>
                <th className="text-left p-4 font-medium text-gray-600">Teachers</th>
                <th className="text-left p-4 font-medium text-gray-600">Revenue</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Last Active</th>
                <th className="text-left p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentSchools.map((school) => (
                <tr key={school.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-slate-600 to-slate-500 rounded-lg flex items-center justify-center text-white font-bold text-xs">
                        {school.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{school.name}</p>
                        <p className="text-sm text-gray-500">{school.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-medium">{school.students}</td>
                  <td className="p-4 font-medium">{school.teachers}</td>
                  <td className="p-4 font-medium text-green-600">{formatCurrency(school.revenue)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      school.status === 'active' ? 'bg-green-100 text-green-700' :
                      school.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {school.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{school.lastActive}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderInvoices = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Invoice Management</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">All</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Paid</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Pending</button>
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Overdue</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-600">School</th>
                <th className="text-left p-4 font-medium text-gray-600">Term</th>
                <th className="text-left p-4 font-medium text-gray-600">Users</th>
                <th className="text-left p-4 font-medium text-gray-600">Amount</th>
                <th className="text-left p-4 font-medium text-gray-600">Status</th>
                <th className="text-left p-4 font-medium text-gray-600">Date</th>
                <th className="text-left p-4 font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{invoice.school}</td>
                  <td className="p-4 text-gray-600">{invoice.term}</td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p>{invoice.students} students</p>
                      <p>{invoice.teachers} teachers</p>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-green-600">{formatCurrency(invoice.amount)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      invoice.status === 'paid' ? 'bg-green-100 text-green-700' :
                      invoice.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{new Date(invoice.date).toLocaleDateString()}</td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded">
                        <Eye className="w-4 h-4" />
                      </button>
                      {invoice.status !== 'paid' && (
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button className="p-2 text-gray-600 hover:bg-gray-50 rounded">
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return renderDashboard();
      case 'schools': return renderSchools();
      case 'invoices': return renderInvoices();
      case 'messages': return (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Platform Messages</h2>
          <p className="text-gray-500">Communicate with school administrators...</p>
        </div>
      );
      case 'settings': return (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Platform Settings</h2>
          <p className="text-gray-500">System configuration and preferences...</p>
        </div>
      );
      default: return renderDashboard();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-stone-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-800 to-slate-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                U+
              </div>
              <div>
                <span className="font-bold text-xl">U Plus Hub</span>
                <span className="text-sm text-gray-500 ml-2">• Head Admin</span>
              </div>
            </div>
          </div>

          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search schools, invoices..."
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {platformStats.pendingVerification}
              </span>
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-slate-800 to-slate-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                {user.avatar}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-gray-600">Head Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`bg-white border-r border-gray-200 transition-all duration-300 ${
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
                      ? 'bg-slate-600 text-white shadow-lg' 
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

export default HeadAdminPortal;