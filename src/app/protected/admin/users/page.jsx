'use client'
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  Shield,
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  MoreVertical,
  UserPlus,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Zap,
  Star,
  Activity,
  Crown,
  BookOpen,
  ChevronDown
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const AdminUsersPage = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('students');
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availableArms, setAvailableArms] = useState([]); // New state for arms
  const [loadingArms, setLoadingArms] = useState(false); // Loading state for arms

  const tabs = [
    { id: 'students', label: 'Students', icon: GraduationCap, count: 0, gradient: 'from-blue-500 to-cyan-500' },
    { id: 'teachers', label: 'Teachers', icon: UserCheck, count: 0, gradient: 'from-emerald-500 to-teal-500' },
    { id: 'admins', label: 'Admins', icon: Shield, count: 0, gradient: 'from-purple-500 to-pink-500' }
  ];

  const classLevels = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'];

  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    role: 'student',
    phone: '',
    dateOfBirth: '',
    address: '',
    gender: '',
    teacherType: '',
    coordinatorClasses: [], // For coordinator classes
    classTeacherArms: []    // New field for class teacher arms
  });

  useEffect(() => {
    fetchUsers();
  }, [activeTab, currentPage, searchQuery]);

  // New function to fetch available arms for a school
  const fetchAvailableArms = async () => {
    try {
      setLoadingArms(true);
      const response = await fetch('/api/protected/admin/school/arms');
      const data = await response.json();

      if (response.ok) {
        setAvailableArms(data.arms || []);
      } else {
        console.error('Failed to fetch arms:', data.error);
        setAvailableArms(['Silver', 'Diamond', 'Gold']); // Fallback to default arms
      }
    } catch (error) {
      console.error('Error fetching arms:', error);
      setAvailableArms(['Silver', 'Diamond', 'Gold']); // Fallback to default arms
    } finally {
      setLoadingArms(false);
    }
  };

  // Fetch arms when modal opens and class_teacher is selected
  useEffect(() => {
    if (showCreateModal && createForm.teacherType === 'class_teacher') {
      fetchAvailableArms();
    }
  }, [showCreateModal, createForm.teacherType]);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        role: activeTab === 'students' ? 'student' : activeTab === 'teachers' ? 'teacher' : 'admin',
        ...(searchQuery && { search: searchQuery })
      });

      const response = await fetch(`/api/protected/admin/users?${params}`);
      const data = await response.json();

      if (response.ok) {
        setUsers(data.users || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        setError(data.error || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation for coordinator
    if (createForm.teacherType === 'coordinator' && createForm.coordinatorClasses.length === 0) {
      setError('Please select at least one class for the coordinator to manage');
      return;
    }

    // Validation for class teacher
    if (createForm.teacherType === 'class_teacher' && createForm.classTeacherArms.length === 0) {
      setError('Please select at least one class arm for the class teacher');
      return;
    }
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/protected/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...createForm,
          // Include coordinator classes if it's a coordinator
          ...(createForm.teacherType === 'coordinator' && {
            coordinatorClasses: createForm.coordinatorClasses
          }),
          // Include class teacher arms if it's a class teacher
          ...(createForm.teacherType === 'class_teacher' && {
            classTeacherArms: createForm.classTeacherArms
          })
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('User created successfully');
        setShowCreateModal(false);
        setCreateForm({
          firstName: '',
          lastName: '',
          email: '',
          username: '',
          password: '',
          role: 'student',
          phone: '',
          dateOfBirth: '',
          address: '',
          gender: '',
          teacherType: '',
          coordinatorClasses: [],
          classTeacherArms: []
        });
        fetchUsers();
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/protected/admin/users/${userId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('User deleted successfully');
        fetchUsers();
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Network error occurred');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`/api/protected/admin/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
        fetchUsers();
      } else {
        setError(data.error || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Network error occurred');
    }
  };

  const handleEditUser = (userId) => {
    router.push(`/protected/admin/users/${userId}/edit`);
  };

  const generatePassword = () => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    setCreateForm(prev => ({ ...prev, password }));
  };

  const handleClassToggle = (className) => {
    setCreateForm(prev => ({
      ...prev,
      coordinatorClasses: prev.coordinatorClasses.includes(className)
        ? prev.coordinatorClasses.filter(c => c !== className)
        : [...prev.coordinatorClasses, className]
    }));
  };

  // New function for handling class teacher arm selection
  const handleArmToggle = (arm) => {
    setCreateForm(prev => ({
      ...prev,
      classTeacherArms: prev.classTeacherArms.includes(arm)
        ? prev.classTeacherArms.filter(a => a !== arm)
        : [...prev.classTeacherArms, arm]
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTeacherTypeDisplay = (teacherProfile) => {
    if (!teacherProfile) return null;
    
    const typeMap = {
      coordinator: 'Coordinator',
      director: 'Director', 
      class_teacher: 'Class Teacher',
      subject_teacher: 'Subject Teacher'
    };
    
    return typeMap[teacherProfile.department] || teacherProfile.department;
  };

  const getCoordinatorClasses = (user) => {
    if (user.role !== 'teacher' || user.teacherProfile?.department !== 'coordinator') {
      return null;
    }
    
    // Get classes from TeacherSubjects relations
    const classes = user.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    return [...new Set(classes)];
  };

  // New function to get class teacher arms
  const getClassTeacherArms = (user) => {
    if (user.role !== 'teacher' || user.teacherProfile?.department !== 'class_teacher') {
      return null;
    }
    
    // Get arms from TeacherSubjects relations for class teachers
    const arms = user.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [];
    return [...new Set(arms)];
  };

  if (isLoading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl animate-pulse shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-3xl animate-ping opacity-75"></div>
            </div>
          </div>
          <p className="text-gray-700 mt-6 font-bold text-lg">Loading User Database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="space-y-8">
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-8">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
                <span className="text-emerald-600 font-bold text-sm uppercase tracking-wider">User Management System</span>
              </div>
              <h1 className="text-5xl font-black bg-gradient-to-r from-gray-800 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                Personnel Control
              </h1>
              <p className="text-gray-600 text-xl font-medium">
                Advanced user account management and analytics
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowImportModal && setShowImportModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-600 px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-lg border border-purple-300/50 flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 hover:scale-105 shadow-xl flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="relative z-10">Add User</span>
              </button>
            </div>
          </div>
        </div>

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="relative overflow-hidden bg-gradient-to-r from-emerald-50/90 to-green-50/90 backdrop-blur-sm border border-emerald-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-emerald-700 font-bold text-lg">{successMessage}</p>
              </div>
              <button onClick={() => setSuccessMessage('')} className="p-2 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="relative overflow-hidden bg-gradient-to-r from-red-50/90 to-pink-50/90 backdrop-blur-sm border border-red-300 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-red-700 font-bold text-lg">{error}</p>
              </div>
              <button onClick={() => setError('')} className="p-2 text-red-600 hover:bg-red-100 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Enhanced Tabs and Content */}
        <div className="relative overflow-hidden bg-gradient-to-br from-white/80 to-blue-50/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50">
          <div className="p-8">
            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`group relative overflow-hidden px-6 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-3 ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.gradient} text-white border-0`
                        : 'bg-white/50 text-gray-600 hover:bg-white/80 border border-gray-200/50'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 ${
                      activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <div className="font-black">{tab.label}</div>
                      <div className="text-xs opacity-80 font-medium">
                        {users.length} active
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={`Search ${activeTab}...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 bg-white/50 border border-gray-200/50 rounded-2xl text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all font-medium shadow-lg backdrop-blur-sm"
                />
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-3 px-6 py-4 bg-white/50 hover:bg-white/80 text-gray-600 hover:text-gray-800 border border-gray-200/50 rounded-2xl transition-all font-bold shadow-lg">
                  <Filter className="w-5 h-5" />
                  Filter
                </button>
                <button className="flex items-center gap-3 px-6 py-4 bg-white/50 hover:bg-white/80 text-gray-600 hover:text-gray-800 border border-gray-200/50 rounded-2xl transition-all font-bold shadow-lg">
                  <Download className="w-5 h-5" />
                  Export
                </button>
              </div>
            </div>

            {/* Users Table */}
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-gray-600 font-bold">Loading users...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200/50">
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers(users.map(u => u.id));
                              } else {
                                setSelectedUsers([]);
                              }
                            }}
                          />
                        </th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">User Profile</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Contact Info</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Role & Permissions</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">System Status</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Registration</th>
                        <th className="text-left py-4 px-6 font-black text-gray-700 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const coordinatorClasses = getCoordinatorClasses(user);
                        const classTeacherArms = getClassTeacherArms(user);
                        return (
                          <tr key={user.id} className="border-b border-gray-100/50 hover:bg-white/50 transition-colors group">
                            <td className="py-4 px-6">
                              <input 
                                type="checkbox" 
                                className="w-5 h-5 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                                checked={selectedUsers.includes(user.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedUsers([...selectedUsers, user.id]);
                                  } else {
                                    setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                                  }
                                }}
                              />
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-lg">
                                    {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                                  </div>
                                  {user.role === 'admin' && (
                                    <Crown className="absolute -top-1 -right-1 w-5 h-5 text-yellow-500" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 text-lg">
                                    {user.firstName} {user.lastName}
                                  </p>
                                  <p className="text-sm text-gray-500 font-medium">@{user.username}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                  <Mail className="w-4 h-4" />
                                  <span className="font-medium">{user.email}</span>
                                </div>
                                {user.phone && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    <span className="font-medium">{user.phone}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${
                                    user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                    user.role === 'teacher' ? 'bg-emerald-100 text-emerald-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {user.role.toUpperCase()}
                                  </span>
                                  {user.role === 'teacher' && (
                                    <span className="text-xs text-gray-600 font-medium">
                                      {getTeacherTypeDisplay(user.teacherProfile)}
                                    </span>
                                  )}
                                </div>
                                {coordinatorClasses && coordinatorClasses.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {coordinatorClasses.slice(0, 3).map(className => (
                                      <span key={className} className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-full font-medium">
                                        {className}
                                      </span>
                                    ))}
                                    {coordinatorClasses.length > 3 && (
                                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">
                                        +{coordinatorClasses.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                                {classTeacherArms && classTeacherArms.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {classTeacherArms.slice(0, 3).map(arm => (
                                      <span key={arm} className="text-xs px-2 py-1 bg-green-50 text-green-600 rounded-full font-medium">
                                        {arm}
                                      </span>
                                    ))}
                                    {classTeacherArms.length > 3 && (
                                      <span className="text-xs px-2 py-1 bg-gray-50 text-gray-600 rounded-full font-medium">
                                        +{classTeacherArms.length - 3} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="space-y-2">
                                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-black shadow-sm ${
                                  user.isActive 
                                    ? 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 border border-emerald-300' 
                                    : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border border-red-300'
                                }`}>
                                  {user.isActive ? 'ONLINE' : 'OFFLINE'}
                                </span>
                                <div className={`text-xs font-bold ${
                                  user.isEmailVerified ? 'text-emerald-600' : 'text-yellow-600'
                                }`}>
                                  {user.isEmailVerified ? '✓ VERIFIED' : '⚠ PENDING'}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                {formatDate(user.createdAt)}
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleToggleUserStatus(user.id, user.isActive)}
                                  className={`p-2 rounded-xl transition-all shadow-lg ${
                                    user.isActive 
                                      ? 'text-red-600 hover:bg-red-100 border border-red-200' 
                                      : 'text-emerald-600 hover:bg-emerald-100 border border-emerald-200'
                                  }`}
                                  title={user.isActive ? 'Deactivate user' : 'Activate user'}
                                >
                                  {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                                <button
                                  onClick={() => handleEditUser(user.id)}
                                  className="p-2 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-lg"
                                  title="Edit user"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl transition-all shadow-lg"
                                  title="Delete user"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-8">
                    <div className="text-sm text-gray-600 font-medium">
                      Page {currentPage} of {totalPages} • {users.length} users displayed
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-6 py-3 bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-xl transition-all font-bold shadow-lg border border-gray-200/50"
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-6 py-3 bg-white/50 hover:bg-white/80 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-xl transition-all font-bold shadow-lg border border-gray-200/50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200/50 p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">Create New User</h2>
                  <p className="text-gray-600 font-medium">Add a new account to the system</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.firstName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, firstName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.lastName}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, lastName: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                    Username
                  </label>
                  <input
                    type="text"
                    value={createForm.username}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      User Role *
                    </label>
                    <select
                      value={createForm.role}
                      onChange={(e) => setCreateForm(prev => ({ 
                        ...prev, 
                        role: e.target.value, 
                        teacherType: '', 
                        coordinatorClasses: [],
                        classTeacherArms: []
                      }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      required
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  {createForm.role === 'teacher' && (
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                        Teacher Type *
                      </label>
                      <select
                        value={createForm.teacherType}
                        onChange={e => setCreateForm(prev => ({ 
                          ...prev, 
                          teacherType: e.target.value, 
                          coordinatorClasses: [],
                          classTeacherArms: []
                        }))}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                        required
                      >
                        <option value="">Select type</option>
                        <option value="coordinator">Coordinator</option>
                        <option value="director">Director</option>
                        <option value="class_teacher">Class Teacher</option>
                        <option value="subject_teacher">Subject Teacher</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* Coordinator Classes Selection */}
                {createForm.role === 'teacher' && createForm.teacherType === 'coordinator' && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                      Coordinator Classes * (Select classes this coordinator will manage)
                    </label>
                    <div className="grid grid-cols-3 gap-3 p-4 bg-blue-50 rounded-xl border border-blue-200">
                      {classLevels.map(className => (
                        <label key={className} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={createForm.coordinatorClasses.includes(className)}
                            onChange={() => handleClassToggle(className)}
                            className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-bold text-blue-800">{className}</span>
                        </label>
                      ))}
                    </div>
                    {createForm.coordinatorClasses.length > 0 && (
                      <div className="mt-2 p-2 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">
                          Selected: {createForm.coordinatorClasses.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Class Teacher Arms Selection */}
                {createForm.role === 'teacher' && createForm.teacherType === 'class_teacher' && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-3 uppercase tracking-wider">
                      Class Teacher Arms * (Select class arms this teacher will manage)
                    </label>
                    {loadingArms ? (
                      <div className="flex items-center justify-center p-4 bg-green-50 rounded-xl border border-green-200">
                        <Loader2 className="w-5 h-5 animate-spin text-green-600 mr-2" />
                        <span className="text-green-700 font-medium">Loading available arms...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-4 gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
                        {availableArms.map(arm => (
                          <label key={arm} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={createForm.classTeacherArms.includes(arm)}
                              onChange={() => handleArmToggle(arm)}
                              className="w-4 h-4 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500"
                            />
                            <span className="text-sm font-bold text-green-800">{arm}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    {createForm.classTeacherArms.length > 0 && (
                      <div className="mt-2 p-2 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700 font-medium">
                          Selected Arms: {createForm.classTeacherArms.join(', ')}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                    Password *
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      value={createForm.password}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                      className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-xl transition-all font-bold shadow-lg"
                      title="Generate secure password"
                    >
                      <Zap className="w-4 h-4" />
                    </button>
                  </div>
                  {createForm.password && (
                    <p className="text-xs text-gray-500 mt-1">Password: {createForm.password}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={createForm.phone}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2 uppercase tracking-wider">
                      Gender
                    </label>
                    <select
                      value={createForm.gender}
                      onChange={(e) => setCreateForm(prev => ({ ...prev, gender: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-all font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all font-bold flex items-center justify-center gap-2 shadow-xl"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Create User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;