'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft,
  Download, 
  CreditCard, 
  DollarSign, 
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Mail,
  FileText,
  User,
  Users,
  GraduationCap,
  MapPin,
  Phone,
  Globe,
  Edit,
  Trash2,
  Send,
  Receipt,
  Eye,
  Copy,
  ExternalLink,
  History,
  Tag,
  Calculator
} from 'lucide-react';

const InvoiceDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);

  useEffect(() => {
    if (params?.id) {
      fetchInvoiceDetails();
      fetchPaymentHistory();
    }
  }, [params?.id]);

  const fetchInvoiceDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/headadmin/invoices/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      } else if (response.status === 404) {
        // Handle 404 - invoice not found
        router.push('/protected/headadmin/invoices?error=invoice-not-found');
      }
    } catch (error) {
      console.error('Failed to fetch invoice details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch(`/api/protected/headadmin/invoices/${params.id}/payments`);
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error('Failed to fetch payment history:', error);
    }
  };

  const handleInvoiceAction = async (action) => {
    try {
      setActionLoading(true);
      const response = await fetch(`/api/protected/headadmin/invoices/${params.id}/${action}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchInvoiceDetails();
        await fetchPaymentHistory();
        setShowConfirmDialog(null);
      }
    } catch (error) {
      console.error(`Failed to ${action} invoice:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
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

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold ${config.bg} ${config.text} border ${config.border}`}>
        <Icon className="w-4 h-4 mr-2" />
        {status.toUpperCase()}
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
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const ActionButton = ({ onClick, icon: Icon, children, variant = 'primary', disabled = false }) => {
    const baseClasses = "group relative overflow-hidden px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2";
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white",
      secondary: "bg-gradient-to-r from-gray-500 to-gray-600 text-white",
      success: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
      danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white",
      warning: "bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled || actionLoading}
        className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Icon className="w-4 h-4 relative z-10" />
        <span className="relative z-10">{children}</span>
      </button>
    );
  };

  const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, variant = 'danger' }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-200/50 p-8 max-w-md w-full mx-4">
          <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancel
            </button>
            <ActionButton
              onClick={onConfirm}
              icon={CheckCircle}
              variant={variant}
              disabled={actionLoading}
            >
              {actionLoading ? 'Processing...' : 'Confirm'}
            </ActionButton>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-gray-600 mt-4 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium text-lg mb-2">Invoice not found</p>
          <p className="text-gray-400 text-sm mb-6">The invoice you're looking for doesn't exist or has been removed</p>
          <ActionButton
            onClick={() => router.push('/protected/headadmin/invoices')}
            icon={ArrowLeft}
            variant="secondary"
          >
            Back to Invoices
          </ActionButton>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/protected/headadmin/invoices')}
                className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center hover:scale-105 transition-all duration-200 shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                    {invoice.invoiceNumber}
                  </h1>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span className="font-medium">{invoice.school?.name}</span>
                  <span>•</span>
                  <span>{invoice.billingPeriod}</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <ActionButton
                onClick={() => copyToClipboard(invoice.invoiceNumber)}
                icon={Copy}
                variant="secondary"
              >
                Copy Number
              </ActionButton>
              
              <ActionButton
                onClick={() => window.open(`/api/protected/headadmin/invoices/${invoice.id}/download`, '_blank')}
                icon={Download}
                variant="primary"
              >
                Download PDF
              </ActionButton>
              
              {invoice.status === 'pending' && (
                <ActionButton
                  onClick={() => setShowConfirmDialog('mark-paid')}
                  icon={CheckCircle}
                  variant="success"
                >
                  Mark as Paid
                </ActionButton>
              )}
              
              {invoice.status !== 'cancelled' && (
                <ActionButton
                  onClick={() => setShowConfirmDialog('cancel')}
                  icon={XCircle}
                  variant="danger"
                >
                  Cancel Invoice
                </ActionButton>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Invoice Summary */}
            <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Calculator className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Invoice Summary</h2>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Billing Period</p>
                      <p className="text-lg font-bold text-gray-900">{invoice.billingPeriod}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Issue Date</p>
                      <p className="text-lg font-medium text-gray-900">{formatDate(invoice.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Due Date</p>
                      <p className="text-lg font-medium text-gray-900">{formatDate(invoice.dueDate)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                      <p className="text-lg font-bold text-gray-900">{(invoice.studentCount || 0) + (invoice.teacherCount || 0)} users</p>
                      <p className="text-sm text-gray-500">
                        {invoice.studentCount || 0} students • {invoice.teacherCount || 0} teachers
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Rate per User</p>
                      <p className="text-lg font-medium text-gray-900">{formatCurrency(invoice.pricePerUser || 0)}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200/50 pt-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-gray-900">Total Amount</span>
                    <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      {formatCurrency(invoice.amount)}
                    </span>
                  </div>
                  {invoice.description && (
                    <p className="text-gray-600 mt-2">{invoice.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <History className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
              </div>

              {paymentHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CreditCard className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No payment history available</p>
                  <p className="text-gray-400 text-sm">Payment records will appear here once processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-gray-200/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{payment.method}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{formatCurrency(payment.amount)}</p>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* School Information */}
            <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">School Details</h2>
              </div>

              {invoice.school ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">School Name</p>
                    <p className="font-bold text-gray-900">{invoice.school.name}</p>
                  </div>
                  
                  {invoice.school.email && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{invoice.school.email}</span>
                      </div>
                    </div>
                  )}
                  
                  {invoice.school.phone && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900">{invoice.school.phone}</span>
                      </div>
                    </div>
                  )}
                  
                  {invoice.school.address && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                        <span className="text-gray-900">{invoice.school.address}</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200/50">
                    <ActionButton
                      onClick={() => router.push(`/protected/headadmin/schools/${invoice.schoolId}`)}
                      icon={ExternalLink}
                      variant="secondary"
                    >
                      View School
                    </ActionButton>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">School information not available</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-white/70 to-gray-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push(`/protected/headadmin/messages?school=${invoice.schoolId}`)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-blue-50/50 transition-colors group"
                >
                  <Mail className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Send Message</span>
                </button>
                
                <button
                  onClick={() => router.push(`/protected/headadmin/schools/${invoice.schoolId}/subscription`)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-purple-50/50 transition-colors group"
                >
                  <CreditCard className="w-5 h-5 text-purple-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Manage Subscription</span>
                </button>
                
                <button
                  onClick={() => router.push(`/protected/headadmin/invoices/create?school=${invoice.schoolId}`)}
                  className="w-full flex items-center gap-3 p-3 text-left rounded-xl hover:bg-green-50/50 transition-colors group"
                >
                  <Receipt className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                  <span className="font-medium text-gray-900">Create New Invoice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        isOpen={showConfirmDialog === 'mark-paid'}
        title="Mark Invoice as Paid"
        message="Are you sure you want to mark this invoice as paid? This action will update the payment status."
        onConfirm={() => handleInvoiceAction('mark-paid')}
        onCancel={() => setShowConfirmDialog(null)}
        variant="success"
      />
      
      <ConfirmDialog
        isOpen={showConfirmDialog === 'cancel'}
        title="Cancel Invoice"
        message="Are you sure you want to cancel this invoice? This action cannot be undone."
        onConfirm={() => handleInvoiceAction('cancel')}
        onCancel={() => setShowConfirmDialog(null)}
        variant="danger"
      />
    </div>
  );
};

export default InvoiceDetailPage;