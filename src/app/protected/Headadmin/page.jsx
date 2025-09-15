'use client'
import React, { useState, useEffect } from 'react';
import { 
  School, 
  Users, 
  CreditCard, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Building2,
  UserPlus,
  Banknote,
  Activity,
  Plus,
  Eye,
  Pause,
  Play,
  Mail,
  ArrowUp,
  ArrowDown,
  BarChart3
} from 'lucide-react';

const HeadAdminDashboard = () => {
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    suspendedSchools: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    pendingPayments: 0
  });
  const [recentSchools, setRecentSchools] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard statistics
      const [statsResponse, schoolsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/protected/headadmin/stats'),
        fetch('/api/protected/headadmin/schools/recent'),
        fetch('/api/protected/headadmin/invoices/recent')
      ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (schoolsResponse.ok) {
        const schoolsData = await schoolsResponse.json();
        setRecentSchools(schoolsData.schools || []);
      }

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.payments || []);
      }

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolAction = async (schoolId, action) => {
    try {
      const response = await fetch(`/api/protected/headadmin/schools/${schoolId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        fetchDashboardData(); // Refresh data
      }
    } catch (error) {
      console.error(`Failed to ${action} school:`, error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, gradientFrom, gradientTo, onClick }) => (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 border border-gray-100`}
      onClick={onClick}
    >
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
            {trend && (
              <div className="flex items-center">
                <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  trend.positive 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border border-green-200' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200'
                }`}>
                  {trend.positive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {trend.value}%
                </div>
                <span className="text-xs text-gray-500 ml-2">vs last month</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none`}></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Welcome back! Here's what's happening with your platform.
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = '/protected/headadmin/schools/create'}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Add School</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700 shadow-lg">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Schools"
            value={stats.totalSchools || '0'}
            icon={School}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
            trend={{ positive: true, value: 12 }}
            onClick={() => window.location.href = '/protected/headadmin/schools'}
          />
          
          <StatCard
            title="Active Schools"
            value={stats.activeSchools || '0'}
            icon={CheckCircle}
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-500"
            trend={{ positive: true, value: 8 }}
          />
          
          <StatCard
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || '0'}
            icon={Users}
            gradientFrom="from-purple-500"
            gradientTo="to-pink-500"
            trend={{ positive: true, value: 15 }}
          />
          
          <StatCard
            title="Monthly Revenue"
            value={formatCurrency(stats.monthlyRevenue || 0)}
            icon={TrendingUp}
            gradientFrom="from-yellow-500"
            gradientTo="to-orange-500"
            trend={{ positive: true, value: 23 }}
            onClick={() => window.location.href = '/protected/headadmin/invoices'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Recent Schools - Takes 2 columns */}
          <div className="xl:col-span-2">
            <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Recent Schools</h3>
                  </div>
                  <button 
                    onClick={() => window.location.href = '/protected/headadmin/schools'}
                    className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    View all
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {recentSchools.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <School className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No schools registered yet</p>
                    <p className="text-gray-400 text-sm mt-1">Schools will appear here once they register</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentSchools.map((school) => (
                      <div key={school.id} className="group relative">
                        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50/80 to-blue-50/50 rounded-xl hover:from-blue-50/80 hover:to-purple-50/50 transition-all duration-300 border border-gray-200/50 hover:border-blue-200/50 hover:shadow-md">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-lg">{school.name}</p>
                              <div className="flex items-center space-x-3 text-sm text-gray-500 mt-1">
                                <span className="flex items-center">
                                  <Users className="w-4 h-4 mr-1" />
                                  {school.userCount || 0} users
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-4 h-4 mr-1" />
                                  {formatDate(school.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                              school.isActive 
                                ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200' 
                                : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200'
                            }`}>
                              {school.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                            <button 
                              onClick={() => window.location.href = `/protected/headadmin/schools/${school.id}`}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Recent Payments */}
            <div className="bg-gradient-to-br from-white/70 to-emerald-50/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                      <Banknote className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Recent Payments</h3>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {recentPayments.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No recent payments</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPayments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-emerald-50/50 rounded-lg border border-gray-200/50 hover:shadow-md transition-all duration-200">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                            <Banknote className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{payment.schoolName}</p>
                            <p className="text-xs text-gray-500">
                              {formatCurrency(payment.amount)} • {formatDate(payment.createdAt)}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                          payment.status === 'paid' 
                            ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200'
                        }`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Activity className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">System Status</h3>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Database</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm px-2 py-1 bg-emerald-50 rounded-full">ONLINE</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">API Gateway</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm px-2 py-1 bg-emerald-50 rounded-full">OPERATIONAL</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Email Service</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-sm px-2 py-1 bg-emerald-50 rounded-full">SENDING</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-gray-700">Payment Gateway</span>
                    </div>
                    <span className="text-yellow-600 font-bold text-sm px-2 py-1 bg-yellow-50 rounded-full">MONITORING</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-white/70 to-indigo-50/70 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Quick Actions</h3>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <button 
                onClick={() => window.location.href = '/protected/headadmin/schools/create'}
                className="group relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-purple-50/50 hover:from-blue-100/80 hover:to-purple-100/50 rounded-xl p-6 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Create School</p>
                    <p className="text-sm text-gray-600 mt-1">Add a new institution to the platform</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/protected/headadmin/invoices'}
                className="group relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-teal-50/50 hover:from-emerald-100/80 hover:to-teal-100/50 rounded-xl p-6 border border-gray-200/50 hover:border-emerald-300/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Manage Billing</p>
                    <p className="text-sm text-gray-600 mt-1">Review payments and subscriptions</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => window.location.href = '/protected/headadmin/messages'}
                className="group relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-pink-50/50 hover:from-purple-100/80 hover:to-pink-100/50 rounded-xl p-6 border border-gray-200/50 hover:border-purple-300/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Send Message</p>
                    <p className="text-sm text-gray-600 mt-1">Communicate with school administrators</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadAdminDashboard;