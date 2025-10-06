'use client'
import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle, 
  Shield, Bell, Palette, Globe, Eye, EyeOff, Calendar, Award
} from 'lucide-react';

export default function DirectorSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('profile');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    qualification: '',
    experienceYears: 0
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    assignmentReminders: true,
    gradeNotifications: true
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          department: data.user.teacherProfile?.department || '',
          qualification: data.user.teacherProfile?.qualification || '',
          experienceYears: data.user.teacherProfile?.experienceYears || 0
        });

        // Fetch notification settings if available
        const settingsResponse = await fetch('/api/protected/teachers/director/settings', {
          credentials: 'include'
        });
        if (settingsResponse.ok) {
          const settingsData = await settingsResponse.json();
          if (settingsData.success && settingsData.data.settings) {
            setNotificationSettings(settingsData.data.settings);
          }
        }
      }
    } catch (error) {
      console.error('Fetch user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/protected/teachers/director/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'profile', data: profileData })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchUserData();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update profile' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      setSaving(false);
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      setSaving(false);
      return;
    }

    try {
      const response = await fetch('/api/protected/teachers/director/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'password', data: passwordData })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/protected/teachers/director/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type: 'notifications', data: notificationSettings })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'Notification settings updated!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update settings' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Network error occurred' });
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse mx-auto"></div>
          <p className="text-white mt-4">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
        <h1 className="text-4xl font-bold text-white flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
            <User className="h-8 w-8 text-white" />
          </div>
          Settings
        </h1>
        <p className="text-gray-300 text-lg mt-2">Manage your account and preferences</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`rounded-xl p-4 flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-green-500/20 border border-green-500/30 text-green-300' 
            : 'bg-red-500/20 border border-red-500/30 text-red-300'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="flex border-b border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-8">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Qualification</label>
                  <input
                    type="text"
                    value={profileData.qualification}
                    onChange={(e) => setProfileData({...profileData, qualification: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Years of Experience</label>
                  <input
                    type="number"
                    value={profileData.experienceYears}
                    onChange={(e) => setProfileData({...profileData, experienceYears: parseInt(e.target.value) || 0})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
                    min="0"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-md">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.current ? 'text' : 'password'}
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                {saving ? 'Changing...' : 'Change Password'}
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-md">
              <div className="space-y-4">
                {[
                  { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                  { key: 'assignmentReminders', label: 'Assignment Reminders', desc: 'Get reminded about upcoming assignments' },
                  { key: 'gradeNotifications', label: 'Grade Notifications', desc: 'Be notified when grades are posted' }
                ].map(setting => (
                  <label key={setting.key} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={notificationSettings[setting.key]}
                      onChange={(e) => setNotificationSettings({...notificationSettings, [setting.key]: e.target.checked})}
                      className="w-5 h-5 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{setting.label}</p>
                      <p className="text-sm text-gray-400">{setting.desc}</p>
                    </div>
                  </label>
                ))}
              </div>

              <button
                onClick={handleUpdateNotifications}
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}