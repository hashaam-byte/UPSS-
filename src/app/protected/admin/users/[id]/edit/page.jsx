'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  BookOpen,
  Save,
  Eye,
  EyeOff,
  Camera,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Crown,
  GraduationCap,
  UserCheck,
  X,
  Plus,
  Minus
} from 'lucide-react';

const UserEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    gender: '',
    isActive: true,
    role: 'student',
    teacherType: '',
    coordinatorClasses: []
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });

  const [showPasswordSection, setShowPasswordSection] = useState(false);

  const classLevels = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];

  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/admin/users/${userId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const userData = data.user;
        
        setUser(userData);
        
        // Get coordinator classes
        let coordinatorClasses = [];
        if (userData.role === 'teacher' && userData.teacherProfile?.department === 'coordinator') {
          coordinatorClasses = userData.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
          coordinatorClasses = [...new Set(coordinatorClasses)];
        }

        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          username: userData.username || '',
          phone: userData.phone || '',
          address: userData.address || '',
          dateOfBirth: userData.dateOfBirth ? 
            new Date(userData.dateOfBirth).toISOString().split('T')[0] : '',
          gender: userData.gender || '',
          isActive: userData.isActive,
          role: userData.role,
          teacherType: userData.teacherProfile?.department || '',
          coordinatorClasses
        });
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch user data');
      }
    } catch (error) {
      console.error('Fetch user error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear coordinator classes if role/type changes
    if ((field === 'role' && value !== 'teacher') || 
        (field === 'teacherType' && value !== 'coordinator')) {
      setFormData(prev => ({ ...prev, coordinatorClasses: [] }));
    }
  };

  const handleClassToggle = (className) => {
    setFormData(prev => ({
      ...prev,
      coordinatorClasses: prev.coordinatorClasses.includes(className)
        ? prev.coordinatorClasses.filter(c => c !== className)
        : [...prev.coordinatorClasses, className]
    }));
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Validation for coordinator
      if (formData.role === 'teacher' && formData.teacherType === 'coordinator' && formData.coordinatorClasses.length === 0) {
        setError('Please select at least one class for the coordinator to manage');
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/protected/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          ...formData,
          ...(formData.role === 'teacher' && formData.teacherType === 'coordinator' && {
            coordinatorClasses: formData.coordinatorClasses
          })
        })
      });

      if (response.ok) {
        setSuccess('User updated successfully!');
        fetchUserData(); // Refresh data
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`/api/protected/admin/users/${userId}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          newPassword: passwordData.newPassword
        })
      });

      if (response.ok) {
        setSuccess('Password updated successfully!');
        setPasswordData({ newPassword: '', confirmPassword: '' });
        setShowPasswordSection(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update password');
      }
    } catch (error) {
      console.error('Password update error:', error);
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/protected/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        router.push('/protected/admin/users?deleted=true');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      setError('Network error occurred');
    } finally {
      setSaving(false);
    }
  };

  const getRoleIcon = (role, teacherType) => {
    if (role === 'admin') return Crown;
    if (role === 'teacher') {
      switch (teacherType) {
        case 'coordinator': return BookOpen;
        case 'director': return Shield;
        default: return UserCheck;
      }
    }
    return GraduationCap;
  };

  const getRoleBadgeColor = (role, teacherType) => {
    if (role === 'admin') return 'from-purple-500 to-pink-500';
    if (role === 'teacher') {
      switch (teacherType) {
        case 'coordinator': return 'from-blue-500 to-indigo-500';
        case 'director': return 'from-emerald-500 to-teal-500';
        default: return 'from-green-500 to-emerald-500';
      }
    }
    return 'from-blue-500 to-cyan-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-bold">Loading user data...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <p className="text-gray-600 mb-6">The requested user could not be found.</p>
          <button
            onClick={() => router.push('/protected/admin/users')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  const RoleIcon = getRoleIcon(user.role, user.teacherProfile?.department);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit User Profile</h1>
              <p className="text-gray-600">Modify user information and permissions</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-medium flex items-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>Change Password</span>
            </button>
            <button
              onClick={handleDeleteUser}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-medium flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete User</span>
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl flex items-center">
            <CheckCircle className="h-5 w-5 mr-3" />
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-auto text-green-700 hover:text-green-900">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="text-center">
                <div className="relative mx-auto w-32 h-32 mb-6">
                  <div className={`w-full h-full bg-gradient-to-br ${getRoleBadgeColor(user.role, user.teacherProfile?.department)} rounded-3xl flex items-center justify-center text-white shadow-2xl`}>
                    <span className="text-3xl font-black">
                      {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center">
                    <RoleIcon className="w-6 h-6 text-gray-700" />
                  </div>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2">
                  {user.firstName} {user.lastName}
                </h2>
                <p className="text-gray-600 font-medium mb-4">@{user.username}</p>

                <div className="flex flex-wrap gap-2 justify-center mb-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-black text-white bg-gradient-to-r ${getRoleBadgeColor(user.role, user.teacherProfile?.department)}`}>
                    {user.role.toUpperCase()}
                  </span>
                  {user.teacherProfile?.department && (
                    <span className="px-3 py-1 rounded-full text-xs font-black text-gray-700 bg-gray-100">
                      {user.teacherProfile.department.replace('_', ' ').toUpperCase()}
                    </span>
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    user.isActive ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
                  }`}>
                    {user.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                {/* Coordinator Classes Display */}
                {user.role === 'teacher' && user.teacherProfile?.department === 'coordinator' && formData.coordinatorClasses.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-2">Managing Classes</h4>
                    <div className="flex flex-wrap gap-1 justify-center">
                      {formData.coordinatorClasses.map(className => (
                        <span key={className} className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-bold">
                          {className}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user.lastLogin && (
                    <div className="flex items-center text-gray-600">
                      <User className="w-4 h-4 mr-2" />
                      <span>Last login {new Date(user.lastLogin).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="space-y-8">
                {/* Basic Information */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleFormChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleFormChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => handleFormChange('username', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleFormChange('dateOfBirth', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Role & Permissions */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-6">Role & Permissions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">User Role</label>
                      <select
                        value={formData.role}
                        onChange={(e) => handleFormChange('role', e.target.value)}
                        className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>

                    {formData.role === 'teacher' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Teacher Type</label>
                        <select
                          value={formData.teacherType}
                          onChange={(e) => handleFormChange('teacherType', e.target.value)}
                          className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select type</option>
                          <option value="coordinator">Coordinator</option>
                          <option value="director">Director</option>
                          <option value="class_teacher">Class Teacher</option>
                          <option value="subject_teacher">Subject Teacher</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Account Status</label>
                      <div className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => handleFormChange('isActive', !formData.isActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.isActive ? 'bg-green-600' : 'bg-gray-200'
                          }`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            formData.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`} />
                        </button>
                        <span className="text-sm font-medium text-gray-700">
                          {formData.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Coordinator Classes Selection */}
                  {formData.role === 'teacher' && formData.teacherType === 'coordinator' && (
                    <div className="mt-6">
                      <label className="block text-sm font-bold text-gray-700 mb-3">
                        Coordinator Classes (Select classes this coordinator will manage)
                      </label>
                      <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                        {classLevels.map(className => (
                          <label key={className} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={formData.coordinatorClasses.includes(className)}
                              onChange={() => handleClassToggle(className)}
                              className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm font-bold text-blue-800">{className}</span>
                          </label>
                        ))}
                      </div>
                      {formData.coordinatorClasses.length > 0 && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-700 font-medium">
                            Selected: {formData.coordinatorClasses.join(', ')}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Section */}
                {showPasswordSection && (
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Change Password</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minLength={8}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Confirm Password</label>
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/70 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          minLength={8}
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={handlePasswordUpdate}
                        disabled={saving || !passwordData.newPassword || !passwordData.confirmPassword}
                        className="px-6 py-3 bg-yellow-600 text-white rounded-xl hover:bg-yellow-700 disabled:opacity-50 font-bold flex items-center space-x-2"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Update Password</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowPasswordSection(false)}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 font-bold flex items-center space-x-2 shadow-xl"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserEditPage;