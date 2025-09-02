'use client'
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  School, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle,
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const HeadAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [schools, setSchools] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSchools: 0,
    trialsEndingSoon: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demo - replace with actual API calls
  useEffect(() => {
    // Check if user is authenticated
    const mockUser = {
      id: 1,
      name: "Admin User",
      email: "admin@upss.com",
      role: "HEAD_ADMIN"
    };
    setUser(mockUser);

    // Mock metrics
    setMetrics({
      totalSchools: 47,
      trialsEndingSoon: 8,
      totalRevenue: 2450000,
      totalUsers: 12847
    });

    // Mock schools data
    setSchools([
      {
        id: 1,
        name: "Rainbow College",
        slug: "rainbow-college",
        status: "ACTIVE",
        trialEndDate: "2024-12-15",
        claimedStudents: 450,
        claimedTeachers: 28,
        verifiedStudents: 445,
        verifiedTeachers: 27,
        revenue: 112500,
        createdAt: "2024-09-01"
      },
      {
        id: 2,
        name: "Future Leaders Academy",
        slug: "future-leaders",
        status: "TRIAL",
        trialEndDate: "2024-09-10",
        claimedStudents: 320,
        claimedTeachers: 22,
        verifiedStudents: null,
        verifiedTeachers: null,
        revenue: 0,
        createdAt: "2024-08-25"
      },
      {
        id: 3,
        name: "Excellence High School",
        slug: "excellence-high",
        status: "SUSPENDED",
        trialEndDate: "2024-08-30",
        claimedStudents: 280,
        claimedTeachers: 18,
        verifiedStudents: 275,
        verifiedTeachers: 17,
        revenue: 68750,
        createdAt: "2024-07-15"
      }
    ]);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">WHO IS THIS BOMBOCLAT?</h1>
          <p className="text-xl text-gray-300">GO AND SIGN UP TO ACCESS THESE FEATURES</p>
          <button className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300">
            Sign Up Now
          </button>
        </div>
      </div>
    );
  }

  const filteredSchools = schools.filter(school => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || school.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'TRIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-purple-900 dark:to-slate-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
              Head Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage all schools and monitor platform performance
            </p>
          </div>
          <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2">
            <Plus size={20} />
            Create School
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalSchools}</p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                <School className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="text-emerald-500" size={16} />
              <span className="text-emerald-500 font-medium ml-1">+12%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Trials Ending Soon</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{metrics.trialsEndingSoon}</p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <AlertTriangle className="text-yellow-500" size={16} />
              <span className="text-yellow-500 font-medium ml-1">Attention needed</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(metrics.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                <DollarSign className="text-indigo-600 dark:text-indigo-400" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="text-emerald-500" size={16} />
              <span className="text-emerald-500 font-medium ml-1">+18%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{metrics.totalUsers.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
                <Users className="text-purple-600 dark:text-purple-400" size={24} />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="text-emerald-500" size={16} />
              <span className="text-emerald-500 font-medium ml-1">+25%</span>
              <span className="text-gray-600 dark:text-gray-400 ml-1">from last month</span>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="p-6 border-b border-gray-200 dark:border-slate-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Schools Overview</h2>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div className="relative">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="appearance-none pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="TRIAL">Trial</option>
                    <option value="SUSPENDED">Suspended</option>
                  </select>
                  <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teachers</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trial End</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{school.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">/{school.slug}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(school.status)}`}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>Claimed: {school.claimedStudents}</span>
                        {school.verifiedStudents && (
                          <span className="text-xs text-gray-500">Verified: {school.verifiedStudents}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex flex-col">
                        <span>Claimed: {school.claimedTeachers}</span>
                        {school.verifiedTeachers && (
                          <span className="text-xs text-gray-500">Verified: {school.verifiedTeachers}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(school.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {school.trialEndDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                          <Eye size={16} />
                        </button>
                        <button className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-all">
                          <Edit size={16} />
                        </button>
                        <div className="relative group">
                          <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                            <MoreHorizontal size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadAdminDashboard;