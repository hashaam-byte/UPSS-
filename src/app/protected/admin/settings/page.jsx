'use client'
import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  School, 
  Users, 
  Shield, 
  Bell, 
  Palette, 
  Globe, 
  Mail, 
  Key, 
  Database,
  Save,
  Upload,
  Edit3,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Loader2,
  X,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Trash2,
  ExternalLink
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('school');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ publicKey: '', secretKey: '' });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  const [schoolSettings, setSchoolSettings] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    logo: '',
    description: '',
    establishedYear: '',
    principalName: '',
    vice_principalName: '',
    themeColor: '#10b981'
  });

  const [userSettings, setUserSettings] = useState({
    allowStudentRegistration: true,
    allowTeacherRegistration: false,
    requireEmailVerification: true,
    maxStudentsPerClass: 30,
    defaultUserRole: 'STUDENT'
  });

  const [securitySettings, setSecuritySettings] = useState({
    passwordMinLength: 8,
    requireStrongPassword: true,
    enableTwoFactor: false,
    sessionTimeout: 24,
    allowMultipleSessions: true
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    newUserRegistration: true,
    paymentAlerts: true,
    systemUpdates: false,
    weeklyReports: true
  });

  const [AdminProfile, setAdminProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const tabs = [
    { id: 'school', label: 'School Info', icon: School },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'payment', label: 'Payment Gateway', icon: Wallet },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: Edit3 }
  ];

  useEffect(() => {
    fetchSettings();
    fetchPaymentConfig();
  }, []);

  const fetchPaymentConfig = async () => {
    try {
      const res = await fetch('/api/protected/admin/settings/payment-gateway', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setPaymentConfig(data.data);
    } catch (err) {
      console.error('Failed to load payment gateway config:', err);
    }
  };

  const handleSavePaymentConfig = async () => {
    setPaymentError('');
    setPaymentSuccess('');
    if (!paymentForm.publicKey) {
      setPaymentError('Public key is required');
      return;
    }
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/protected/admin/settings/payment-gateway', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          provider: 'paystack',
          publicKey: paymentForm.publicKey,
          ...(paymentForm.secretKey && { secretKey: paymentForm.secretKey }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPaymentError(data.error || 'Failed to save');
        return;
      }
      setPaymentSuccess('Payment gateway connected successfully.');
      setPaymentForm({ publicKey: '', secretKey: '' });
      fetchPaymentConfig();
    } catch (err) {
      setPaymentError('Network error. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleDisconnectPayment = async () => {
    if (!confirm('Disconnect your payment gateway? Parents will go back to bank-transfer-only payments.')) return;
    setPaymentLoading(true);
    try {
      const res = await fetch('/api/protected/admin/settings/payment-gateway', {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        setPaymentConfig(null);
        setPaymentSuccess('Payment gateway disconnected.');
      }
    } catch (err) {
      setPaymentError('Network error. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      const [schoolRes, userRes, securityRes, notificationRes, profileRes] = await Promise.all([
        fetch('/api/protected/admin/settings/school'),
        fetch('/api/protected/admin/settings/users'),
        fetch('/api/protected/admin/settings/security'),
        fetch('/api/protected/admin/settings/notifications'),
        fetch('/api/protected/admin/profile')
      ]);

      if (schoolRes.ok) {
        const schoolData = await schoolRes.json();
        setSchoolSettings(schoolData.settings || schoolSettings);
      }

      if (userRes.ok) {
        const userData = await userRes.json();
        setUserSettings(userData.settings || userSettings);
      }

      if (securityRes.ok) {
        const securityData = await securityRes.json();
        setSecuritySettings(securityData.settings || securitySettings);
      }

      if (notificationRes.ok) {
        const notificationData = await notificationRes.json();
        setNotificationSettings(notificationData.settings || notificationSettings);
      }

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setAdminProfile(prev => ({ ...prev, ...profileData.profile }));
      }

    } catch (error) {
      console.error('Error fetching settings:', error);
      setError('Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async (settingsType, data) => {
    try {
      setIsSaving(true);
      const response = await fetch(`/api/protected/admin/settings/${settingsType}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage('Settings saved successfully');
        if (settingsType === 'profile') {
          setAdminProfile(prev => ({
            ...prev,
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
          }));
          setShowPasswordFields(false);
        }
      } else {
        setError(result.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const renderSchoolSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            School Name *
          </label>
          <input
            type="text"
            value={schoolSettings.name}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Established Year
          </label>
          <input
            type="number"
            value={schoolSettings.establishedYear}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, establishedYear: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            min="1800"
            max={new Date().getFullYear()}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            value={schoolSettings.email}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={schoolSettings.phone}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Website
          </label>
          <input
            type="url"
            value={schoolSettings.website}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, website: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Principal Name
          </label>
          <input
            type="text"
            value={schoolSettings.principalName}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, principalName: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Address
        </label>
        <textarea
          value={schoolSettings.address}
          onChange={(e) => setSchoolSettings(prev => ({ ...prev, address: e.target.value }))}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Brand color
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Choose an accent color for your school's portal, instead of the default theme.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={schoolSettings.themeColor || '#10b981'}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, themeColor: e.target.value }))}
            className="w-14 h-10 rounded-lg border border-white/20 bg-transparent cursor-pointer"
          />
          <input
            type="text"
            value={schoolSettings.themeColor || '#10b981'}
            onChange={(e) => setSchoolSettings(prev => ({ ...prev, themeColor: e.target.value }))}
            placeholder="#10b981"
            className="px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all w-32 font-mono text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          value={schoolSettings.description}
          onChange={(e) => setSchoolSettings(prev => ({ ...prev, description: e.target.value }))}
          className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          rows={4}
          placeholder="Brief description about your school..."
        />
      </div>

      <button
        onClick={() => handleSaveSettings('school', schoolSettings)}
        disabled={isSaving}
        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save School Settings
      </button>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-1">Payment Gateway</h3>
        <p className="text-sm text-gray-400">
          Connect your own Paystack account so parent fee payments go directly to your
          school's bank account. U-Plus never touches or holds this money.
        </p>
      </div>

      {paymentError && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">{paymentError}</div>
      )}
      {paymentSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm">{paymentSuccess}</div>
      )}

      {paymentConfig?.hasSecretKey ? (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <p className="text-white font-medium">Paystack connected</p>
          </div>
          <p className="text-gray-400 text-sm mb-1">Public key: <span className="font-mono">{paymentConfig.publicKey}</span></p>
          <p className="text-gray-400 text-sm mb-4">
            Secret key is saved and encrypted — for security, it can't be viewed again, only replaced below.
          </p>
          <button
            onClick={handleDisconnectPayment}
            disabled={paymentLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      ) : (
        <p className="text-gray-400 text-sm">
          No payment gateway connected yet — parents currently pay by bank transfer only.
        </p>
      )}

      <div className="border-t border-white/10 pt-6">
        <p className="text-sm font-medium text-gray-300 mb-3">
          {paymentConfig?.hasSecretKey ? 'Update keys' : 'Connect Paystack'}
        </p>
        <a
          href="https://dashboard.paystack.com/#/settings/developer"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 mb-4"
        >
          Get your keys from the Paystack dashboard <ExternalLink className="w-3 h-3" />
        </a>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Public key (starts with pk_)"
            value={paymentForm.publicKey}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, publicKey: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500/50"
          />
          <input
            type="password"
            placeholder={paymentConfig?.hasSecretKey ? 'Secret key (leave blank to keep current)' : 'Secret key (starts with sk_)'}
            value={paymentForm.secretKey}
            onChange={(e) => setPaymentForm(prev => ({ ...prev, secretKey: e.target.value }))}
            className="w-full px-4 py-2.5 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-500 text-sm focus:ring-2 focus:ring-emerald-500/50"
          />
        </div>
        <button
          onClick={handleSavePaymentConfig}
          disabled={paymentLoading}
          className="mt-4 flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
        >
          {paymentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>
    </div>
  );

  const renderUserSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
            <div>
              <h4 className="font-medium text-white">Student Registration</h4>
              <p className="text-sm text-gray-400">Allow new students to register</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.allowStudentRegistration}
                onChange={(e) => setUserSettings(prev => ({ ...prev, allowStudentRegistration: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
            <div>
              <h4 className="font-medium text-white">Teacher Registration</h4>
              <p className="text-sm text-gray-400">Allow new teachers to register</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.allowTeacherRegistration}
                onChange={(e) => setUserSettings(prev => ({ ...prev, allowTeacherRegistration: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
            <div>
              <h4 className="font-medium text-white">Email Verification</h4>
              <p className="text-sm text-gray-400">Require email verification for new accounts</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={userSettings.requireEmailVerification}
                onChange={(e) => setUserSettings(prev => ({ ...prev, requireEmailVerification: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Students Per Class
            </label>
            <input
              type="number"
              value={userSettings.maxStudentsPerClass}
              onChange={(e) => setUserSettings(prev => ({ ...prev, maxStudentsPerClass: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Default User Role
            </label>
            <select
              value={userSettings.defaultUserRole}
              onChange={(e) => setUserSettings(prev => ({ ...prev, defaultUserRole: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={() => handleSaveSettings('users', userSettings)}
        disabled={isSaving}
        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save User Settings
      </button>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            value={securitySettings.passwordMinLength}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            min="6"
            max="32"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Session Timeout (hours)
          </label>
          <input
            type="number"
            value={securitySettings.sessionTimeout}
            onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            min="1"
            max="168"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
          <div>
            <h4 className="font-medium text-white">Strong Password Requirements</h4>
            <p className="text-sm text-gray-400">Require uppercase, lowercase, numbers, and special characters</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.requireStrongPassword}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, requireStrongPassword: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
          <div>
            <h4 className="font-medium text-white">Two-Factor Authentication</h4>
            <p className="text-sm text-gray-400">Enable 2FA for enhanced security</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.enableTwoFactor}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, enableTwoFactor: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
          <div>
            <h4 className="font-medium text-white">Multiple Sessions</h4>
            <p className="text-sm text-gray-400">Allow users to login from multiple devices</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={securitySettings.allowMultipleSessions}
              onChange={(e) => setSecuritySettings(prev => ({ ...prev, allowMultipleSessions: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>
      </div>

      <button
        onClick={() => handleSaveSettings('security', securitySettings)}
        disabled={isSaving}
        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Security Settings
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        {Object.entries({
          emailNotifications: { label: 'Email Notifications', description: 'Receive notifications via email' },
          newUserRegistration: { label: 'New User Registrations', description: 'Get notified when new users register' },
          paymentAlerts: { label: 'Payment Alerts', description: 'Get notified about payments and billing issues' },
          systemUpdates: { label: 'System Updates', description: 'Receive notifications about system maintenance' },
          weeklyReports: { label: 'Weekly Reports', description: 'Receive weekly analytics reports via email' }
        }).map(([key, { label, description }]) => (
          <div key={key} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/20">
            <div>
              <h4 className="font-medium text-white">{label}</h4>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={notificationSettings[key]}
                onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 dark:peer-focus:ring-emerald-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>
        ))}
      </div>

      <button
        onClick={() => handleSaveSettings('notifications', notificationSettings)}
        disabled={isSaving}
        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Notification Settings
      </button>
    </div>
  );

  const renderProfileSettings = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={AdminProfile.firstName}
            onChange={(e) => setAdminProfile(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={AdminProfile.lastName}
            onChange={(e) => setAdminProfile(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            value={AdminProfile.email}
            onChange={(e) => setAdminProfile(prev => ({ ...prev, email: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={AdminProfile.phone}
            onChange={(e) => setAdminProfile(prev => ({ ...prev, phone: e.target.value }))}
            className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
          />
        </div>
      </div>

      <div className="border-t border-white/10 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-white">Change Password</h3>
          <button
            onClick={() => setShowPasswordFields(!showPasswordFields)}
            className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
          >
            {showPasswordFields ? 'Cancel' : 'Change Password'}
          </button>
        </div>

        {showPasswordFields && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current Password *
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={AdminProfile.currentPassword}
                  onChange={(e) => setAdminProfile(prev => ({ ...prev, currentPassword: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  required={showPasswordFields}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New Password *
              </label>
              <input
                type="password"
                value={AdminProfile.newPassword}
                onChange={(e) => setAdminProfile(prev => ({ ...prev, newPassword: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                required={showPasswordFields}
                minLength="8"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                value={AdminProfile.confirmPassword}
                onChange={(e) => setAdminProfile(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                required={showPasswordFields}
                minLength="8"
              />
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          if (showPasswordFields && AdminProfile.newPassword !== AdminProfile.confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          handleSaveSettings('profile', AdminProfile);
        }}
        disabled={isSaving || (showPasswordFields && !AdminProfile.currentPassword)}
        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 text-white rounded-lg transition-all"
      >
        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Profile
      </button>
    </div>
  );

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'school':
        return renderSchoolSettings();
      case 'users':
        return renderUserSettings();
      case 'payment':
        return renderPaymentSettings();
      case 'security':
        return renderSecuritySettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'profile':
        return renderProfileSettings();
      default:
        return renderSchoolSettings();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <p className="text-white">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-gray-400">Configure your school settings and preferences</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Settings Navigation */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        <div className="flex flex-wrap gap-2 mb-6 border-b border-white/10 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        {renderActiveTab()}
      </div>
    </div>
  );
};

export default AdminSettingsPage;