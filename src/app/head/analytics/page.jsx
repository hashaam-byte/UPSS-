'use client'
import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  School, 
  DollarSign, 
  Activity,
  Calendar,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const HeadAdminAnalytics = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Mock data for charts
  const revenueData = [
    { month: 'Jan', revenue: 1850000, schools: 35, users: 8500 },
    { month: 'Feb', revenue: 2100000, schools: 38, users: 9200 },
    { month: 'Mar', revenue: 1950000, schools: 41, users: 9800 },
    { month: 'Apr', revenue: 2300000, schools: 43, users: 10500 },
    { month: 'May', revenue: 2150000, schools: 45, users: 11200 },
    { month: 'Jun', revenue: 2450000, schools: 47, users: 12100 },
  ];

  const schoolGrowthData = [
    { month: 'Jan', active: 32, trial: 8, suspended: 3 },
    { month: 'Feb', active: 34, trial: 10, suspended: 2 },
    { month: 'Mar', active: 36, trial: 12, suspended: 3 },
    { month: 'Apr', active: 38, trial: 9, suspended: 4 },
    { month: 'May', active: 40, trial: 11, suspended: 2 },
    { month: 'Jun', active: 42, trial: 8, suspended: 3 },
  ];

  const subscriptionData = [
    { name: 'Basic', value: 15, color: '#06d6a0' },
    { name: 'Premium', value: 22, color: '#118ab2' },
    { name: 'Enterprise', value: 10, color: '#073b4c' },
  ];

  const userEngagementData = [
    { day: 'Mon', students: 8500, teachers: 650, admins: 47 },
    { day: 'Tue', students: 9200, teachers: 680, admins: 47 },
    { day: 'Wed', students: 8900, teachers: 665, admins: 46 },
    { day: 'Thu', students: 9800, teachers: 720, admins: 47 },
    { day: 'Fri', students: 10200, teachers: 740, admins: 47 },
    { day: 'Sat', students: 6500, teachers: 320, admins: 25 },
    { day: 'Sun', students: 5200, teachers: 180, admins: 18 },
  ];

  const topPerformingSchools = [
    { name: 'Green Valley International', students: 680, revenue: 170000, growth: 15 },
    { name: 'Rainbow College', students: 445, revenue: 112500, growth: 12 },
    { name: 'Excellence High School', students: 275, revenue: 68750, growth: 8 },
    { name: 'Future Leaders Academy', students: 320, revenue: 0, growth: 25 },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const calculateGrowth = (current, previous) => {
    return ((current - previous) / previous * 100).toFixed(1);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
            Platform Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Comprehensive insights into platform performance and growth
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 3 months</option>
              <option value="1y">Last year</option>
            </select>
            <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
              <DollarSign className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div className="flex items-center text-emerald-500 text-sm font-medium">
              <TrendingUp size={16} />
              <span className="ml-1">+18.2%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₦2,450,000</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">946 new this month</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <Activity className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
            <div className="flex items-center text-red-500 text-sm font-medium">
              <TrendingDown size={16} />
              <span className="ml-1">-2.1%</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Avg Daily Active Users</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">8,925</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">69.5% engagement rate</p>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar size={16} />
              <span>Last 6 months</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" tickFormatter={(value) => `₦${(value/1000000).toFixed(1)}M`} />
              <Tooltip 
                formatter={(value) => [formatCurrency(value), 'Revenue']}
                labelStyle={{ color: '#1F2937' }}
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                stroke="url(#colorGradient)" 
                strokeWidth={3}
                dot={{ fill: '#06d6a0', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: '#118ab2' }}
              />
              <defs>
                <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#06d6a0" />
                  <stop offset="100%" stopColor="#118ab2" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Subscription Plans</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={subscriptionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {subscriptionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Schools']} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {subscriptionData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-gray-600 dark:text-gray-300">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Status */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">School Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={schoolGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="month" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="active" fill="#06d6a0" name="Active" radius={[4, 4, 0, 0]} />
              <Bar dataKey="trial" fill="#ffd60a" name="Trial" radius={[4, 4, 0, 0]} />
              <Bar dataKey="suspended" fill="#ef476f" name="Suspended" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Engagement */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Weekly User Activity</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userEngagementData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis dataKey="day" stroke="#6B7280" />
              <YAxis stroke="#6B7280" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#F9FAFB', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="students" stroke="#06d6a0" strokeWidth={2} name="Students" />
              <Line type="monotone" dataKey="teachers" stroke="#118ab2" strokeWidth={2} name="Teachers" />
              <Line type="monotone" dataKey="admins" stroke="#073b4c" strokeWidth={2} name="Admins" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Performing Schools */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Top Performing Schools</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Students</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Growth</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
              {topPerformingSchools.map((school, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3">
                        #{index + 1}
                      </div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{school.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {school.students.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(school.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="text-emerald-500 mr-1" size={16} />
                      <span className="text-sm font-medium text-emerald-500">+{school.growth}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(school.growth * 4, 100)}%` }}
                      ></div>
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
};

export default HeadAdminAnalytics;