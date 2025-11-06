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
  Zap,
  Activity,
  Crown,
  Sparkles,
  ArrowUp,
  Bell
} from 'lucide-react';

const AdminSubscriptionPage = () => {
  const [subscription, setSubscription] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return { text: 'Loading...', color: 'gray', icon: Clock };
    
    const isActive = subscription.subscriptionIsActive;
    const daysLeft = subscription.daysTillNextPayment;
    
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-3xl animate-pulse shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-3xl animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Loading Subscription Portal...</p>
        </div>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const StatusIcon = status.icon;
  const daysLeft = subscription?.daysTillNextPayment || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="space-y-8">
        {/* Futuristic Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white/80 to-emerald-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-cyan-600/5 to-blue-600/5"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-emerald-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider">Financial Management</span>
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-emerald-800 to-cyan-800 bg-clip-text text-transparent">
                Subscription Hub
              </h1>
              <p className="text-gray-600 text-xl font-medium">
                Advanced billing and subscription management portal
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={fetchSubscriptionData}
                disabled={isLoading}
                className="group relative overflow-hidden bg-white/20 hover:bg-white/30 text-emerald-600 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg border border-emerald-300/50 flex items-center gap-2"
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Sync Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 to-pink-50/90 backdrop-blur-sm border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-bold text-lg">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Alert - Shows when approaching expiry */}
        {subscription && daysLeft <= 30 && daysLeft > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-yellow-50/90 to-orange-50/90 backdrop-blur-sm border border-yellow-300 rounded-2xl p-6 shadow-xl animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Bell className="w-6 h-6 text-white animate-bounce" />
              </div>
              <div className="flex-1">
                <p className="text-yellow-900 font-black text-lg mb-1">Payment Due Soon!</p>
                <p className="text-yellow-700 font-bold">
                  Your subscription expires in {daysLeft} days. Please make payment to continue service.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Expired Alert */}
        {subscription && daysLeft <= 0 && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 to-pink-50/90 backdrop-blur-sm border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-900 font-black text-lg mb-1">Subscription Expired!</p>
                <p className="text-red-700 font-bold">
                  Your subscription has expired. Please make immediate payment to restore service.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Current Status Card */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-emerald-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-8">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-sm shadow-xl">
                <StatusIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white mb-2">System Status</h2>
                <p className={`text-2xl font-bold ${
                  status.color === 'emerald' ? 'text-green-200' :
                  status.color === 'yellow' ? 'text-yellow-200' : 'text-red-200'
                }`}>
                  {status.text}
                </p>
              </div>
            </div>
          </div>

          {subscription && (
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-cyan-50/80 p-6 rounded-2xl border border-blue-200/50 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-black text-gray-800 text-lg">Active Plan</h3>
                  </div>
                  <p className="text-4xl font-black text-gray-900 capitalize mb-2">
                    {subscription.subscriptionPlan}
                  </p>
                  <div className="flex items-center text-blue-600 font-bold">
                    <Sparkles className="w-4 h-4 mr-1" />
                    <span className="text-sm">Premium Features</span>
                  </div>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-green-50/80 p-6 rounded-2xl border border-emerald-200/50 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-black text-gray-800 text-lg">Active Users</h3>
                  </div>
                  <p className="text-4xl font-black text-gray-900 mb-2">
                    {subscription.currentUsers?.total || 0}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    {subscription.currentUsers?.students || 0} students • {subscription.currentUsers?.teachers || 0} teachers
                  </p>
                </div>

                <div className="relative overflow-hidden bg-gradient-to-br from-purple-50/80 to-pink-50/80 p-6 rounded-2xl border border-purple-200/50 shadow-lg">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <Calendar className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-black text-gray-800 text-lg">Next Billing</h3>
                  </div>
                  <p className="text-2xl font-black text-gray-900 mb-2">
                    {subscription.subscriptionExpiresAt ? 
                      new Date(subscription.subscriptionExpiresAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      }) : 'N/A'
                    }
                  </p>
                </div>

                <div className={`relative overflow-hidden p-6 rounded-2xl border shadow-lg ${
                  daysLeft > 30 ? 'bg-gradient-to-br from-emerald-50/80 to-green-50/80 border-emerald-200/50' :
                  daysLeft > 0 ? 'bg-gradient-to-br from-yellow-50/80 to-orange-50/80 border-yellow-200/50' :
                  'bg-gradient-to-br from-red-50/80 to-pink-50/80 border-red-200/50'
                }`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                      daysLeft > 30 ? 'bg-gradient-to-br from-emerald-500 to-green-500' :
                      daysLeft > 0 ? 'bg-gradient-to-br from-yellow-500 to-orange-500' :
                      'bg-gradient-to-br from-red-500 to-pink-500'
                    }`}>
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-black text-gray-800 text-lg">Days Left</h3>
                  </div>
                  <p className={`text-4xl font-black mb-2 ${
                    daysLeft > 30 ? 'text-emerald-900' :
                    daysLeft > 0 ? 'text-yellow-900' :
                    'text-red-900'
                  }`}>
                    {daysLeft}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    until next payment required
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pricing Plans */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white">Pricing Plans</h2>
            </div>
          </div>

          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Individual Payment Plan */}
              <div className="relative overflow-hidden bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-2xl border border-blue-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">Individual Plan</h3>
                      <p className="text-sm text-gray-600 font-medium">Pay per user account</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <span className="text-gray-600 font-medium">Price per user:</span>
                      <span className="text-2xl font-black text-gray-900">{formatCurrency(250)}/month</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <span className="text-gray-600 font-medium">Current users:</span>
                      <span className="text-xl font-bold text-gray-900">{subscription?.currentUsers?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-blue-50 rounded-xl px-4 border border-blue-200">
                      <span className="text-gray-800 font-bold">Monthly total:</span>
                      <span className="text-3xl font-black text-blue-600">
                        {formatCurrency(subscription ? (subscription.currentUsers?.total || 0) * 250 : 0)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-6 font-medium">
                    Each teacher and student pays individually for their account access.
                  </p>

                  <button
                    onClick={() => handlePaymentRequest('individual')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white rounded-xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl disabled:opacity-50"
                  >
                    <Users className="w-5 h-5" />
                    Request Individual Payment
                  </button>
                </div>
              </div>

              {/* Bulk Payment Plan */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/80 to-green-50/80 rounded-2xl border-2 border-emerald-300/50 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-6 py-2 rounded-full shadow-xl">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span className="font-black text-sm">RECOMMENDED</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-8 pt-10">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-xl">
                      <Shield className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-gray-900">Bulk Plan</h3>
                      <p className="text-sm text-gray-600 font-medium">School-wide subscription</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <span className="text-gray-600 font-medium">Price per user:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg text-gray-400 line-through">{formatCurrency(250)}</span>
                        <span className="text-2xl font-black text-emerald-600">{formatCurrency(200)}/month</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-gray-200/50">
                      <span className="text-gray-600 font-medium">Current users:</span>
                      <span className="text-xl font-bold text-gray-900">{subscription?.currentUsers?.total || 0}</span>
                    </div>
                    <div className="flex justify-between items-center py-4 bg-emerald-50 rounded-xl px-4 border border-emerald-200">
                      <span className="text-gray-800 font-bold">Monthly total:</span>
                      <span className="text-3xl font-black text-emerald-600">
                        {formatCurrency(subscription ? 
                          (subscription.currentUsers?.total > 600 ? 200000 : (subscription.currentUsers?.total || 0) * 200) 
                          : 0)}
                      </span>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-100 to-green-100 p-4 rounded-xl border border-emerald-200">
                      <div className="flex items-center gap-2">
                        <ArrowUp className="w-5 h-5 text-emerald-600 transform rotate-45" />
                        <span className="font-black text-emerald-700">
                          Save {formatCurrency(subscription ? (subscription.currentUsers?.total || 0) * 50 : 0)} monthly!
                        </span>
                      </div>
                    </div>

                    {subscription?.currentUsers?.total > 600 && (
                      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-xl border border-yellow-300">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-yellow-600" />
                          <p className="text-yellow-700 font-black">
                            Flat rate of {formatCurrency(200000)}/month for 600+ users!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-6 font-medium">
                    School admin pays for all users. Save 20% compared to individual billing!
                  </p>

                  <button
                    onClick={() => handlePaymentRequest('bulk')}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl transition-all duration-300 font-bold shadow-xl hover:shadow-2xl disabled:opacity-50"
                  >
                    <Shield className="w-5 h-5" />
                    Pay for All Users (Save 20%)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Invoices */}
        {subscription?.pendingInvoices && subscription.pendingInvoices.length > 0 && (
          <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-yellow-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-8">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <Receipt className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white">Pending Invoices</h2>
              </div>
            </div>
            
            <div className="p-8">
              <div className="space-y-4">
                {subscription.pendingInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-yellow-50/80 to-orange-50/80 rounded-2xl border border-yellow-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-black text-gray-900 text-lg">{invoice.description || 'Monthly Subscription'}</p>
                        <p className="text-sm text-gray-600 font-medium">
                          Created: {new Date(invoice.createdAt).toLocaleDateString()}
                          {invoice.dueDate && ` • Due: ${new Date(invoice.dueDate).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="text-3xl font-black text-yellow-600">
                        {formatCurrency(parseFloat(invoice.amount))}
                      </span>
                      <button className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-xl transition-all font-bold shadow-xl">
                        <CreditCard className="w-5 h-5" />
                        Pay Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Features Included */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-purple-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-8">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                <Star className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-3xl font-black text-white">Premium Features</h2>
            </div>
          </div>
          
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Users, title: "User Management", description: "Unlimited student, teacher, and admin accounts" },
                { icon: Calendar, title: "Smart Scheduling", description: "AI-powered timetable and calendar management" },
                { icon: TrendingUp, title: "Advanced Analytics", description: "Real-time performance tracking and insights" },
                { icon: Shield, title: "Enterprise Security", description: "Bank-level security with data encryption" },
                { icon: Receipt, title: "Automated Billing", description: "Seamless invoice and payment processing" },
                { icon: Zap, title: "Priority Support", description: "24/7 dedicated customer success team" }
              ].map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div key={index} className="group relative overflow-hidden bg-gradient-to-br from-gray-50/80 to-white/50 p-6 rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-900 text-lg mb-2">{feature.title}</h3>
                        <p className="text-sm text-gray-600 font-medium">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSubscriptionPage;