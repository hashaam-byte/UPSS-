'use client'
import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Users, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Download,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Shield,
  Star,
  Zap
} from 'lucide-react';

const AdminSubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentOption, setSelectedPaymentOption] = useState('individual');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/admin/subscription/status');
      const data = await response.json();

      if (response.ok) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Failed to fetch subscription data');
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentRequest = async (paymentType) => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/admin/subscription/payment-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentType,
          studentCount: subscription.currentUsers.students,
          teacherCount: subscription.currentUsers.teachers
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to payment gateway or show success message
        alert('Payment request submitted successfully. You will be redirected to the payment gateway.');
      } else {
        setError(data.error || 'Failed to process payment request');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { text: 'Loading...', color: 'gray', icon: Clock };
    
    const isActive = subscription.subscriptionIsActive;
    const expiresAt = new Date(subscription.subscriptionExpiresAt);
    const daysLeft = Math.ceil((expiresAt - new Date()) / (1000 * 60 * 60 * 24));
    
    if (isActive && daysLeft > 30) {
      return { 
        text: `Active - ${daysLeft} days remaining`, 
        color: 'emerald', 
        icon: CheckCircle 
      };
    } else if (isActive && daysLeft > 0) {
      return { 
        text: `Expiring Soon - ${daysLeft} days left`, 
        color: 'yellow', 
        icon: AlertTriangle 
      };
    } else {
      return { 
        text: 'Expired', 
        color: 'red', 
        icon: AlertTriangle 
      };
    }
  };

  if (isLoading && !subscription) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-white">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription & Billing</h1>
          <p className="text-gray-400">Manage your school's subscription and payments</p>
        </div>
        <button
          onClick={fetchSubscriptionData}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/20 rounded-lg transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Current Status Card */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 bg-gradient-to-r from-${status.color}-500 to-${status.color}-600 rounded-xl flex items-center justify-center`}>
            <StatusIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Current Status</h2>
            <p className={`text-${status.color}-400 font-medium`}>{status.text}</p>
          </div>
        </div>

        {subscription && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <h3 className="font-medium text-white">Plan</h3>
              </div>
              <p className="text-2xl font-bold text-white capitalize">
                {subscription.subscriptionPlan}
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-medium text-white">Total Users</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {subscription.currentUsers.total}
              </p>
              <p className="text-sm text-gray-400">
                {subscription.currentUsers.students} students, {subscription.currentUsers.teachers} teachers
              </p>
            </div>

            <div className="bg-white/5 p-4 rounded-xl">
              <div className="flex items-center gap-3 mb-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="font-medium text-white">Expires</h3>
              </div>
              <p className="text-2xl font-bold text-white">
                {new Date(subscription.subscriptionExpiresAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Information */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          Pricing Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Individual Payment */}
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-6 rounded-xl border border-blue-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Individual Payment</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Price per user:</span>
                <span className="text-white font-medium">₦250/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current users:</span>
                <span className="text-white font-medium">{subscription?.currentUsers.total || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white font-medium">Monthly cost:</span>
                <span className="text-xl font-bold text-blue-400">
                  ₦{subscription ? (subscription.currentUsers.total * 250).toLocaleString() : 0}
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              Each teacher and student pays individually for their account access.
            </p>
          </div>

          {/* Bulk Payment */}
          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 p-6 rounded-xl border border-emerald-500/20">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Bulk Payment</h3>
              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-full">
                Recommended
              </span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Price per user:</span>
                <span className="text-white font-medium">₦200/month</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Current users:</span>
                <span className="text-white font-medium">{subscription?.currentUsers.total || 0}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/10">
                <span className="text-white font-medium">Monthly cost:</span>
                <span className="text-xl font-bold text-emerald-400">
                  ₦{subscription ? (subscription.currentUsers.total > 600 ? 200000 : subscription.currentUsers.total * 200).toLocaleString() : 0}
                </span>
              </div>
              {subscription?.currentUsers.total > 600 && (
                <div className="bg-emerald-500/20 p-3 rounded-lg">
                  <p className="text-emerald-400 text-sm font-medium">
                    🎉 Flat rate of ₦200,000/month for schools with 600+ users!
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-3">
              School admin pays for all users. Save ₦50 per user per month!
            </p>
          </div>
        </div>

        {/* Payment Actions */}
        <div className="mt-6 flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => handlePaymentRequest('individual')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all disabled:opacity-50"
          >
            <Users className="w-4 h-4" />
            Request Individual Payment
          </button>
          <button
            onClick={() => handlePaymentRequest('bulk')}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-lg transition-all disabled:opacity-50"
          >
            <Shield className="w-4 h-4" />
            Pay for All Users (Save 20%)
          </button>
        </div>
      </div>

      {/* Recent Invoices */}
      {subscription?.pendingInvoices && subscription.pendingInvoices.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            Pending Invoices
          </h2>
          
          <div className="space-y-3">
            {subscription.pendingInvoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-yellow-500/20">
                <div>
                  <p className="font-medium text-white">{invoice.description || 'Monthly Subscription'}</p>
                  <p className="text-sm text-gray-400">
                    Created: {new Date(invoice.createdAt).toLocaleDateString()}
                    {invoice.dueDate && ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xl font-bold text-yellow-400">
                    ₦{parseFloat(invoice.amount).toLocaleString()}
                  </span>
                  <button className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors">
                    <CreditCard className="w-4 h-4" />
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Features Included */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Star className="w-5 h-5 text-emerald-400" />
          What's Included
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { icon: Users, title: "User Management", description: "Create and manage student, teacher, and admin accounts" },
            { icon: Calendar, title: "Scheduling", description: "Timetable and calendar management" },
            { icon: TrendingUp, title: "Analytics", description: "Performance tracking and reporting" },
            { icon: Shield, title: "Security", description: "Advanced security features and permissions" },
            { icon: Receipt, title: "Billing", description: "Invoice and payment management" },
            { icon: Zap, title: "Priority Support", description: "24/7 customer support and assistance" }
          ].map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-4 bg-white/5 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPage;