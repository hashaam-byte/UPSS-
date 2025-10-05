// app/protected/teacher/subject/settings/page.jsx
'use client';

import { useState, useEffect } from 'react';

export default function SubjectTeacherSettings() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    bio: ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNewAssignment: true,
    emailGraded: true,
    emailMessage: true,
    pushNotifications: false,
    weeklyReport: true
  });

  const [teachingPreferences, setTeachingPreferences] = useState({
    autoGradeReminders: true,
    assignmentDeadlineReminders: true,
    defaultGradingScale: '100',
    defaultPassingScore: '60',
    allowLateSubmissions: false,
    lateSubmissionPenalty: '10'
  });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/settings');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          phone: data.user.phone || '',
          dateOfBirth: data.user.dateOfBirth || '',
          address: data.user.address || '',
          bio: data.user.teacherProfile?.bio || ''
        });
        setNotificationSettings(data.notificationSettings || notificationSettings);
        setTeachingPreferences(data.teachingPreferences || teachingPreferences);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch('/api/protected/teacher/subject/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        alert('Profile updated successfully');
        await fetchUserData();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/protected/teacher/subject/settings/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (response.ok) {
        alert('Password changed successfully');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/protected/teacher/subject/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationSettings),
      });

      if (response.ok) {
        alert('Notification settings updated successfully');
      }
    } catch (error) {
      console.error('Error updating notifications:', error);
      alert('Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      setSaving(true);
      const response = await fetch('/api/protected/teacher/subject/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teachingPreferences),
      });

      if (response.ok) {
        alert('Teaching preferences updated successfully');
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
      alert('Failed to update teaching preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Settings</h1>
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-gray-600">Manage your account and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'profile' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'security' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Security
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'notifications' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('preferences')}
            className={`pb-2 border-b-2 transition-colors ${
              activeTab === 'preferences' ? 'border-blue-500 text-blue-600' : 'border-transparent'
            }`}
          >
            Teaching Preferences
          </button>
        </div>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Profile Information</h2>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  value={profileData.firstName}
                  onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  value={profileData.lastName}
                  onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={profileData.email}
                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Phone</label>
              <input
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Date of Birth</label>
              <input
                type="date"
                value={profileData.dateOfBirth}
                onChange={(e) => setProfileData({...profileData, dateOfBirth: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <textarea
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <textarea
                value={profileData.bio}
                onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                rows={4}
                placeholder="Tell students about yourself..."
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Password</label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">New Password</label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                  className="w-full px-3 py-2 border rounded-md pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirm New Password</label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Notification Preferences</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">New Assignment Submissions</p>
                <p className="text-sm text-gray-600">Get notified when students submit assignments</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailNewAssignment}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailNewAssignment: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Assignment Graded</p>
                <p className="text-sm text-gray-600">Notify students when you grade their work</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailGraded}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailGraded: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">New Messages</p>
                <p className="text-sm text-gray-600">Get notified of new messages from students</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.emailMessage}
                onChange={(e) => setNotificationSettings({...notificationSettings, emailMessage: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-gray-600">Enable browser push notifications</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.pushNotifications}
                onChange={(e) => setNotificationSettings({...notificationSettings, pushNotifications: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Weekly Report</p>
                <p className="text-sm text-gray-600">Receive weekly performance summary</p>
              </div>
              <input
                type="checkbox"
                checked={notificationSettings.weeklyReport}
                onChange={(e) => setNotificationSettings({...notificationSettings, weeklyReport: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <button
              onClick={handleNotificationUpdate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* Teaching Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-6">Teaching Preferences</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Auto Grade Reminders</p>
                <p className="text-sm text-gray-600">Remind you to grade pending assignments</p>
              </div>
              <input
                type="checkbox"
                checked={teachingPreferences.autoGradeReminders}
                onChange={(e) => setTeachingPreferences({...teachingPreferences, autoGradeReminders: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Assignment Deadline Reminders</p>
                <p className="text-sm text-gray-600">Send reminders before assignment deadlines</p>
              </div>
              <input
                type="checkbox"
                checked={teachingPreferences.assignmentDeadlineReminders}
                onChange={(e) => setTeachingPreferences({...teachingPreferences, assignmentDeadlineReminders: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Default Grading Scale</label>
              <select
                value={teachingPreferences.defaultGradingScale}
                onChange={(e) => setTeachingPreferences({...teachingPreferences, defaultGradingScale: e.target.value})}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="100">100 Points</option>
                <option value="10">10 Points</option>
                <option value="letter">Letter Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Default Passing Score (%)</label>
              <input
                type="number"
                value={teachingPreferences.defaultPassingScore}
                onChange={(e) => setTeachingPreferences({...teachingPreferences, defaultPassingScore: e.target.value})}
                min="0"
                max="100"
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Allow Late Submissions</p>
                <p className="text-sm text-gray-600">Students can submit after deadline</p>
              </div>
              <input
                type="checkbox"
                checked={teachingPreferences.allowLateSubmissions}
                onChange={(e) => setTeachingPreferences({...teachingPreferences, allowLateSubmissions: e.target.checked})}
                className="w-5 h-5"
              />
            </div>

            {teachingPreferences.allowLateSubmissions && (
              <div>
                <label className="block text-sm font-medium mb-2">Late Submission Penalty (%)</label>
                <input
                  type="number"
                  value={teachingPreferences.lateSubmissionPenalty}
                  onChange={(e) => setTeachingPreferences({...teachingPreferences, lateSubmissionPenalty: e.target.value})}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border rounded-md"
                />
              </div>
            )}

            <button
              onClick={handlePreferencesUpdate}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}