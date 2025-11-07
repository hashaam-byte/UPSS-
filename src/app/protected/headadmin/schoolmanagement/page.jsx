'use client'
import React, { useState, useEffect } from 'react';
import { 
  School as SchoolIcon,
  Search,
  Calendar,
  Settings,
  Clock,
  CheckCircle,
  AlertTriangle,
  X,
  Save,
  Loader2,
  Users,
  Edit3,
  Eye,
  Activity,
  Filter,
  RefreshCw,
  Building,
  CalendarDays,
  Repeat
} from 'lucide-react';

const HeadAdminSchoolManagement = () => {
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // New state for scheduling options
  const [scheduleMode, setScheduleMode] = useState('days'); // 'days' or 'exact'
  const [customDays, setCustomDays] = useState('');
  const [exactDate, setExactDate] = useState('');
  const [exactTime, setExactTime] = useState('23:59');
  const [recurringMonths, setRecurringMonths] = useState('');

  useEffect(() => {
    fetchSchools();
  }, [currentPage, searchQuery, filterStatus]);

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchQuery && { search: searchQuery }),
        ...(filterStatus !== 'all' && { status: filterStatus })
      });

      const response = await fetch(`/api/protected/headadmin/schools?${params}`);
      const data = await response.json();

      if (response.ok) {
        setSchools(data.schools || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch schools');
      }
    } catch (error) {
      console.error('Error fetching schools:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPaymentSchedule = (school) => {
    setSelectedSchool(school);
    setScheduleMode('days');
    setCustomDays(school.customNextPaymentDays?.toString() || '');
    setRecurringMonths(school.recurringPaymentMonths?.toString() || '');
    
    // Set exact date to current expiry
    const expiryDate = new Date(school.subscriptionExpiresAt);
    setExactDate(expiryDate.toISOString().split('T')[0]);
    setExactTime(expiryDate.toTimeString().slice(0, 5));
    
    setShowEditModal(true);
    setError('');
  };

  const handleSavePaymentSchedule = async () => {
    if (!selectedSchool) return;

    let payload = {
      recurringMonths: recurringMonths ? parseInt(recurringMonths) : null
    };

    if (scheduleMode === 'exact') {
      if (!exactDate) {
        setError('Please select an expiry date');
        return;
      }
      
      // Combine date and time
      const dateTimeString = `${exactDate}T${exactTime}:00`;
      const selectedDateTime = new Date(dateTimeString);
      
      if (isNaN(selectedDateTime.getTime())) {
        setError('Invalid date or time format');
        return;
      }

      // Check if date is in the past
      if (selectedDateTime < new Date()) {
        setError('Expiry date cannot be in the past');
        return;
      }

      payload.exactExpiryDate = selectedDateTime.toISOString();
    } else {
      const days = parseInt(customDays);
      if (isNaN(days) || days < 1 || days > 3650) {
        setError('Please enter a valid number of days between 1 and 3650');
        return;
      }
      payload.customNextPaymentDays = days;
    }

    // Validate recurring months if provided
    if (recurringMonths) {
      const months = parseInt(recurringMonths);
      if (isNaN(months) || months < 1 || months > 120) {
        setError('Recurring months must be between 1 and 120');
        return;
      }
    }

    try {
      setIsLoading(true);
      const response = await fetch(`/api/protected/headadmin/schools/${selectedSchool.id}/payment-schedule`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`Payment schedule updated successfully for ${selectedSchool.name}`);
        setShowEditModal(false);
        setSelectedSchool(null);
        resetForm();
        fetchSchools();
      } else {
        setError(data.error || 'Failed to update payment schedule');
      }
    } catch (error) {
      console.error('Error updating payment schedule:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setCustomDays('');
    setExactDate('');
    setExactTime('23:59');
    setRecurringMonths('');
    setScheduleMode('days');
  };

  const getSubscriptionStatus = (school) => {
    const expiresAt = new Date(school.subscriptionExpiresAt);
    const now = new Date();
    const daysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));

    if (!school.subscriptionIsActive) {
      return { text: 'Inactive', color: 'red', icon: AlertTriangle, days: 0 };
    } else if (daysLeft > 30) {
      return { text: 'Active', color: 'emerald', icon: CheckCircle, days: daysLeft };
    } else if (daysLeft > 0) {
      return { text: 'Expiring Soon', color: 'yellow', icon: Clock, days: daysLeft };
    } else {
      return { text: 'Expired', color: 'red', icon: AlertTriangle, days: 0 };
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredCount = (status) => {
    return schools.filter(school => {
      const schoolStatus = getSubscriptionStatus(school);
      if (status === 'active') return schoolStatus.color === 'emerald';
      if (status === 'expiring') return schoolStatus.color === 'yellow';
      if (status === 'expired') return schoolStatus.color === 'red' && schoolStatus.days === 0;
      return true;
    }).length;
  };

  if (isLoading && schools.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl animate-pulse shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Loading Schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-blue-500 animate-pulse" />
                <span className="text-blue-600 font-bold text-sm uppercase tracking-wider">System Administration</span>
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                School Management
              </h1>
              <p className="text-gray-600 text-xl font-medium">
                Configure payment schedules and manage all schools
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchSchools}
                disabled={isLoading}
                className="group relative overflow-hidden bg-white/20 hover:bg-white/30 text-blue-600 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg border border-blue-300/50 flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 to-green-50/90 backdrop-blur-sm border border-emerald-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-emerald-700 font-bold text-lg">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage('')} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 to-pink-50/90 backdrop-blur-sm border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-bold text-lg">{error}</p>
              </div>
              <button onClick={() => setError('')} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-cyan-50/80 p-6 rounded-2xl border border-blue-200/50 shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-gray-800 text-lg">Total Schools</h3>
            </div>
            <p className="text-4xl font-black text-gray-900">{schools.length}</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-green-50/80 p-6 rounded-2xl border border-emerald-200/50 shadow-lg cursor-pointer hover:scale-105 transition-all"
               onClick={() => setFilterStatus('active')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-gray-800 text-lg">Active</h3>
            </div>
            <p className="text-4xl font-black text-gray-900">{getFilteredCount('active')}</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50/80 to-orange-50/80 p-6 rounded-2xl border border-yellow-200/50 shadow-lg cursor-pointer hover:scale-105 transition-all"
               onClick={() => setFilterStatus('expiring')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-gray-800 text-lg">Expiring Soon</h3>
            </div>
            <p className="text-4xl font-black text-gray-900">{getFilteredCount('expiring')}</p>
          </div>

          <div className="relative overflow-hidden bg-gradient-to-br from-red-50/80 to-pink-50/80 p-6 rounded-2xl border border-red-200/50 shadow-lg cursor-pointer hover:scale-105 transition-all"
               onClick={() => setFilterStatus('expired')}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-black text-gray-800 text-lg">Expired</h3>
            </div>
            <p className="text-4xl font-black text-gray-900">{getFilteredCount('expired')}</p>
          </div>
        </div>

        {/* Schools Table */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="p-8">
            {/* Search and Filters */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search schools by name, email, or slug..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/50 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium shadow-lg backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                    filterStatus === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/50 hover:bg-white/80 text-gray-600'
                  }`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilterStatus('active')}
                  className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                    filterStatus === 'active' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white/50 hover:bg-white/80 text-gray-600'
                  }`}
                >
                  Active
                </button>
                <button 
                  onClick={() => setFilterStatus('expiring')}
                  className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-lg ${
                    filterStatus === 'expiring' 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-white/50 hover:bg-white/80 text-gray-600'
                  }`}
                >
                  Expiring
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-bold">Loading schools...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200/50">
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">School</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Contact</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Users</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Subscription</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Next Payment</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Schedule</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schools.map((school) => {
                        const status = getSubscriptionStatus(school);
                        const StatusIcon = status.icon;
                        return (
                          <tr key={school.id} className="border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                  {school.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 text-lg">{school.name}</p>
                                  <p className="text-sm text-gray-500 font-medium">@{school.slug}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <p className="text-sm text-gray-700 font-medium">{school.email}</p>
                                <p className="text-sm text-gray-600">{school.phone}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="font-bold text-gray-900">
                                  {school._count?.users || 0}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-2">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${
                                  status.color === 'emerald' ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300' :
                                  status.color === 'yellow' ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 border border-yellow-300' :
                                  'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-300'
                                }`}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {status.text}
                                </span>
                                {status.days > 0 && (
                                  <p className="text-xs text-gray-600 font-medium">
                                    {status.days} days left
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <p className="text-sm font-bold text-gray-900">
                                  {formatDate(school.subscriptionExpiresAt)}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                  Plan: {school.subscriptionPlan}
                                </p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="font-bold text-gray-900">
                                    {school.customNextPaymentDays || 30} days
                                  </span>
                                </div>
                                {school.recurringPaymentMonths && (
                                  <div className="flex items-center gap-2">
                                    <Repeat className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs text-gray-600 font-medium">
                                      Every {school.recurringPaymentMonths} month{school.recurringPaymentMonths > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleEditPaymentSchedule(school)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-lg"
                                  title="Edit payment schedule"
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <div className="text-sm text-gray-600 font-medium">
                      Page {currentPage} of {totalPages} • {schools.length} schools displayed
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-3 bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-xl transition-all font-bold shadow-lg border border-gray-200/50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-6 py-3 bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-xl transition-all font-bold shadow-lg border border-gray-200/50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Enhanced Edit Payment Schedule Modal */}
        {showEditModal && selectedSchool && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Edit Payment Schedule</h2>
                  <p className="text-gray-600 font-medium">{selectedSchool.name}</p>
                </div>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedSchool(null);
                    resetForm();
                    setError('');
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Current Schedule Info */}
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-black text-gray-900 mb-2">Current Schedule</h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Payment frequency: <span className="font-bold">{selectedSchool.customNextPaymentDays || 30} days</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Next payment due: <span className="font-bold">{formatDate(selectedSchool.subscriptionExpiresAt)}</span>
                      </p>
                      {selectedSchool.recurringPaymentMonths && (
                        <p className="text-sm text-gray-600">
                          Recurring: <span className="font-bold">Every {selectedSchool.recurringPaymentMonths} month{selectedSchool.recurringPaymentMonths > 1 ? 's' : ''}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Schedule Mode Selector */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                    Schedule Type
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setScheduleMode('days')}
                      className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                        scheduleMode === 'days'
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Clock className="w-5 h-5" />
                      Days from Now
                    </button>
                    <button
                      onClick={() => setScheduleMode('exact')}
                      className={`px-6 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                        scheduleMode === 'exact'
                          ? 'bg-purple-600 text-white shadow-lg'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <CalendarDays className="w-5 h-5" />
                      Exact Date & Time
                    </button>
                  </div>
                </div>

                {/* Days Mode */}
                {scheduleMode === 'days' && (
                  <>
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                        Custom Payment Days *
                      </label>
                      <div className="flex gap-3">
                        <input
                          type="number"
                          min="1"
                          max="3650"
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                          placeholder="Enter number of days"
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                        />
                        <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                          <span className="font-bold text-gray-700">days</span>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Set the number of days until the next payment is due (1-3650 days)
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                        Quick Presets
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: '30 Days', value: 30 },
                          { label: '60 Days', value: 60 },
                          { label: '90 Days', value: 90 },
                          { label: '6 Months', value: 180 },
                          { label: '9 Months', value: 270 },
                          { label: '1 Year', value: 365 }
                        ].map((preset) => (
                          <button
                            key={preset.value}
                            onClick={() => setCustomDays(preset.value.toString())}
                            className={`px-4 py-2 rounded-xl font-bold transition-all ${
                              customDays === preset.value.toString()
                                ? 'bg-blue-600 text-white shadow-lg'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Exact Date Mode */}
                {scheduleMode === 'exact' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                          Expiry Date *
                        </label>
                        <input
                          type="date"
                          value={exactDate}
                          onChange={(e) => setExactDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                          Time
                        </label>
                        <input
                          type="time"
                          value={exactTime}
                          onChange={(e) => setExactTime(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                        />
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <p className="text-sm text-purple-700 font-medium">
                        📅 Selected: {exactDate ? new Date(`${exactDate}T${exactTime}`).toLocaleString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'No date selected'}
                      </p>
                    </div>

                    {/* Date Presets */}
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                        Quick Date Presets
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: '1 Month', months: 1 },
                          { label: '3 Months', months: 3 },
                          { label: '6 Months', months: 6 },
                          { label: '9 Months', months: 9 },
                          { label: '1 Year', months: 12 },
                          { label: '2 Years', months: 24 }
                        ].map((preset) => (
                          <button
                            key={preset.months}
                            onClick={() => {
                              const date = new Date();
                              date.setMonth(date.getMonth() + preset.months);
                              setExactDate(date.toISOString().split('T')[0]);
                            }}
                            className="px-4 py-2 rounded-xl font-bold transition-all bg-gray-100 text-gray-700 hover:bg-purple-100 hover:text-purple-700"
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Recurring Payment Schedule */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Repeat className="w-5 h-5 text-purple-600" />
                    <h3 className="text-lg font-black text-gray-900">Recurring Payment Schedule</h3>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                      Renewal Period (Optional)
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={recurringMonths}
                        onChange={(e) => setRecurringMonths(e.target.value)}
                        placeholder="Enter number of months"
                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all font-medium"
                      />
                      <div className="flex items-center px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl">
                        <span className="font-bold text-gray-700">months</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Set how many months between automatic renewals (1-120 months). Leave empty for manual renewal.
                    </p>
                  </div>

                  {/* Recurring Presets */}
                  <div className="mt-4">
                    <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                      Common Periods
                    </label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                      {[
                        { label: '1 Month', value: 1 },
                        { label: '3 Months', value: 3 },
                        { label: '6 Months', value: 6 },
                        { label: '9 Months', value: 9 },
                        { label: '1 Year', value: 12 },
                        { label: '2 Years', value: 24 }
                      ].map((preset) => (
                        <button
                          key={preset.value}
                          onClick={() => setRecurringMonths(preset.value.toString())}
                          className={`px-3 py-2 rounded-xl font-bold transition-all text-sm ${
                            recurringMonths === preset.value.toString()
                              ? 'bg-purple-600 text-white shadow-lg'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {recurringMonths && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                      <p className="text-sm text-green-700 font-medium">
                        ✓ Subscription will automatically renew every {recurringMonths} month{parseInt(recurringMonths) > 1 ? 's' : ''}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedSchool(null);
                      resetForm();
                      setError('');
                    }}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSavePaymentSchedule}
                    disabled={isLoading || (scheduleMode === 'days' && !customDays) || (scheduleMode === 'exact' && !exactDate)}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Schedule
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadAdminSchoolManagement;