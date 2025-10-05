// /app/protected/students/settings/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Lock,
  Bell,
  Eye,
  EyeOff,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Shield,
  Moon,
  Sun,
  Globe,
  Mail
} from 'lucide-react';

const StudentSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  
  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/protected/students/settings');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch settings: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
      } else {
        throw new Error(data.error || 'Failed to load settings');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch settings error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (key, value) => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/protected/students/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          [key]: value
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update settings');
      }

      const data = await response.json();
      
      if (data.success) {
        setSettings(data.data);
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        throw new Error(data.error || 'Failed to update settings');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update settings error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setChangingPassword(true);
      setError(null);

      const response = await fetch('/api/protected/students/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }

      setSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
      console.error('Change password error:', err);
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your account preferences and security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span>Settings updated successfully</span>
          </div>
        )}

        {/* Account Settings */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-blue-500" />
            Account Settings
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Enable Email Notifications</span>
              <button
                onClick={() =>
                  handleToggleSetting('emailNotifications', !settings.emailNotifications)
                }
                className={`w-10 h-6 rounded-full flex items-center ${
                  settings.emailNotifications ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    settings.emailNotifications ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Enable Dark Mode</span>
              <button
                onClick={() => handleToggleSetting('darkMode', !settings.darkMode)}
                className={`w-10 h-6 rounded-full flex items-center ${
                  settings.darkMode ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`w-4 h-4 bg-white rounded-full shadow transform transition-transform ${
                    settings.darkMode ? 'translate-x-4' : ''
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-blue-500" />
            Change Password
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      currentPassword: e.target.value
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData((prev) => ({
                      ...prev,
                      newPassword: e.target.value
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({
                    ...prev,
                    confirmPassword: e.target.value
                  }))
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={changingPassword}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {changingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  'Change Password'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentSettings;