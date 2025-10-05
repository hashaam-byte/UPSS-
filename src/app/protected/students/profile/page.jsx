// /app/protected/students/profile/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Edit,
  Save,
  X,
  Camera,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  BookOpen,
  Users,
  Award
} from 'lucide-react';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/protected/students/profile');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setFormData({
          phone: data.data.phone || '',
          address: data.data.address || '',
          parentName: data.data.studentProfile?.parentName || '',
          parentPhone: data.data.studentProfile?.parentPhone || '',
          parentEmail: data.data.studentProfile?.parentEmail || ''
        });
      } else {
        throw new Error(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch profile error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/protected/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      
      if (data.success) {
        setProfile(data.data);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError(err.message);
      console.error('Update profile error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading your profile...</span>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchProfile}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
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
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your personal information</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{saving ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  onClick={() => {
                    setEditing(false);
                    setError(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-white" />
                    )}
                  </div>
                  <button className="absolute bottom-0 right-0 w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-colors">
                    <Camera className="w-5 h-5" />
                  </button>
                </div>
                
                <h2 className="text-2xl font-bold text-gray-900 mt-4">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="text-gray-600">{profile.studentProfile?.studentId || 'N/A'}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {profile.studentProfile?.className || 'N/A'} • {profile.studentProfile?.section || 'N/A'}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3 text-gray-600">
                  <Mail className="w-5 h-5" />
                  <span className="text-sm">{profile.email}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Phone className="w-5 h-5" />
                    <span className="text-sm">{profile.phone}</span>
                  </div>
                )}
                {profile.dateOfBirth && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <Calendar className="w-5 h-5" />
                    <span className="text-sm">
                      {new Date(profile.dateOfBirth).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {profile.address && (
                  <div className="flex items-center space-x-3 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span className="text-sm">{profile.address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Academic Stats */}
            <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-purple-600" />
                    <span className="text-sm text-gray-600">Current GPA</span>
                  </div>
                  <span className="font-semibold text-gray-900">3.8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Subjects</span>
                  </div>
                  <span className="font-semibold text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600">Attendance</span>
                  </div>
                  <span className="font-semibold text-gray-900">95%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      editing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    disabled={!editing}
                    rows={3}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      editing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Parent/Guardian Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Name
                  </label>
                  <input
                    type="text"
                    value={formData.parentName}
                    onChange={(e) => setFormData({...formData, parentName: e.target.value})}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      editing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({...formData, parentPhone: e.target.value})}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      editing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({...formData, parentEmail: e.target.value})}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-xl ${
                      editing ? 'bg-white' : 'bg-gray-50 cursor-not-allowed'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Academic Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student ID
                  </label>
                  <input
                    type="text"
                    value={profile.studentProfile?.studentId || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <input
                    type="text"
                    value={profile.studentProfile?.className || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Section
                  </label>
                  <input
                    type="text"
                    value={profile.studentProfile?.section || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={profile.studentProfile?.department || 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admission Date
                  </label>
                  <input
                    type="text"
                    value={profile.studentProfile?.admissionDate ? new Date(profile.studentProfile.admissionDate).toLocaleDateString() : 'N/A'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;