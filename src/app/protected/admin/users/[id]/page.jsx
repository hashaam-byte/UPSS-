'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin,
  Shield,
  GraduationCap,
  UserCheck,
  AlertTriangle,
  Check,
  X,
  Plus,
  Trash2,
  BookOpen,
  School
} from 'lucide-react';

const UserEditPage = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;

  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [subjects, setSubjects] = useState([]);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    role: 'student',
    isActive: true,
    // Teacher specific fields
    teacherType: '',
    coordinatorClass: '',
    directorClasses: [],
    teacherSubjects: []
  });

  const teacherTypes = [
    { value: 'coordinator', label: 'Class Coordinator' },
    { value: 'director', label: 'Academic Director' },
    { value: 'class_teacher', label: 'Class Teacher' },
    { value: 'subject_teacher', label: 'Subject Teacher' }
  ];

  const classOptions = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];

  useEffect(() => {
    if (userId) {
      fetchUser();
      fetchSubjects();
    }
  }, [userId]);

  const fetchUser = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/protected/admin/users/${userId}`);
      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setFormData({
          firstName: data.user.firstName || '',
          lastName: data.user.lastName || '',
          email: data.user.email || '',
          username: data.user.username || '',
          phone: data.user.phone || '',
          dateOfBirth: data.user.dateOfBirth ? data.user.dateOfBirth.split('T')[0] : '',
          address: data.user.address || '',
          gender: data.user.gender || '',
          role: data.user.role,
          isActive: data.user.isActive,
          // Teacher profile data
          teacherType: data.user.teacherProfile?.teacherType || '',
          coordinatorClass: data.user.teacherProfile?.coordinatorClass || '',
          directorClasses: data.user.teacherProfile?.directorClasses || [],
          teacherSubjects: data.user.teacherProfile?.teacherSubjects || []
        });
      } else {
        setError(data.error || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/protected/admin/subjects');
      const data = await response.json();
      if (response.ok) {
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      const payload = {
        ...formData,
        dateOfBirth: formData.dateOfBirth || null
      };

      const response = await fetch(`/api/protected/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('User updated successfully');
        setTimeout(() => {
          router.push('/admin/users');
        }, 1500);
      } else {
        setError(data.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Network error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const addDirectorClass = () => {
    setFormData(prev => ({
      ...prev,
      directorClasses: [...prev.directorClasses, '']
    }));
  };

  const updateDirectorClass = (index, value) => {
    setFormData(prev => ({
      ...prev,
      directorClasses: prev.directorClasses.map((cls, i) => i === index ? value : cls)
    }));
  };

  const removeDirectorClass = (index) => {
    setFormData(prev => ({
      ...prev,
      directorClasses: prev.directorClasses.filter((_, i) => i !== index)
    }));
  };

  const addTeacherSubject = () => {
    setFormData(prev => ({
      ...prev,
      teacherSubjects: [...prev.teacherSubjects, { subjectId: '', classes: [] }]
    }));
  };

  const updateTeacherSubject = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      teacherSubjects: prev.teacherSubjects.map((subject, i) => 
        i === index ? { ...subject, [field]: value } : subject
      )
    }));
  };

  const removeTeacherSubject = (index) => {
    setFormData(prev => ({
      ...prev,
      teacherSubjects: prev.teacherSubjects.filter((_, i) => i !== index)
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl animate-pulse shadow-2xl flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Loading User Details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/users')}
                className="p-3 bg-white/50 hover:bg-white/80 text-gray-600 rounded-2xl transition-all shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                  Edit User
                </h1>
                <p className="text-gray-600 font-medium">
                  Update user information and permissions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`px-4 py-2 rounded-xl font-bold text-sm ${
                user?.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                user?.role === 'teacher' ? 'bg-emerald-100 text-emerald-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {user?.role?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMessage && (
          <div className="bg-gradient-to-r from-emerald-50/90 to-green-50/90 border border-emerald-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <p className="text-emerald-700 font-bold text-lg">{successMessage}</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-gradient-to-r from-red-50/90 to-pink-50/90 border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <p className="text-red-700 font-bold text-lg">{error}</p>
              <button onClick={() => setError('')} className="ml-auto p-2 text-red-600 hover:bg-red-100 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-black text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                  Account Status
                </label>
                <select
                  value={formData.isActive.toString()}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                  className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                Address
              </label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                rows={3}
              />
            </div>
          </div>

          {/* Teacher-specific sections */}
          {formData.role === 'teacher' && (
            <div className="bg-gradient-to-br from-white/80 to-emerald-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
              <div className="flex items-center gap-3 mb-6">
                <GraduationCap className="w-6 h-6 text-emerald-600" />
                <h2 className="text-2xl font-black text-gray-900">Teacher Configuration</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                    Teacher Type *
                  </label>
                  <select
                    value={formData.teacherType}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      teacherType: e.target.value,
                      coordinatorClass: '',
                      directorClasses: [],
                      teacherSubjects: []
                    }))}
                    className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                    required
                  >
                    <option value="">Select teacher type</option>
                    {teacherTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Coordinator Class Selection */}
                {formData.teacherType === 'coordinator' && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      Coordinator Class *
                    </label>
                    <select
                      value={formData.coordinatorClass}
                      onChange={(e) => setFormData(prev => ({ ...prev, coordinatorClass: e.target.value }))}
                      className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                      required
                    >
                      <option value="">Select class</option>
                      {classOptions.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Director Classes */}
                {formData.teacherType === 'director' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">
                        Director Classes *
                      </label>
                      <button
                        type="button"
                        onClick={addDirectorClass}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Class
                      </button>
                    </div>
                    <div className="space-y-3">
                      {formData.directorClasses.map((cls, index) => (
                        <div key={index} className="flex gap-3">
                          <select
                            value={cls}
                            onChange={(e) => updateDirectorClass(index, e.target.value)}
                            className="flex-1 px-4 py-3 bg-white/50 border border-gray-200 rounded-2xl text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                            required
                          >
                            <option value="">Select class</option>
                            {classOptions.map(classOption => (
                              <option key={classOption} value={classOption}>{classOption}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeDirectorClass(index)}
                            className="p-3 text-red-600 hover:bg-red-100 rounded-2xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {formData.directorClasses.length === 0 && (
                        <p className="text-gray-500 italic">No classes assigned. Click "Add Class" to start.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Subject Teacher Assignments */}
                {formData.teacherType === 'subject_teacher' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="block text-sm font-black text-gray-700 uppercase tracking-wider">
                        Subject Assignments *
                      </label>
                      <button
                        type="button"
                        onClick={addTeacherSubject}
                        className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all"
                      >
                        <Plus className="w-4 h-4" />
                        Add Subject
                      </button>
                    </div>
                    <div className="space-y-4">
                      {formData.teacherSubjects.map((subject, index) => (
                        <div key={index} className="bg-white/30 p-4 rounded-2xl border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-bold text-gray-800">Subject #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeTeacherSubject(index)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                              <select
                                value={subject.subjectId}
                                onChange={(e) => updateTeacherSubject(index, 'subjectId', e.target.value)}
                                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                                required
                              >
                                <option value="">Select subject</option>
                                {subjects.map(subj => (
                                  <option key={subj.id} value={subj.id}>{subj.name} ({subj.code})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Classes</label>
                              <select
                                multiple
                                value={subject.classes || []}
                                onChange={(e) => {
                                  const selectedClasses = Array.from(e.target.selectedOptions, option => option.value);
                                  updateTeacherSubject(index, 'classes', selectedClasses);
                                }}
                                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-emerald-500 transition-all"
                                size={6}
                              >
                                {classOptions.map(cls => (
                                  <option key={cls} value={cls}>{cls}</option>
                                ))}
                              </select>
                              <p className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple classes</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {formData.teacherSubjects.length === 0 && (
                        <p className="text-gray-500 italic">No subjects assigned. Click "Add Subject" to start.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-end">
            <button
              type="button"
              onClick={() => router.push('/admin/users')}
              className="px-8 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white rounded-2xl font-bold flex items-center gap-3 transition-all shadow-xl"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserEditPage;