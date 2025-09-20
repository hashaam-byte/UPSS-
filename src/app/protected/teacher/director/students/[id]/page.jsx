'use client'
import React, { useState, useEffect } from 'react';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Users, 
  BookOpen, 
  GraduationCap, 
  AlertCircle, 
  CheckCircle, 
  ArrowLeft, 
  Trash2, 
  UserCheck,
  Clock,
  School,
  Target,
  Activity,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

const IndividualStudentPage = ({ params }) => {
  const [student, setStudent] = useState(null);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  // Edit mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchStudentData();
  }, [params.id]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/protected/teachers/director/students/${params.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch student data: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setStudent(data.data.student);
        setAvailableClasses(data.data.availableClasses);
        setEditData({
          firstName: data.data.student.firstName,
          lastName: data.data.student.lastName,
          email: data.data.student.email,
          phone: data.data.student.phone || '',
          address: data.data.student.address || '',
          dateOfBirth: data.data.student.dateOfBirth ? new Date(data.data.student.dateOfBirth).toISOString().split('T')[0] : '',
          gender: data.data.student.gender || '',
          className: data.data.student.className || '',
          section: data.data.student.section || '',
          studentId: data.data.student.studentId || '',
          parentName: data.data.student.parentName || '',
          parentPhone: data.data.student.parentPhone || '',
          parentEmail: data.data.student.parentEmail || '',
          isActive: data.data.student.isActive
        });
      } else {
        throw new Error(data.error || 'Failed to fetch student data');
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/protected/teachers/director/students/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStudent(result.data.student);
        setIsEditing(false);
        
        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
        successDiv.textContent = 'Student updated successfully!';
        document.body.appendChild(successDiv);
        setTimeout(() => document.body.removeChild(successDiv), 3000);

        // If class was assigned, show option to go to students page
        if (result.data.student.hasClassAssignment && student && !student.hasClassAssignment) {
          setTimeout(() => {
            if (confirm('Student has been assigned to a class! Would you like to view all students?')) {
              window.location.href = '/protected/teacher/director/students';
            }
          }, 1000);
        }
      } else {
        throw new Error(result.error || 'Failed to update student');
      }
    } catch (error) {
      console.error('Error updating student:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm('Are you sure you want to deactivate this student? This action can be reversed later.')) {
      return;
    }

    try {
      const response = await fetch(`/api/protected/teachers/director/students/${params.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Navigate back to students list
        window.location.href = '/protected/teacher/director/students';
      } else {
        throw new Error(result.error || 'Failed to deactivate student');
      }
    } catch (error) {
      console.error('Error deactivating student:', error);
      setError(error.message);
    }
  };

  const getGradeInfo = (hasClass) => {
    if (hasClass) {
      return { color: 'emerald', label: 'Assigned', icon: CheckCircle };
    }
    return { color: 'yellow', label: 'Pending', icon: Clock };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white mt-6 font-medium text-lg">Loading student data...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching comprehensive student information</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-8 border border-red-500/30 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error Loading Student</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={fetchStudentData}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Retry
            </button>
            <button 
              onClick={() => window.location.href = '/protected/teacher/director/students'}
              className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-6">
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/20 max-w-md w-full text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Student Not Found</h2>
          <p className="text-gray-300 mb-6">The requested student could not be found or you don't have permission to view them.</p>
          <button 
            onClick={() => window.location.href = '/protected/teacher/director/students'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-semibold hover:scale-105 transition-all"
          >
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  const gradeInfo = getGradeInfo(student.hasClassAssignment);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.location.href = '/protected/teacher/director/students'}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {student.firstName?.[0]}{student.lastName?.[0]}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {student.fullName}
                  </h1>
                  <p className="text-gray-300 flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border bg-gradient-to-r from-${gradeInfo.color}-500/20 to-${gradeInfo.color}-600/20 text-${gradeInfo.color}-300 border-${gradeInfo.color}-500/30`}>
                      <gradeInfo.icon className="w-3 h-3 inline mr-1" />
                      {gradeInfo.label}
                    </span>
                    {student.className && (
                      <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        {student.className}
                      </span>
                    )}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      student.isActive 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              {!isEditing ? (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Student
                  </button>
                  {student.isActive && (
                    <button
                      onClick={handleDeactivate}
                      className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Deactivate
                    </button>
                  )}
                </>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setError(null);
                    }}
                    disabled={saving}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              {error}
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Student Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.firstName}
                        onChange={(e) => setEditData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter first name"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.firstName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.lastName}
                        onChange={(e) => setEditData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter last name"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.lastName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {student.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {student.phone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.dateOfBirth}
                        onChange={(e) => setEditData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Gender</label>
                    {isEditing ? (
                      <select
                        value={editData.gender}
                        onChange={(e) => setEditData(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Address</label>
                  {isEditing ? (
                    <textarea
                      value={editData.address}
                      onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                      rows={3}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all resize-none"
                      placeholder="Enter home address"
                    />
                  ) : (
                    <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                      {student.address || 'Not provided'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Academic Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Student ID</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.studentId}
                        onChange={(e) => setEditData(prev => ({ ...prev, studentId: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter student ID"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.studentId || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Class</label>
                    {isEditing ? (
                      <select
                        value={editData.className}
                        onChange={(e) => setEditData(prev => ({ ...prev, className: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      >
                        <option value="">Select class</option>
                        {['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'].map(className => (
                          <option key={className} value={className}>{className}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        {student.className || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Section</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.section}
                        onChange={(e) => setEditData(prev => ({ ...prev, section: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter section (e.g., A, B)"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.section || 'Not assigned'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Admission Date</label>
                    <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Parent/Guardian Information */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Parent/Guardian Information
                </h2>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parent Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.parentName}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentName: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter parent/guardian name"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10">
                        {student.parentName || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parent Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.parentPhone}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentPhone: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter parent phone number"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        {student.parentPhone || 'Not provided'}
                      </p>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Parent Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.parentEmail}
                        onChange={(e) => setEditData(prev => ({ ...prev, parentEmail: e.target.value }))}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                        placeholder="Enter parent email address"
                      />
                    ) : (
                      <p className="text-white font-medium bg-white/5 px-4 py-3 rounded-xl border border-white/10 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        {student.parentEmail || 'Not provided'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Status Overview
                </h2>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-gray-300">Account Status</span>
                  {isEditing ? (
                    <select
                      value={editData.isActive.toString()}
                      onChange={(e) => setEditData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                      className="bg-white/10 border border-white/20 rounded-lg px-3 py-1 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                      student.isActive 
                        ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
                        : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30'
                    }`}>
                      {student.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-gray-300">Class Assignment</span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border bg-gradient-to-r from-${gradeInfo.color}-500/20 to-${gradeInfo.color}-600/20 text-${gradeInfo.color}-300 border-${gradeInfo.color}-500/30`}>
                    <gradeInfo.icon className="w-3 h-3 inline mr-1" />
                    {gradeInfo.label}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-gray-300">Last Login</span>
                  <span className="text-gray-400 text-sm">
                    {student.lastLogin ? new Date(student.lastLogin).toLocaleDateString() : 'Never'}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-gray-300">Created</span>
                  <span className="text-gray-400 text-sm">
                    {new Date(student.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            {!isEditing && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Quick Actions
                  </h2>
                </div>
                
                <div className="p-6 space-y-3">
                  <button
                    onClick={() => window.location.href = `/protected/teacher/director/messages?student=${student.id}`}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Send Message
                  </button>

                  <button
                    onClick={() => window.location.href = '/protected/teacher/director/students'}
                    className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    All Students
                  </button>

                  {student.needsClassAssignment && (
                    <button
                      onClick={() => window.location.href = '/protected/teacher/director/students/import'}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <UserCheck className="w-4 h-4" />
                      Import Center
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndividualStudentPage;