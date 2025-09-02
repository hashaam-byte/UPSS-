'use client'
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  CreditCard, 
  FileText, 
  Download, 
  Eye,
  Send,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  Calendar,
  Printer,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  BarChart3
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from 'recharts';

const HeadAdminBilling = () => {
  const [dateRange, setDateRange] = useState('30d');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Mock data
  const revenueData = [
    { month: 'Jan', revenue: 1850000, subscriptions: 35, refunds: 25000 },
    { month: 'Feb', revenue: 2100000, subscriptions: 38, refunds: 15000 },
    { month: 'Mar', revenue: 1950000, subscriptions: 41, refunds: 30000 },
    { month: 'Apr', revenue: 2300000, subscriptions: 43, refunds: 20000 },
    { month: 'May', revenue: 2150000, subscriptions: 45, refunds: 10000 },
    { month: 'Jun', revenue: 2450000, subscriptions: 47, refunds: 5000 },
  ];

  const invoices = [
    {
      id: 'INV-2024-001',
      schoolName: 'Rainbow College',
      amount: 112500,
      status: 'PAID',
      dueDate: '2024-09-15',
      paidDate: '2024-09-01',
      term: '2024-T2',
      students: 445,
      teachers: 27,
      plan: 'Premium'
    },
    {
      id: 'INV-2024-002',
      schoolName: 'Future Leaders Academy',
      amount: 80000,
      status: 'PENDING',
      dueDate: '2024-09-20',
      paidDate: null,
      term: '2024-T2',
      students: 320,
      teachers: 22,
      plan: 'Basic'
    },
    {
      id: 'INV-2024-003',
      schoolName: 'Excellence High School',
      amount: 68750,
      status: 'OVERDUE',
      dueDate: '2024-08-30',
      paidDate: null,
      term: '2024-T2',
      students: 275,
      teachers: 17,
      plan: 'Basic'
    },
    {
      id: 'INV-2024-004',
      schoolName: 'Green Valley International',
      amount: 170000,
      status: 'PAID',
      dueDate: '2024-09-10',
      paidDate: '2024-08-28',
      term: '2024-T2',
      students: 680,
      teachers: 45,
      plan: 'Enterprise'
    }
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PAID': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'PENDING': return <Clock size={16} className="text-yellow-600" />;
      case 'OVERDUE': return <AlertTriangle size={16} className="text-red-600" />;
      case 'CANCELLED': return <XCircle size={16} className="text-gray-600" />;
      default: return null;
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' || invoice.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const totalRevenue = revenueData.reduce((sum, item) => sum + item.revenue, 0);
  const totalPaid = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.amount, 0);
  const totalPending = invoices.filter(inv => inv.status === 'PENDING').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
            Billing & Revenue
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Monitor revenue, manage invoices, and track payments
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
            <Calendar className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          </div>
          <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2">
            <Download size={18} />
            Export Report
          </button>
        </div>
      </div>

      {/* Revenue KPIs */}
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
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalRevenue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 6 months</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-xl">
              <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
            </div>
            <div className="flex items-center text-green-500 text-sm font-medium">
              <ArrowUpRight size={16} />
              <span className="ml-1">Collected</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Paid Invoices</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{invoices.filter(inv => inv.status === 'PAID').length} invoices</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
              <Clock className="text-yellow-600 dark:text-yellow-400" size={24} />
            </div>
            <div className="flex items-center text-yellow-500 text-sm font-medium">
              <Clock size={16} />
              <span className="ml-1">Pending</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Pending Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{invoices.filter(inv => inv.status === 'PENDING').length} invoices</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
            <div className="flex items-center text-red-500 text-sm font-medium">
              <ArrowDownLeft size={16} />
              <span className="ml-1">Overdue</span>
            </div>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Overdue Amount</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{formatCurrency(totalOverdue)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{invoices.filter(inv => inv.status === 'OVERDUE').length} invoices</p>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Revenue Trend</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-300">Revenue</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
              <span className="text-gray-600 dark:text-gray-300">Subscriptions</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart data={revenueData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis dataKey="month" stroke="#6B7280" />
            <YAxis stroke="#6B7280" tickFormatter={(value) => `₦${(value/1000000).toFixed(1)}M`} />
            <Tooltip 
              formatter={(value, name) => [
                name === 'revenue' ? formatCurrency(value) : value,
                name === 'revenue' ? 'Revenue' : 'Subscriptions'
              ]}
              labelStyle={{ color: '#1F2937' }}
              contentStyle={{ 
                backgroundColor: '#F9FAFB', 
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
              }}
            />
            <Area 
              type="monotone" 
              dataKey="revenue" 
              stroke="#06d6a0"
              fill="url(#revenueGradient)"
              strokeWidth={3}
            />
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06d6a0" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#06d6a0" stopOpacity={0.05} />
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Invoices Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Invoices</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="OVERDUE">Overdue</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 flex items-center gap-2">
                <Plus size={18} />
                Generate Invoice
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Invoice</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">School</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Due Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.id}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.term}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{invoice.schoolName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{invoice.plan} Plan</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(invoice.status)}
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    {invoice.paidDate && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Paid: {invoice.paidDate}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{invoice.dueDate}</div>
                    {invoice.status === 'OVERDUE' && (
                      <div className="text-xs text-red-500">
                        {Math.ceil((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))} days overdue
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div className="flex flex-col">
                      <span>{invoice.students} students</span>
                      <span className="text-xs text-gray-500">{invoice.teachers} teachers</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-lg transition-all">
                        <Download size={16} />
                      </button>
                      {invoice.status === 'PENDING' && (
                        <button className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-all">
                          <Send size={16} />
                        </button>
                      )}
                      <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No invoices found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterStatus !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'No invoices have been generated yet.'}
            </p>
          </div>
        )}
      </div>

      {/* Payment Methods & Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Methods</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-green-600 dark:text-green-400" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Flutterwave</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Primary payment gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Paystack</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Secondary payment gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-slate-600 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-900/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-gray-600 dark:text-gray-400" size={20} />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Bank Transfer</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manual bank transfers</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Manual</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-600">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Auto-generate invoices</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Automatically create invoices at term start</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-600">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Send payment reminders</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email reminders for overdue invoices</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2">
                <span className="inline-block h-4 w-4 translate-x-6 rounded-full bg-white transition-transform" />
              </button>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-slate-600">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Grace period</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Days before suspending overdue accounts</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                <option>7 days</option>
                <option>14 days</option>
                <option>30 days</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Currency</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Default billing currency</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                <option>Nigerian Naira (₦)</option>
                <option>US Dollar ($)</option>
                <option>Euro (€)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeadAdminBilling;