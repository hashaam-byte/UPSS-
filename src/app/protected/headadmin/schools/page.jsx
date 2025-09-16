'use client'
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Pause, 
  Play, 
  Users, 
  Calendar,
  MoreVertical,
  Building2,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';

const SchoolsManagementPage = () => {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [schools, searchTerm, statusFilter, sortBy]);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/headadmin/schools');
      if (response.ok) {
        const data = await response.json();
        setSchools(data.schools || []);
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterSchools = () => {
    let filtered = [...schools];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.slug.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(school => {
        if (statusFilter === 'active') return school.isActive;
        if (statusFilter === 'suspended') return !school.isActive;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name_asc':
          return a.name.localeCompare(b.name);
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'created_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'users_asc':
          return (a.userCount || 0) - (b.userCount || 0);
        case 'users_desc':
          return (b.userCount || 0) - (a.userCount || 0);
        default:
          return 0;
      }
    });

    setFilteredSchools(filtered);
  };

  const handleSchoolAction = async (schoolId, action) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/protected/headadmin/schools/${schoolId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchSchools(); // Refresh data
        setShowActionMenu(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} school:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (school) => {
    if (school.isActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          ACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3 mr-1" />
        SUSPENDED
      </span>
    );
  };

  const getSubscriptionBadge = (school) => {
    if (school.subscriptionIsActive) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
          PREMIUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        TRIAL
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
            <div className="absolute inset-0 w-12 h-12 border-4 border-blue-200 rounded-full animate-pulse mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading schools...</p>
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
                Schools Management
              </h1>
              <p className="text-gray-600 text-lg">
                Manage and monitor all schools on the platform
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchSchools}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Schools</p>
                <p className="text-3xl font-bold text-gray-900">{schools.length}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white/70 to-emerald-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Schools</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {schools.filter(s => s.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white/70 to-red-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Suspended</p>
                <p className="text-3xl font-bold text-red-600">
                  {schools.filter(s => !s.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <XCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-purple-600">
                  {schools.reduce((sum, school) => sum + (school.userCount || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search schools by name, email, or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium transition-all duration-200"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium min-w-32"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium min-w-40"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="users_desc">Most Users</option>
                <option value="users_asc">Least Users</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schools Table */}
        <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          {filteredSchools.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-lg">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No schools found matching your criteria'
                  : 'No schools registered yet'
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Schools will appear here once they register'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Users
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Subscription
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredSchools.map((school) => (
                      <tr key={school.id} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Building2 className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900 text-lg">
                                {school.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {school.slug} • {school.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          {getStatusBadge(school)}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-sm font-bold text-gray-900">
                          <div className="flex items-center">
                            <Users className="w-4 h-4 text-gray-400 mr-2" />
                            {school.userCount || 0}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(school.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          {getSubscriptionBadge(school)}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === school.id ? null : school.id)}
                              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              disabled={actionLoading}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {showActionMenu === school.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-10 backdrop-blur-sm overflow-hidden">
                                <div className="py-2">
                                  <button
                                    onClick={() => window.location.href = `/protected/headadmin/schools/${school.id}`}
                                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left font-medium transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-3" />
                                    View Details
                                  </button>
                                  
                                  {school.isActive ? (
                                    <button
                                      onClick={() => handleSchoolAction(school.id, 'suspend')}
                                      className="flex items-center px-4 py-3 text-sm text-red-700 hover:bg-red-50 w-full text-left font-medium transition-colors"
                                      disabled={actionLoading}
                                    >
                                      <Pause className="w-4 h-4 mr-3" />
                                      Suspend School
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSchoolAction(school.id, 'activate')}
                                      className="flex items-center px-4 py-3 text-sm text-green-700 hover:bg-green-50 w-full text-left font-medium transition-colors"
                                      disabled={actionLoading}
                                    >
                                      <Play className="w-4 h-4 mr-3" />
                                      Activate School
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="lg:hidden divide-y divide-gray-200/50">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="p-6 hover:bg-blue-50/30 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{school.name}</h3>
                          <p className="text-sm text-gray-500">{school.email}</p>
                        </div>
                      </div>
                      {getStatusBadge(school)}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {school.userCount || 0} users
                        </div>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(school.createdAt)}
                        </div>
                      </div>
                      {getSubscriptionBadge(school)}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => window.location.href = `/protected/headadmin/schools/${school.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                      
                      {school.isActive ? (
                        <button
                          onClick={() => handleSchoolAction(school.id, 'suspend')}
                          className="text-red-600 hover:text-red-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-red-50 transition-colors"
                          disabled={actionLoading}
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSchoolAction(school.id, 'activate')}
                          className="text-green-600 hover:text-green-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                          disabled={actionLoading}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolsManagementPage;