'use client'
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Award, 
  BookOpen, 
  Users, 
  Clock, 
  Edit, 
  MessageSquare, 
  UserCheck,
  GraduationCap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  FileText
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function TeacherDetailPage() {
  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const teacherId = params?.id;

  useEffect(() => {
    if (teacherId) {
      fetchTeacherDetails();
    }
  }, [teacherId]);

  const fetchTeacherDetails = async () => {
    try {
      const response = await fetch(`/api/protected/teachers/director/teachers/${teacherId}`, {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTeacher(data.data.teacher);
      } else {
        setError(data.error || 'Failed to fetch teacher details');
      }
    } catch (error) {
      console.error('Teacher detail fetch error:', error);
      setError('Failed to fetch teacher details');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getExperienceLevel = (years) => {
    if (years >= 10) return { label: 'Expert', color: 'emerald', bg: 'from-emerald-500 to-teal-500' };
    if (years >= 5) return { label: 'Senior', color: 'blue', bg: 'from-blue-500 to-cyan-500' };
    if (years >= 2) return { label: 'Mid-level', color: 'purple', bg: 'from-purple-500 to-pink-500' };
    return { label: 'Junior', color: 'orange', bg: 'from-yellow-500 to-orange-500' };
  };

  const getActivityStatus = (lastLogin) => {
    if (!lastLogin) return { status: 'Never logged in', color: 'gray', icon: AlertCircle };
    
    const daysSinceLogin = Math.floor((new Date() - new Date(lastLogin)) / (1000 * 60 * 60 * 24));
    if (daysSinceLogin === 0) return { status: 'Active today', color: 'green', icon: CheckCircle };
    if (daysSinceLogin <= 7) return { status: `Active ${daysSinceLogin} days ago`, color: 'blue', icon: Clock };
    if (daysSinceLogin <= 30) return { status: `Last seen ${daysSinceLogin} days ago`, color: 'yellow', icon: Clock };
    return { status: `Inactive (${daysSinceLogin} days)`, color: 'red', icon: AlertCircle };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
                </div>
                <p className="text-white mt-6 font-medium text-lg">Loading teacher details...</p>
                <p className="text-gray-400 text-sm mt-2">Fetching comprehensive information</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Teacher</h2>
            <p className="text-red-300 mb-6">{error}</p>
            <button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-gray-500/20 to-gray-600/20 border border-gray-500/30 rounded-xl p-8 text-center">
            <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Teacher Not Found</h2>
            <p className="text-gray-300 mb-6">The requested teacher profile could not be found.</p>
            <button 
              onClick={() => router.back()}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-transform"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const experienceLevel = getExperienceLevel(teacher.experienceYears || 0);
  const activityStatus = getActivityStatus(teacher.lastLogin);
  const ActivityIcon = activityStatus.icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with Back Button */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Teachers</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit Profile
              </button>
              <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>

        {/* Main Profile Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 sticky top-6">
              
              {/* Avatar and Basic Info */}
              <div className="text-center mb-6">
                <div className={`w-32 h-32 rounded-3xl bg-gradient-to-br ${experienceLevel.bg} flex items-center justify-center text-white font-bold text-4xl shadow-2xl mx-auto mb-4`}>
                  {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">
                  {teacher.firstName} {teacher.lastName}
                </h1>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <span className={`px-4 py-2 text-sm font-bold rounded-full bg-gradient-to-r from-${experienceLevel.color}-500/20 to-${experienceLevel.color}-600/20 text-${experienceLevel.color}-300 border border-${experienceLevel.color}-500/30`}>
                    {experienceLevel.label} Teacher
                  </span>
                </div>
                
                {teacher.department && (
                  <p className="text-gray-300 text-sm capitalize px-3 py-1 bg-white/10 rounded-full border border-white/20 inline-block">
                    {teacher.department} Department
                  </p>
                )}
              </div>

              {/* Contact Information */}
              <div className="space-y-4 border-t border-white/10 pt-6">
                <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="text-white">{teacher.email}</p>
                  </div>
                </div>

                {teacher.phone && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <Phone className="w-5 h-5 text-green-400" />
                    <div>
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white">{teacher.phone}</p>
                    </div>
                  </div>
                )}

                {teacher.address && (
                  <div className="flex items-center gap-3 text-gray-300">
                    <MapPin className="w-5 h-5 text-red-400" />
                    <div>
                      <p className="text-sm text-gray-400">Address</p>
                      <p className="text-white">{teacher.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-300">
                  <ActivityIcon className={`w-5 h-5 text-${activityStatus.color}-400`} />
                  <div>
                    <p className="text-sm text-gray-400">Status</p>
                    <p className={`text-${activityStatus.color}-300 font-medium`}>{activityStatus.status}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Professional Information */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <GraduationCap className="w-6 h-6 text-blue-400" />
                Professional Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Employee ID</p>
                    <p className="text-white font-semibold">{teacher.employeeId || 'Not assigned'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Experience</p>
                    <p className="text-white font-semibold">{teacher.experienceYears || 0} years</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Qualification</p>
                    <p className="text-white font-semibold">{teacher.qualification || 'Not specified'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Joining Date</p>
                    <p className="text-white font-semibold">{formatDate(teacher.joiningDate)}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Account Status</p>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${teacher.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <p className={`font-semibold ${teacher.isActive ? 'text-green-300' : 'text-red-300'}`}>
                        {teacher.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Last Login</p>
                    <p className="text-white font-semibold">{formatDate(teacher.lastLogin)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects Teaching */}
            {teacher.subjects && teacher.subjects.length > 0 && (
              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                  <BookOpen className="w-6 h-6 text-emerald-400" />
                  Subjects Teaching
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teacher.subjects.map((subject, index) => (
                    <div key={index} className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl p-6 border border-blue-500/20">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-white">{subject.name}</h3>
                          <p className="text-blue-300 text-sm font-medium">{subject.code}</p>
                        </div>
                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 capitalize">
                          {subject.category?.toLowerCase() || 'General'}
                        </span>
                      </div>
                      
                      {subject.classes && subject.classes.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Classes</p>
                          <div className="flex flex-wrap gap-2">
                            {subject.classes.map((className, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs font-medium rounded-lg bg-white/10 text-gray-300 border border-white/20">
                                {className}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{teacher.subjects?.length || 0}</p>
                    <p className="text-blue-300 text-sm font-medium">Subjects</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">{teacher.experienceYears || 0}</p>
                    <p className="text-emerald-300 text-sm font-medium">Years Exp.</p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {teacher.subjects?.reduce((total, subject) => total + (subject.classes?.length || 0), 0) || 0}
                    </p>
                    <p className="text-purple-300 text-sm font-medium">Classes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Actions */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
              <h2 className="text-2xl font-bold text-white mb-6">Quick Actions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-3">
                  <FileText className="w-5 h-5" />
                  View Performance Report
                </button>
                
                <button className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-4 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-3">
                  <Calendar className="w-5 h-5" />
                  View Timetable
                </button>
                
                <button className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-4 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-3">
                  <TrendingUp className="w-5 h-5" />
                  Analytics
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}