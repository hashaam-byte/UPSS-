'use client'
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Mail, 
  Phone, 
  Globe, 
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  User,
  FileText,
  Pause,
  Play,
  Edit,
  Trash2,
  Activity,
  TrendingUp,
  AlertTriangle,
  Loader2,
  RefreshCw,
  MessageSquare,
  CreditCard,
  Shield,
  Download,
  Eye,
  UserCheck,
  UserX,
  Ban,
  UserPlus
} from 'lucide-react';

const SchoolDetailsPage = () => {
  const params = useParams();
  const schoolId = params.id;
  
  const [school, setSchool] = useState(null);
  const [users, setUsers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (schoolId) {
      fetchSchoolDetails();
    }
  }, [schoolId]);

  const fetchSchoolDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/protected/headadmin/schools/${schoolId}`);
      
      if (response.ok) {
        const data = await response.json();
        setSchool(data.school);
        setUsers(data.users || []);
        setInvoices(data.invoices || []);
        setStats(data.stats || {});
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load school details');
      }
    } catch (error) {
      console.error('Failed to fetch school details:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSchoolAction = async (action) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/protected/headadmin/schools/${schoolId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchSchoolDetails(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} school`);
      }
    } catch (error) {
      console.error(`Failed to ${action} school:`, error);
      setError('Network error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      const response = await fetch(`/api/protected/headadmin/users/${userId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchSchoolDetails(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      setError('Network error occurred');
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive) => {
    if (isActive) {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="w-4 h-4 mr-2" />
          ACTIVE
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border border-red-200">
        <XCircle className="w-4 h-4 mr-2" />
        SUSPENDED
      </span>
    );
  };

  const getSubscriptionBadge = (school) => {
    if (!school) return null;
    
    if (school.subscriptionIsActive) {
      return (
        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
          PREMIUM
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border border-yellow-200">
        <Clock className="w-4 h-4 mr-2" />
        TRIAL
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const roleConfig = {
      admin: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
      teacher: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
      student: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' }
    };

    const config = roleConfig[role] || roleConfig.student;
    return (
      <span className={`px-2 py-1 text-xs font-bold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
        {role.toUpperCase()}
      </span>
    );
  };

  const getInvoiceStatusBadge = (status) => {
    const statusConfig = {
      paid: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200', icon: CheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200', icon: Clock },
      overdue: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200', icon: AlertTriangle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-bold rounded-full ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.toUpperCase()}
      </span>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'users', label: `Users (${users.length})`, icon: Users },
    { id: 'billing', label: `Invoices (${invoices.length})`, icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading school details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Error Loading School
          </h2>
          <p className="text-gray-600 mb-6 text-lg">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 border-2 border-gray-300/50 text-gray-700 rounded-xl hover:bg-gray-50/50 hover:border-gray-400/50 transition-all duration-200 font-medium"
            >
              Go Back
            </button>
            <button
              onClick={fetchSchoolDetails}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 hover:scale-105 hover:shadow-lg font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg">School not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => window.history.back()}
                className="p-3 hover:bg-blue-100/50 rounded-xl transition-colors group"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
              </button>
              
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{school.name}</h1>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-gray-600">{school.slug}</p>
                    {getStatusBadge(school.isActive)}
                    {getSubscriptionBadge(school)}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = `/protected/headadmin/messages?school=${school.id}`}
                className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-xl hover:from-blue-200 hover:to-purple-200 transition-all duration-300 hover:scale-105"
                title="Send Message"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              
              <button
                onClick={fetchSchoolDetails}
                className="p-3 bg-gradient-to-r from-gray-100 to-blue-100 text-gray-700 rounded-xl hover:from-gray-200 hover:to-blue-200 transition-all duration-300 hover:scale-105"
                title="Refresh"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              {school.isActive ? (
                <button
                  onClick={() => handleSchoolAction('suspend')}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4" />
                  )}
                  Suspend School
                </button>
              ) : (
                <button
                  onClick={() => handleSchoolAction('activate')}
                  disabled={actionLoading}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Activate School
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.users?.total || 0}</p>
                <p className="text-sm text-gray-500 mt-1">{stats.users?.active || 0} active</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/70 to-emerald-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue</p>
                <p className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(stats.billing?.totalRevenue || 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">{stats.billing?.paidInvoices || 0} paid invoices</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Students</p>
                <p className="text-3xl font-bold text-purple-600">{stats.users?.students || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Max: {school.maxStudents}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white/70 to-orange-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Teachers</p>
                <p className="text-3xl font-bold text-orange-600">{stats.users?.teachers || 0}</p>
                <p className="text-sm text-gray-500 mt-1">Max: {school.maxTeachers}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 font-medium text-sm whitespace-nowrap transition-all duration-200 border-b-2 ${
                    activeTab === tab.id
                      ? 'border-blue-500 bg-gradient-to-r from-blue-50/50 to-purple-50/50 text-blue-700'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* School Information */}
              <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-blue-600" />
                  School Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                    <Building2 className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Name</p>
                      <p className="text-gray-900 font-semibold">{school.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                    <Globe className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Slug</p>
                      <p className="text-gray-900 font-semibold">{school.slug}</p>
                    </div>
                  </div>
                  {school.email && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Email</p>
                        <p className="text-gray-900 font-semibold">{school.email}</p>
                      </div>
                    </div>
                  )}
                  {school.phone && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Phone</p>
                        <p className="text-gray-900 font-semibold">{school.phone}</p>
                      </div>
                    </div>
                  )}
                  {school.address && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                      <MapPin className="w-5 h-5 text-gray-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">Address</p>
                        <p className="text-gray-900 font-semibold">{school.address}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl">
                    <Calendar className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-600">Created</p>
                      <p className="text-gray-900 font-semibold">{formatDate(school.createdAt)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Details */}
              <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                  Subscription Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl">
                    <span className="text-gray-600">Status</span>
                    {getSubscriptionBadge(school)}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl">
                    <span className="text-gray-600">Max Students</span>
                    <span className="font-semibold text-gray-900">{school.maxStudents}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl">
                    <span className="text-gray-600">Max Teachers</span>
                    <span className="font-semibold text-gray-900">{school.maxTeachers}</span>
                  </div>
                  {school.subscriptionEndDate && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50/50 to-blue-50/50 rounded-xl">
                      <span className="text-gray-600">Expires</span>
                      <span className="font-semibold text-gray-900">{formatDate(school.subscriptionEndDate)}</span>
                    </div>
                  )}
                  {school.trialEndDate && (
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-xl">
                      <span className="text-gray-600">Trial Ends</span>
                      <span className="font-semibold text-gray-900">{formatDate(school.trialEndDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="lg:col-span-2 bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                  Usage Overview
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="w-6 h-6 text-blue-600" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{((stats.users?.students || 0) / school.maxStudents * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Student Capacity</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{((stats.users?.teachers || 0) / school.maxTeachers * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Teacher Capacity</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">{stats.users?.active || 0}</p>
                    <p className="text-sm text-gray-600">Active Users</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-xl">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <DollarSign className="w-6 h-6 text-orange-600" />
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(stats.billing?.totalRevenue || 0)}</p>
                    <p className="text-sm text-gray-600">Total Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200/50">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                  <Users className="w-6 h-6 text-blue-600" />
                  School Users ({users.length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/50 to-blue-50/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">User</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Role</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Joined</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Last Active</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                              <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No users found</p>
                            <p className="text-gray-400 text-sm">Users will appear here once they join the school</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {user.firstName?.charAt(0) || user.email?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                </p>
                                <p className="text-sm text-gray-600">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getRoleBadge(user.role)}
                          </td>
                          <td className="px-6 py-4">
                            {user.isActive ? (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-700 border border-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                ACTIVE
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700 border border-red-200">
                                <XCircle className="w-3 h-3 mr-1" />
                                SUSPENDED
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.location.href = `/protected/headadmin/users/${user.id}`}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                              </button>
                              {user.isActive ? (
                                <button
                                  onClick={() => handleUserAction(user.id, 'suspend')}
                                  className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                                  title="Suspend User"
                                >
                                  <UserX className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUserAction(user.id, 'activate')}
                                  className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                                  title="Activate User"
                                >
                                  <UserCheck className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-gradient-to-br from-white/70 to-green-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-200/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                    <CreditCard className="w-6 h-6 text-green-600" />
                    Billing & Invoices ({invoices.length})
                  </h3>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.billing?.totalRevenue || 0)}</p>
                      <p className="text-gray-600">Total Revenue</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{stats.billing?.paidInvoices || 0}</p>
                      <p className="text-gray-600">Paid Invoices</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-50/50 to-green-50/50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Invoice ID</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Amount</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Status</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Created</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Due Date</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-900">Paid Date</th>
                      <th className="text-right px-6 py-4 text-sm font-semibold text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {invoices.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-12 text-center">
                          <div className="flex flex-col items-center justify-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                              <CreditCard className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No invoices found</p>
                            <p className="text-gray-400 text-sm">Billing information will appear here</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-green-50/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-mono text-sm font-semibold text-gray-900">
                              #{invoice.id.slice(-8)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">
                              {formatCurrency(invoice.amount)}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getInvoiceStatusBadge(invoice.status)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {formatDate(invoice.createdAt)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {invoice.dueDate ? formatDate(invoice.dueDate) : '-'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {invoice.paidAt ? formatDate(invoice.paidAt) : '-'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => window.location.href = `/protected/headadmin/invoices/${invoice.id}`}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors group"
                                title="View Invoice"
                              >
                                <Eye className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                              </button>
                              <button
                                onClick={() => window.location.href = `/protected/headadmin/invoices/${invoice.id}/download`}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors group"
                                title="Download PDF"
                              >
                                <Download className="w-4 h-4 text-gray-600 group-hover:text-green-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* School Settings */}
              <div className="bg-gradient-to-br from-white/70 to-red-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Shield className="w-6 h-6 text-red-600" />
                  School Management
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 rounded-xl border border-red-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Account Status</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {school.isActive ? 'School is currently active and operational' : 'School is suspended and cannot be accessed'}
                        </p>
                      </div>
                      {school.isActive ? (
                        <button
                          onClick={() => handleSchoolAction('suspend')}
                          disabled={actionLoading}
                          className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Pause className="w-4 h-4" />
                          )}
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSchoolAction('activate')}
                          disabled={actionLoading}
                          className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                        >
                          {actionLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Activate
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-yellow-50/50 to-orange-50/50 rounded-xl border border-yellow-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Reset School Data</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Clear all school data including users, classes, and content
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to reset all school data? This action cannot be undone.')) {
                            handleSchoolAction('reset');
                          }
                        }}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Reset Data
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-gray-50/50 to-red-50/50 rounded-xl border border-red-300/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Delete School</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Permanently delete this school and all associated data
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to permanently delete this school? This action cannot be undone.')) {
                            handleSchoolAction('delete');
                          }
                        }}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Management */}
              <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Subscription Management
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl border border-blue-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Current Plan</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {school.subscriptionIsActive ? 'Premium subscription' : 'Trial period'}
                        </p>
                      </div>
                      {getSubscriptionBadge(school)}
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-green-50/50 to-emerald-50/50 rounded-xl border border-green-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Extend Trial</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Add additional trial days for this school
                        </p>
                      </div>
                      <button
                        onClick={() => handleSchoolAction('extend-trial')}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        <Calendar className="w-4 h-4" />
                        Extend Trial
                      </button>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">Upgrade Limits</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Increase student and teacher limits
                        </p>
                      </div>
                      <button
                        onClick={() => handleSchoolAction('upgrade-limits')}
                        disabled={actionLoading}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Upgrade
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="text-xl font-bold text-gray-900">{stats.users?.students || 0} / {school.maxStudents}</p>
                    </div>
                    <div className="p-3 bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-lg text-center">
                      <p className="text-sm text-gray-600">Teachers</p>
                      <p className="text-xl font-bold text-gray-900">{stats.users?.teachers || 0} / {school.maxTeachers}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailsPage;