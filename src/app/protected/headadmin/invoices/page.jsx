'use client'
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Download, 
  CreditCard, 
  DollarSign, 
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Plus,
  Mail,
  MoreVertical,
  FileText,
  TrendingUp,
  Banknote,
  Receipt
} from 'lucide-react';

const InvoicesBillingPage = () => {
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    paidInvoices: 0,
    overdueInvoices: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, []);

  useEffect(() => {
    filterInvoices();
  }, [invoices, searchTerm, statusFilter, periodFilter, sortBy]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/headadmin/invoices');
      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/protected/headadmin/invoices/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats || {});
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const filterInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice =>
        invoice.school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Period filter
    if (periodFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (periodFilter) {
        case 'this_month':
          filterDate.setMonth(now.getMonth());
          break;
        case 'last_month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'this_quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
        default:
          break;
      }
      
      filtered = filtered.filter(invoice => 
        new Date(invoice.createdAt) >= filterDate
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'amount_asc':
          return parseFloat(a.amount) - parseFloat(b.amount);
        case 'amount_desc':
          return parseFloat(b.amount) - parseFloat(a.amount);
        case 'due_date_asc':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'due_date_desc':
          return new Date(b.dueDate) - new Date(a.dueDate);
        case 'created_asc':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'created_desc':
          return new Date(b.createdAt) - new Date(a.createdAt);
        default:
          return 0;
      }
    });

    setFilteredInvoices(filtered);
  };

  const handleInvoiceAction = async (invoiceId, action) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/protected/headadmin/invoices/${invoiceId}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchInvoices();
        await fetchStats();
        setShowActionMenu(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} invoice:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (invoice) => {
    const statusConfig = {
      paid: {
        bg: 'bg-gradient-to-r from-emerald-50 to-green-50',
        text: 'text-emerald-700',
        border: 'border-emerald-200',
        icon: CheckCircle
      },
      pending: {
        bg: 'bg-gradient-to-r from-yellow-50 to-amber-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        icon: Clock
      },
      overdue: {
        bg: 'bg-gradient-to-r from-red-50 to-pink-50',
        text: 'text-red-700',
        border: 'border-red-200',
        icon: AlertTriangle
      },
      cancelled: {
        bg: 'bg-gradient-to-r from-gray-50 to-slate-50',
        text: 'text-gray-700',
        border: 'border-gray-200',
        icon: XCircle
      }
    };

    const config = statusConfig[invoice.status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-3 h-3 mr-1" />
        {invoice.status.toUpperCase()}
      </span>
    );
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

  const StatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo, trend }) => (
    <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm p-6 rounded-2xl shadow-lg border border-white/50 hover:scale-[1.02] transition-all duration-300">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600 font-medium">{trend}% vs last month</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-xl flex items-center justify-center shadow-lg`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
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
          <p className="text-gray-600 mt-4 font-medium">Loading invoices...</p>
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
                Invoices & Billing
              </h1>
              <p className="text-gray-600 text-lg">
                Manage subscriptions, invoices, and revenue tracking
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => fetchInvoices()}
                className="group relative overflow-hidden bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => window.location.href = '/protected/headadmin/invoices/create'}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <Plus className="w-4 h-4 relative z-10" />
                <span className="relative z-10">Generate Invoice</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue || 0)}
            icon={DollarSign}
            gradientFrom="from-emerald-500"
            gradientTo="to-teal-500"
            trend={12}
          />
          <StatCard
            title="Pending Amount"
            value={formatCurrency(stats.pendingAmount || 0)}
            icon={Clock}
            gradientFrom="from-yellow-500"
            gradientTo="to-orange-500"
          />
          <StatCard
            title="Paid Invoices"
            value={stats.paidInvoices || 0}
            icon={CheckCircle}
            gradientFrom="from-blue-500"
            gradientTo="to-cyan-500"
          />
          <StatCard
            title="Overdue"
            value={stats.overdueInvoices || 0}
            icon={AlertTriangle}
            gradientFrom="from-red-500"
            gradientTo="to-pink-500"
          />
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by school name, invoice number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 w-full border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium transition-all duration-200"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium min-w-32"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium min-w-36"
              >
                <option value="all">All Periods</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
                <option value="this_quarter">This Quarter</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300/50 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm font-medium min-w-40"
              >
                <option value="created_desc">Newest First</option>
                <option value="created_asc">Oldest First</option>
                <option value="amount_desc">Highest Amount</option>
                <option value="amount_asc">Lowest Amount</option>
                <option value="due_date_asc">Due Date (Soon)</option>
                <option value="due_date_desc">Due Date (Later)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
          {filteredInvoices.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Receipt className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium text-lg">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No invoices found matching your criteria'
                  : 'No invoices generated yet'
                }
              </p>
              <p className="text-gray-400 text-sm mt-2">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Invoices will appear here once generated'
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
                        Invoice Details
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        School
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200/50">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-blue-50/30 transition-colors duration-200 group">
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <FileText className="w-6 h-6 text-white" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-bold text-gray-900 text-lg">
                                {invoice.invoiceNumber}
                              </div>
                              <div className="text-sm text-gray-500">
                                {invoice.billingPeriod} • {invoice.description || 'Monthly subscription'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {invoice.school?.name || ''}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          <div className="text-sm font-bold text-gray-900 text-lg">
                            {formatCurrency(invoice.amount)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {invoice.studentCount + invoice.teacherCount} users
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap">
                          {getStatusBadge(invoice)}
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {formatDate(invoice.dueDate)}
                          </div>
                        </td>
                        <td className="px-6 py-6 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={() => setShowActionMenu(showActionMenu === invoice.id ? null : invoice.id)}
                              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                              disabled={actionLoading}
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                            
                            {showActionMenu === invoice.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200/50 z-10 backdrop-blur-sm overflow-hidden">
                                <div className="py-2">
                                  <button
                                    onClick={() => window.location.href = `/protected/headadmin/invoices/${invoice.id}`}
                                    className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 w-full text-left font-medium transition-colors"
                                  >
                                    <Eye className="w-4 h-4 mr-3" />
                                    View Details
                                  </button>
                                  
                                  {invoice.status === 'pending' && (
                                    <button
                                      onClick={() => handleInvoiceAction(invoice.id, 'mark-paid')}
                                      className="flex items-center px-4 py-3 text-sm text-green-700 hover:bg-green-50 w-full text-left font-medium transition-colors"
                                      disabled={actionLoading}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-3" />
                                      Mark as Paid
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => window.open(`/api/protected/headadmin/invoices/${invoice.id}/download`, '_blank')}
                                    className="flex items-center px-4 py-3 text-sm text-purple-700 hover:bg-purple-50 w-full text-left font-medium transition-colors"
                                  >
                                    <Download className="w-4 h-4 mr-3" />
                                    Download PDF
                                  </button>
                                  
                                  <button
                                    onClick={() => window.location.href = `/protected/headadmin/messages?school=${invoice.schoolId}`}
                                    className="flex items-center px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 w-full text-left font-medium transition-colors"
                                  >
                                    <Mail className="w-4 h-4 mr-3" />
                                    Send Message
                                  </button>
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
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="p-6 hover:bg-blue-50/30 transition-colors duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                          <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900 text-lg">{invoice.invoiceNumber}</h3>
                          <p className="text-sm text-gray-500">{invoice.school?.name}</p>
                        </div>
                      </div>
                      {getStatusBadge(invoice)}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Due Date</p>
                        <p className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => window.location.href = `/protected/headadmin/invoices/${invoice.id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        View Details
                      </button>
                      
                      {invoice.status === 'pending' && (
                        <button
                          onClick={() => handleInvoiceAction(invoice.id, 'mark-paid')}
                          className="text-green-600 hover:text-green-700 text-sm font-bold px-3 py-1 rounded-lg hover:bg-green-50 transition-colors"
                          disabled={actionLoading}
                        >
                          Mark Paid
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

export default InvoicesBillingPage;