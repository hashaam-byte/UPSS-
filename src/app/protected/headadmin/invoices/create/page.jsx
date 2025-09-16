'use client'
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Calculator, 
  Building2, 
  Users, 
  Calendar, 
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Search,
  User
} from 'lucide-react';

const CreateInvoicePage = () => {
  const [schools, setSchools] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [invoiceData, setInvoiceData] = useState({
    schoolId: '',
    billingPeriod: new Date().toISOString().slice(0, 7), // YYYY-MM format
    description: '',
    dueDate: '',
    customAmount: '',
    useCustomAmount: false
  });

  const [calculatedData, setCalculatedData] = useState({
    studentCount: 0,
    teacherCount: 0,
    adminCount: 0,
    totalUsers: 0,
    pricePerUser: 250,
    flatRateThreshold: 600,
    flatRatePrice: 200000,
    calculatedAmount: 0,
    usesFlatRate: false
  });

  useEffect(() => {
    fetchSchools();
    setInvoiceData(prev => ({
      ...prev,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 30 days from now
    }));
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      fetchSchoolUserCount(selectedSchool.id);
    }
  }, [selectedSchool]);

  useEffect(() => {
    calculateAmount();
  }, [calculatedData.totalUsers, calculatedData.pricePerUser, calculatedData.flatRateThreshold, calculatedData.flatRatePrice]);

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
      setError('Failed to load schools');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchoolUserCount = async (schoolId) => {
    try {
      const response = await fetch(`/api/protected/headadmin/schools/${schoolId}/user-count`);
      if (response.ok) {
        const data = await response.json();
        setCalculatedData(prev => ({
          ...prev,
          studentCount: data.studentCount || 0,
          teacherCount: data.teacherCount || 0,
          adminCount: data.adminCount || 0,
          totalUsers: (data.studentCount || 0) + (data.teacherCount || 0) + (data.adminCount || 0)
        }));
      }
    } catch (error) {
      console.error('Failed to fetch user count:', error);
    }
  };

  const calculateAmount = () => {
    const { totalUsers, pricePerUser, flatRateThreshold, flatRatePrice } = calculatedData;
    
    if (totalUsers === 0) {
      setCalculatedData(prev => ({ ...prev, calculatedAmount: 0, usesFlatRate: false }));
      return;
    }

    if (totalUsers > flatRateThreshold) {
      setCalculatedData(prev => ({ ...prev, calculatedAmount: flatRatePrice, usesFlatRate: true }));
    } else {
      setCalculatedData(prev => ({ ...prev, calculatedAmount: totalUsers * pricePerUser, usesFlatRate: false }));
    }
  };

  const handleSchoolSelect = (school) => {
    setSelectedSchool(school);
    setInvoiceData(prev => ({
      ...prev,
      schoolId: school.id,
      description: `Monthly subscription for ${school.name} - ${prev.billingPeriod}`
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSchool) {
      setError('Please select a school');
      return;
    }

    if (!invoiceData.billingPeriod || !invoiceData.dueDate) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const finalAmount = invoiceData.useCustomAmount 
        ? parseFloat(invoiceData.customAmount) 
        : calculatedData.calculatedAmount;

      const payload = {
        schoolId: selectedSchool.id,
        billingPeriod: invoiceData.billingPeriod,
        description: invoiceData.description || `Monthly subscription for ${selectedSchool.name} - ${invoiceData.billingPeriod}`,
        dueDate: invoiceData.dueDate,
        amount: finalAmount,
        studentCount: calculatedData.studentCount,
        teacherCount: calculatedData.teacherCount,
        adminCount: calculatedData.adminCount
      };

      const response = await fetch('/api/protected/headadmin/invoices/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess('Invoice created successfully! Redirecting...');
        setTimeout(() => {
          window.location.href = `/protected/headadmin/invoices/${data.invoice.id}`;
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setError('Network error occurred. Please try again.');
    } finally {
      setCreating(false);
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

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-3 hover:bg-blue-100/50 rounded-xl transition-colors group"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600 group-hover:text-blue-600" />
            </button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Generate Invoice
              </h1>
              <p className="text-gray-600 text-lg mt-2">Create a new invoice for school subscription</p>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center text-green-700 shadow-lg">
            <CheckCircle className="w-5 h-5 mr-3" />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center text-red-700 shadow-lg">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* School Selection */}
          <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Select School</h2>
              </div>
            </div>

            <div className="p-8">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search schools..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 pr-4 py-3 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium transition-all duration-200"
                  />
                </div>
              </div>

              {/* Selected School Display */}
              {selectedSchool && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-xl border border-blue-200/50">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                      <Building2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{selectedSchool.name}</h3>
                      <p className="text-sm text-gray-600">{selectedSchool.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {setSelectedSchool(null); setInvoiceData(prev => ({...prev, schoolId: ''}))}}
                      className="ml-auto text-red-500 hover:text-red-700 px-3 py-1 text-sm font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}

              {/* School List */}
              {!selectedSchool && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {filteredSchools.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 font-medium">No schools found</p>
                    </div>
                  ) : (
                    filteredSchools.map((school) => (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => handleSchoolSelect(school)}
                        className="w-full p-4 text-left hover:bg-blue-50/50 rounded-xl transition-colors duration-200 border border-gray-200/50 hover:border-blue-300/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate">{school.name}</p>
                            <p className="text-sm text-gray-600 truncate">{school.email}</p>
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              school.isActive 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {school.isActive ? 'ACTIVE' : 'SUSPENDED'}
                            </span>
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Count & Pricing */}
          {selectedSchool && (
            <div className="bg-gradient-to-br from-white/70 to-emerald-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <Calculator className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Pricing Calculation</h2>
                </div>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                  <div className="text-center p-4 bg-gradient-to-r from-blue-50/50 to-cyan-50/50 rounded-xl border border-blue-200/50">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{calculatedData.studentCount}</p>
                    <p className="text-sm text-gray-600">Students</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-200/50">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{calculatedData.teacherCount}</p>
                    <p className="text-sm text-gray-600">Teachers</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-orange-50/50 to-red-50/50 rounded-xl border border-orange-200/50">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{calculatedData.adminCount}</p>
                    <p className="text-sm text-gray-600">Admins</p>
                  </div>
                  
                  <div className="text-center p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200/50">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{calculatedData.totalUsers}</p>
                    <p className="text-sm text-gray-600">Total Users</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-gray-50/50 to-blue-50/50 rounded-xl p-6 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Pricing Breakdown</h3>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-500" />
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(calculatedData.calculatedAmount)}
                      </span>
                    </div>
                  </div>
                  
                  {calculatedData.usesFlatRate ? (
                    <div className="text-sm text-gray-600">
                      <p><strong>Flat Rate Applied:</strong> {calculatedData.totalUsers} users exceeds {calculatedData.flatRateThreshold} threshold</p>
                      <p>Fixed monthly rate: {formatCurrency(calculatedData.flatRatePrice)}</p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-600">
                      <p><strong>Per-User Pricing:</strong> {calculatedData.totalUsers} users × {formatCurrency(calculatedData.pricePerUser)} per user</p>
                      <p>Total: {formatCurrency(calculatedData.calculatedAmount)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          {selectedSchool && (
            <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Invoice Details</h2>
                </div>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Billing Period <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      value={invoiceData.billingPeriod}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, billingPeriod: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={invoiceData.dueDate}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={invoiceData.description}
                    onChange={(e) => setInvoiceData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm resize-none"
                    placeholder="Monthly subscription for..."
                  />
                </div>

                {/* Custom Amount Option */}
                <div className="border-t border-gray-200/50 pt-6">
                  <label className="flex items-center p-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 rounded-xl border border-purple-200/50 hover:border-purple-300/50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={invoiceData.useCustomAmount}
                      onChange={(e) => setInvoiceData(prev => ({ ...prev, useCustomAmount: e.target.checked }))}
                      className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-700">Use custom amount instead of calculated amount</span>
                  </label>

                  {invoiceData.useCustomAmount && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Amount (₦) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={invoiceData.customAmount}
                        onChange={(e) => setInvoiceData(prev => ({ ...prev, customAmount: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/50 backdrop-blur-sm"
                        placeholder="Enter custom amount"
                        min="0"
                        step="0.01"
                        required={invoiceData.useCustomAmount}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          {selectedSchool && (
            <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left">
                  <p className="text-sm text-gray-600">Invoice Amount</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {invoiceData.useCustomAmount && invoiceData.customAmount
                      ? formatCurrency(parseFloat(invoiceData.customAmount))
                      : formatCurrency(calculatedData.calculatedAmount)
                    }
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="px-6 py-3 border-2 border-gray-300/50 text-gray-700 rounded-xl hover:bg-gray-50/50 hover:border-gray-400/50 transition-all duration-200 font-medium"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    disabled={creating || !selectedSchool}
                    className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {creating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                        <span className="relative z-10">Creating Invoice...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 relative z-10" />
                        <span className="relative z-10">Generate Invoice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </form>