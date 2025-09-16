
                'use client'
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  Shield, 
  Globe, 
  CreditCard, 
  Bell, 
  Key, 
  Database, 
  Mail, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Clock,
  Zap,
  Lock,
  Activity
} from 'lucide-react';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile Settings
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // System Settings
  const [systemSettings, setSystemSettings] = useState({
    siteName: 'School Management System',
    trialPeriodDays: 30,
    pricePerUser: 250,
    flatRateThreshold: 600,
    flatRatePrice: 200000,
    maintenanceMode: false,
    allowSchoolRegistration: true,
    requireEmailVerification: true,
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    passwordMinLength: 8
  });

  // Payment Settings
  const [paymentSettings, setPaymentSettings] = useState({
    paystackPublicKey: '',
    paystackSecretKey: '',
    flutterwavePublicKey: '',
    flutterwaveSecretKey: '',
    defaultCurrency: 'NGN',
    enablePaystack: true,
    enableFlutterwave: false
  });

  // Email Settings
  const [emailSettings, setEmailSettings] = useState({
    smtpHost: '',
    smtpPort: 587,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'School Management System',
    enableSsl: true
  });

  const tabs = [
    { id: 'profile', label: 'Profile Settings', icon: User },
    { id: 'system', label: 'System Settings', icon: Settings },
    { id: 'payment', label: 'Payment Integration', icon: CreditCard },
    { id: 'email', label: 'Email Configuration', icon: Mail },
    { id: 'security', label: 'Security & Audit', icon: Shield }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Simulate API calls (replace with actual API endpoints)
      setTimeout(() => {
        // Mock data - replace with actual API responses
        setProfile(prev => ({ 
          ...prev, 
          firstName: 'John',
          lastName: 'Doe',
          email: 'admin@school.com',
          phone: '+234 123 456 7890'
        }));
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to load settings');
      setLoading(false);
    }
  };

  const saveSettings = async (settingType, data) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Simulate API call
      setTimeout(() => {
        setSuccess('Settings saved successfully!');
        setSaving(false);
        setTimeout(() => setSuccess(''), 3000);
      }, 1000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setError('Network error occurred. Please try again.');
      setSaving(false);
    }
  };

  const handleProfileSave = () => {
    if (profile.newPassword && profile.newPassword !== profile.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    saveSettings('profile', profile);
  };

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <User className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Profile Information</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <input
                type="text"
                value={profile.firstName}
                onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <input
                type="text"
                value={profile.lastName}
                onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Password Change */}
          <div className="border-t border-gray-200/50 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={profile.currentPassword}
                  onChange={(e) => setProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={profile.newPassword}
                    onChange={(e) => setProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-4 py-3 pr-12 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={profile.confirmPassword}
                  onChange={(e) => setProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Profile
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      {/* General Settings */}
      <div className="bg-gradient-to-br from-white/70 to-emerald-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Platform Settings</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Site Name
              </label>
              <input
                type="text"
                value={systemSettings.siteName}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, siteName: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trial Period (Days)
              </label>
              <input
                type="number"
                value={systemSettings.trialPeriodDays}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, trialPeriodDays: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Pricing Settings */}
          <div className="border-t border-gray-200/50 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price per User (₦)
                </label>
                <input
                  type="number"
                  value={systemSettings.pricePerUser}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, pricePerUser: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Rate Threshold (Users)
                </label>
                <input
                  type="number"
                  value={systemSettings.flatRateThreshold}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, flatRateThreshold: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Flat Rate Price (₦)
                </label>
                <input
                  type="number"
                  value={systemSettings.flatRatePrice}
                  onChange={(e) => setSystemSettings(prev => ({ ...prev, flatRatePrice: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm"
                />
              </div>
            </div>
          </div>

          {/* System Toggles */}
          <div className="border-t border-gray-200/50 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">System Controls</h4>
            <div className="space-y-4">
              {[
                { key: 'maintenanceMode', label: 'Maintenance Mode', description: 'Put the system in maintenance mode' },
                { key: 'allowSchoolRegistration', label: 'Allow School Registration', description: 'Allow new schools to register' },
                { key: 'requireEmailVerification', label: 'Require Email Verification', description: 'Require email verification for new users' }
              ].map((setting) => (
                <label key={setting.key} className="flex items-center p-4 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 rounded-xl border border-emerald-200/50 hover:border-emerald-300/50 transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemSettings[setting.key]}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, [setting.key]: e.target.checked }))}
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-700">{setting.label}</span>
                    <p className="text-xs text-gray-500">{setting.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSettings('system', systemSettings)}
              disabled={saving}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save System Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-white/70 to-red-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden">
        <div className="bg-gradient-to-r from-red-600 to-pink-600 p-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Security & Audit Settings</h3>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Timeout (Hours)
              </label>
              <input
                type="number"
                value={systemSettings.sessionTimeout}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Login Attempts
              </label>
              <input
                type="number"
                value={systemSettings.maxLoginAttempts}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password Min Length
              </label>
              <input
                type="number"
                value={systemSettings.passwordMinLength}
                onChange={(e) => setSystemSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
                className="w-full px-4 py-3 border border-gray-300/50 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>

          {/* Audit Log Viewer */}
          <div className="border-t border-gray-200/50 pt-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Recent System Activity
            </h4>
            <div className="bg-gradient-to-r from-gray-50/50 to-red-50/50 rounded-xl p-4 border border-gray-200/50">
              <p className="text-sm text-gray-600 mb-3">Last 10 system activities:</p>
              <div className="space-y-2 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>School created: St. Mary's Secondary</span>
                  <span>2 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Invoice generated for Divine Academy</span>
                  <span>3 hours ago</span>
                </div>
                <div className="flex justify-between">
                  <span>Broadcast message sent to all schools</span>
                  <span>1 day ago</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => saveSettings('security', { 
                sessionTimeout: systemSettings.sessionTimeout,
                maxLoginAttempts: systemSettings.maxLoginAttempts,
                passwordMinLength: systemSettings.passwordMinLength
              })}
              disabled={saving}
              className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Security Settings
                </>
              )}
            </button>
          </div>
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
          <p className="text-gray-600 mt-4 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
              System Settings
            </h1>
            <p className="text-gray-600 text-lg">
              Configure platform settings, security, and integrations
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl flex items-center text-green-700 shadow-lg">
            <CheckCircle className="w-5 h-5 mr-3" />
            {success}
          </div>
        )}

        {error && (
          <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl flex items-center text-red-700 shadow-lg">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

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
          {activeTab === 'profile' && renderProfileSettings()}
          {activeTab === 'system' && renderSystemSettings()}
          {activeTab === 'security' && renderSecuritySettings()}
          {activeTab === 'payment' && (
            <div className="bg-gradient-to-br from-white/70 to-purple-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-10 h-10 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Integration</h3>
              <p className="text-gray-600">Payment gateway configuration will be available soon.</p>
            </div>
          )}
          {activeTab === 'email' && (
            <div className="bg-gradient-to-br from-white/70 to-blue-50/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Configuration</h3>
              <p className="text-gray-600">Email SMTP configuration will be available soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;