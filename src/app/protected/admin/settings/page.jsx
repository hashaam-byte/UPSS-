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
  Clock
} from 'lucide-react';

const AdminSettingsPage = () => {
  const [activeTab, setActiveTab] = useState('school');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    vice_principalName: ''
  });

  const [userSettings, setUserSettings] = useState({
    allowStudentRegistration: true,
    allowTeacherRegistration: false,
    requireEmailVerification: true,
    maxStudentsPerClass: 30,
    defaultUserRole: 'student'
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

  const [adminProfile, setAdminProfile] = useState({
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
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'profile', label: 'My Profile', icon: Edit3 }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

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
            value={adminProfile.firstName}
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
            value={adminProfile.lastName}
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
            value={adminProfile.email}
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
            value={adminProfile.phone}
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
                  value={adminProfile.currentPassword}
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
                value={adminProfile.newPassword}
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
                value={adminProfile.confirmPassword}
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
          if (showPasswordFields && adminProfile.newPassword !== adminProfile.confirmPassword) {
            setError('Passwords do not match');
            return;
          }
          handleSaveSettings('profile', adminProfile);
        }}
        disabled={isSaving || (showPasswordFields && !adminProfile.currentPassword)}
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