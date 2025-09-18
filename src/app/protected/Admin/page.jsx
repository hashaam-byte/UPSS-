'use client'
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  TrendingUp, 
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  FileText,
  Calendar,
  Activity,
  BookOpen,
  Award,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    students: 0,
    teachers: 0,
    admins: 0,
    activeUsers: 0,
    subscription: null,
    recentActivity: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [usersRes, subscriptionRes, activityRes] = await Promise.all([
        fetch('/api/protected/admin/stats/users'),
        fetch('/api/protected/admin/subscription/status'),
        fetch('/api/protected/admin/stats/activity')
      ]);

      const usersData = usersRes.ok ? await usersRes.json() : { stats: {} };
      const subscriptionData = subscriptionRes.ok ? await subscriptionRes.json() : { subscription: null };
      const activityData = activityRes.ok ? await activityRes.json() : { activities: [] };

      setStats({
        totalUsers: usersData.stats?.total || 0,
        students: usersData.stats?.students || 0,
        teachers: usersData.stats?.teachers || 0,
        admins: usersData.stats?.admins || 0,
        activeUsers: usersData.stats?.active || 0,
        subscription: subscriptionData.subscription,
        recentActivity: activityData.activities || []
      });

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
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

  const StatCard = ({ title, value, icon: Icon, trend, gradientFrom, gradientTo, onClick }) => (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 border border-gray-100 hover:border-blue-200`}
      onClick={onClick}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-5 group-hover:opacity-15 transition-opacity duration-500`}></div>
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500 rotate-45 transform -translate-x-full group-hover:translate-x-full"></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">{title}</p>
            <p className="text-4xl font-black text-gray-900 mb-3 tabular-nums">{value}</p>
            {trend && (
              <div className="flex items-center">
                <div className={`flex items-center px-3 py-1.5 rounded-full text-sm font-bold ${
                  trend.positive 
                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300' 
                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-300'
                } shadow-sm`}>
                  {trend.positive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                  {trend.value}%
                </div>
                <span className="text-sm text-gray-500 ml-3 font-medium">vs last month</span>
              </div>
            )}
          </div>
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
            <Icon className="w-8 h-8 text-white relative z-10" />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/10 group-hover:from-white/20 transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500 -z-10`}></div>
    </div>
  );

  const formatSubscriptionStatus = (subscription) => {
    if (!subscription) return { text: 'No Data', color: 'gray' };
    
    const isActive = subscription.subscriptionIsActive;
    const plan = subscription.subscriptionPlan;
    const expiresAt = new Date(subscription.subscriptionExpiresAt);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    
    if (isActive && daysLeft > 30) {
      return { text: `${plan.toUpperCase()} - Active`, color: 'emerald' };
    } else if (isActive && daysLeft > 0) {
      return { text: `${plan.toUpperCase()} - ${daysLeft} days left`, color: 'yellow' };
    } else {
      return { text: 'Expired', color: 'red' };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl animate-pulse shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Initializing Dashboard...</p>
          <div className="flex items-center justify-center mt-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce mr-1"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce mr-1 delay-150"></div>
            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce delay-300"></div>
          </div>
        </div>
      </div>
    );
  }

  const subscriptionStatus = formatSubscriptionStatus(stats.subscription);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Futuristic Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider">System Online</span>
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Mission Control
              </h1>
              <p className="text-gray-600 text-xl font-medium">
                Advanced school operations management interface
              </p>
            </div>
            <div className="hidden lg:block">
              <div className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 backdrop-blur-sm rounded-2xl border border-emerald-500/30 shadow-xl">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <div className="text-center">
                  <div className="text-sm font-bold text-gray-800">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-xs text-gray-600 font-medium">
                    {new Date().getFullYear()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Status Alert */}
        {stats.subscription && (
          <div className={`relative overflow-hidden rounded-2xl shadow-xl border backdrop-blur-sm ${
            subscriptionStatus.color === 'red' 
              ? 'bg-gradient-to-r from-red-50/90 to-pink-50/90 border-red-300 text-red-700' 
              : subscriptionStatus.color === 'yellow'
              ? 'bg-gradient-to-r from-yellow-50/90 to-amber-50/90 border-yellow-300 text-yellow-700'
              : 'bg-gradient-to-r from-emerald-50/90 to-green-50/90 border-emerald-300 text-emerald-700'
          } p-6`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                  subscriptionStatus.color === 'red' ? 'bg-gradient-to-br from-red-500 to-pink-500' :
                  subscriptionStatus.color === 'yellow' ? 'bg-gradient-to-br from-yellow-500 to-amber-500' :
                  'bg-gradient-to-br from-emerald-500 to-green-500'
                }`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-black text-lg">Subscription Status: {subscriptionStatus.text}</p>
                  {subscriptionStatus.color === 'red' && (
                    <p className="text-sm font-medium opacity-80">System access may be restricted. Please renew to continue.</p>
                  )}
                </div>
              </div>
              {subscriptionStatus.color !== 'emerald' && (
                <button 
                  onClick={() => window.location.href = '/protected/admin/subscription'}
                  className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg border border-white/30"
                >
                  Upgrade Now
                </button>
              )}
            </div>
          </div>
        )}

        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
          <StatCard
            title="Total Students"
            value={stats.students?.toLocaleString() || '0'}
            icon={GraduationCap}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
            trend={{ positive: true, value: 12 }}
            onClick={() => window.location.href = '/protected/admin/users?tab=students'}
          />
          
          <StatCard
            title="Active Teachers"
            value={stats.teachers?.toLocaleString() || '0'}
            icon={UserCheck}
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-500"
            trend={{ positive: true, value: 8 }}
            onClick={() => window.location.href = '/protected/admin/users?tab=teachers'}
          />
          
          <StatCard
            title="Live Sessions"
            value={stats.activeUsers?.toLocaleString() || '0'}
            icon={Activity}
            gradientFrom="from-purple-500"
            gradientTo="to-pink-500"
            trend={{ positive: true, value: 23 }}
          />
          
          <StatCard
            title="Total Users"
            value={stats.totalUsers?.toLocaleString() || '0'}
            icon={Users}
            gradientFrom="from-orange-500"
            gradientTo="to-red-500"
            trend={{ positive: true, value: 15 }}
            onClick={() => window.location.href = '/protected/admin/users'}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Quick Actions - Takes 2 columns */}
          <div className="xl:col-span-2">
            <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Quick Actions</h3>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Create Student',
                      description: 'Add new student accounts to the system',
                      icon: GraduationCap,
                      href: '/protected/admin/users?tab=students&action=create',
                      gradient: 'from-blue-500 to-cyan-500'
                    },
                    {
                      title: 'Create Teacher',
                      description: 'Register new teaching staff',
                      icon: UserCheck,
                      href: '/protected/admin/users?tab=teachers&action=create',
                      gradient: 'from-emerald-500 to-teal-500'
                    },
                    {
                      title: 'Import Users',
                      description: 'Bulk user import via CSV files',
                      icon: FileText,
                      href: '/protected/admin/users/import',
                      gradient: 'from-purple-500 to-pink-500'
                    },
                    {
                      title: 'View Analytics',
                      description: 'Advanced performance insights',
                      icon: TrendingUp,
                      href: '/protected/admin/analytics',
                      gradient: 'from-orange-500 to-red-500'
                    }
                  ].map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={index}
                        onClick={() => window.location.href = action.href}
                        className="group relative overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/50 hover:from-white/80 hover:to-gray-50/80 rounded-2xl p-6 border border-gray-200/50 hover:border-blue-300/50 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl text-left"
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                            <Icon className="w-7 h-7 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className="font-black text-gray-900 text-lg mb-2">{action.title}</p>
                            <p className="text-gray-600 text-sm font-medium">{action.description}</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-x-full group-hover:translate-x-full"></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Recent Activity */}
            <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Live Activity</h3>
                </div>
              </div>
              
              <div className="p-6">
                {stats.recentActivity.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentActivity.slice(0, 5).map((activity, index) => (
                      <div key={index} className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50/80 to-white/50 rounded-xl border border-gray-200/50 hover:shadow-lg transition-all duration-300">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 text-sm font-bold">{activity.description}</p>
                          <p className="text-gray-500 text-xs font-medium">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 font-bold text-lg">No Recent Activity</p>
                    <p className="text-gray-400 text-sm font-medium">System events will appear here</p>
                  </div>
                )}
              </div>
            </div>

            {/* System Info */}
            <div className="grid grid-cols-1 gap-6">
              {[
                {
                  title: 'Messages',
                  value: '0',
                  subtitle: 'Unread notifications',
                  icon: MessageSquare,
                  gradient: 'from-blue-500 to-cyan-500',
                  href: '/protected/admin/messages'
                },
                {
                  title: 'Billing',
                  value: formatCurrency((stats.totalUsers || 0) * 250),
                  subtitle: 'Estimated monthly cost',
                  icon: CreditCard,
                  gradient: 'from-emerald-500 to-teal-500',
                  href: '/protected/admin/subscription'
                },
                {
                  title: 'Resources',
                  value: '0',
                  subtitle: 'Documents uploaded',
                  icon: BookOpen,
                  gradient: 'from-purple-500 to-pink-500',
                  href: '/protected/admin/resources'
                }
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={index}
                    onClick={() => window.location.href = item.href}
                    className="group relative overflow-hidden bg-gradient-to-br from-white/80 to-gray-50/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 hover:border-blue-300/50 p-6 transition-all duration-300 hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <Star className="w-5 h-5 text-gray-300 group-hover:text-yellow-400 transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-gray-900 mb-1 tabular-nums">{item.value}</p>
                      <p className="text-sm font-bold text-gray-600 mb-2">{item.title}</p>
                      <p className="text-xs text-gray-500 font-medium">{item.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;