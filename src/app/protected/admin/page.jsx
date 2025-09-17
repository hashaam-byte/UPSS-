'use client'
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  MessageSquare,
  FileText,
  Calendar,
  Activity,
  BookOpen,
  Award
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
  const [quickActions, setQuickActions] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch dashboard statistics
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

  const statCards = [
    {
      title: 'Total Students',
      value: stats.students,
      icon: GraduationCap,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-500/10 to-blue-600/10',
      change: '+12%',
      changeType: 'increase'
    },
    {
      title: 'Total Teachers',
      value: stats.teachers,
      icon: UserCheck,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-500/10 to-emerald-600/10',
      change: '+3%',
      changeType: 'increase'
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: Activity,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-500/10 to-purple-600/10',
      change: '+8%',
      changeType: 'increase'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-500/10 to-orange-600/10',
      change: '+15%',
      changeType: 'increase'
    }
  ];

  const quickActionItems = [
    {
      title: 'Create Student',
      description: 'Add new student account',
      icon: GraduationCap,
      href: '/protected/admin/users?tab=students&action=create',
      color: 'blue'
    },
    {
      title: 'Create Teacher',
      description: 'Add new teacher account',
      icon: UserCheck,
      href: '/protected/admin/users?tab=teachers&action=create',
      color: 'emerald'
    },
    {
      title: 'Import Users',
      description: 'Bulk import via CSV',
      icon: FileText,
      href: '/protected/admin/users/import',
      color: 'purple'
    },
    {
      title: 'View Analytics',
      description: 'Performance reports',
      icon: TrendingUp,
      href: '/protected/admin/analytics',
      color: 'orange'
    }
  ];

  const formatSubscriptionStatus = (subscription) => {
    if (!subscription) return { text: 'No Data', color: 'gray' };
    
    const isActive = subscription.subscriptionIsActive;
    const plan = subscription.subscriptionPlan;
    const expiresAt = new Date(subscription.subscriptionExpiresAt);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    
    if (isActive && daysLeft > 30) {
      return { text: `${plan.toUpperCase()} - Active`, color: 'green' };
    } else if (isActive && daysLeft > 0) {
      return { text: `${plan.toUpperCase()} - ${daysLeft} days left`, color: 'yellow' };
    } else {
      return { text: 'Expired', color: 'red' };
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-white/5 rounded-xl"></div>
          <div className="h-64 bg-white/5 rounded-xl"></div>
        </div>
      </div>
    );
  }

  const subscriptionStatus = formatSubscriptionStatus(stats.subscription);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Welcome to Admin Dashboard
            </h1>
            <p className="text-gray-400">
              Manage your school operations and monitor performance
            </p>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/30">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-white font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Alert */}
      {stats.subscription && (
        <div className={`p-4 rounded-xl border ${
          subscriptionStatus.color === 'red' 
            ? 'bg-red-500/10 border-red-500/30 text-red-400' 
            : subscriptionStatus.color === 'yellow'
            ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        }`}>
          <div className="flex items-center gap-3">
            {subscriptionStatus.color === 'red' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <div>
              <p className="font-medium">Subscription Status: {subscriptionStatus.text}</p>
              {subscriptionStatus.color === 'red' && (
                <p className="text-sm opacity-80">Please renew your subscription to continue accessing all features.</p>
              )}
            </div>
            {subscriptionStatus.color !== 'green' && (
              <button 
                onClick={() => window.location.href = '/protected/admin/subscription'}
                className="ml-auto px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                Manage
              </button>
            )}
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.bgGradient} backdrop-blur-xl rounded-2xl border border-white/20 p-6 hover:scale-105 transition-all duration-300`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-sm px-2 py-1 rounded-full ${
                  stat.changeType === 'increase' 
                    ? 'bg-emerald-500/20 text-emerald-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {stat.change}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-gray-400 text-sm">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            Quick Actions
          </h2>
          
          <div className="space-y-3">
            {quickActionItems.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={() => window.location.href = action.href}
                  className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-blue-500/10 to-blue-600/10 hover:from-blue-500/20 hover:to-blue-600/20 rounded-xl border border-blue-500/20 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-medium text-white group-hover:text-gray-100 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Recent Activity
          </h2>
          
          <div className="space-y-4">
            {stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white text-sm">{activity.description}</p>
                    <p className="text-gray-400 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                <p className="text-gray-400">No recent activity</p>
                <p className="text-gray-500 text-sm">Activity will appear here as users interact with the system</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <MessageSquare className="w-6 h-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Messages</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">0</p>
          <p className="text-gray-400 text-sm">Unread messages</p>
          <button 
            onClick={() => window.location.href = '/protected/admin/messages'}
            className="mt-3 text-blue-400 hover:text-blue-300 text-sm transition-colors"
          >
            View Messages →
          </button>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-6 h-6 text-emerald-400" />
            <h3 className="text-lg font-semibold text-white">Billing</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">₦{(stats.totalUsers * 250).toLocaleString()}</p>
          <p className="text-gray-400 text-sm">Estimated monthly cost</p>
          <button 
            onClick={() => window.location.href = '/protected/admin/subscription'}
            className="mt-3 text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
          >
            View Subscription →
          </button>
        </div>

        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Resources</h3>
          </div>
          <p className="text-2xl font-bold text-white mb-1">0</p>
          <p className="text-gray-400 text-sm">Documents uploaded</p>
          <button 
            onClick={() => window.location.href = '/protected/admin/resources'}
            className="mt-3 text-purple-400 hover:text-purple-300 text-sm transition-colors"
          >
            Manage Resources →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;