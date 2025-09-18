'use client'
import React, { useEffect, useState } from 'react';
import { UserCheck, Eye, MessageSquare, Search, Filter, Plus, Users, Award, Clock, Mail, Phone } from 'lucide-react';

export default function DirectorTeachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await fetch('/api/protected/teachers/director/teachers', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setTeachers(data.data.teachers);
        // Extract unique departments
        const uniqueDepts = [...new Set(data.data.teachers.map(t => t.department))].filter(Boolean);
        setDepartments(uniqueDepts);
      } else {
        setError(data.error || 'Failed to fetch teachers');
      }
    } catch (error) {
      console.error('Teachers fetch error:', error);
      setError('Failed to fetch teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = teacher.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === 'all' || teacher.department === filterDepartment;
    return matchesSearch && matchesDepartment;
  });

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getPerformanceColor = (experience) => {
    if (experience >= 5) return 'from-emerald-500 to-teal-500';
    if (experience >= 2) return 'from-blue-500 to-cyan-500';
    return 'from-yellow-500 to-orange-500';
  };

  const getExperienceLevel = (years) => {
    if (years >= 10) return { label: 'Expert', color: 'emerald' };
    if (years >= 5) return { label: 'Senior', color: 'blue' };
    if (years >= 2) return { label: 'Mid-level', color: 'purple' };
    return { label: 'Junior', color: 'orange' };
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
              </div>
              <p className="text-white mt-6 font-medium text-lg">Loading teachers...</p>
              <p className="text-gray-400 text-sm mt-2">Fetching teaching staff data</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-white">
              Teachers Management
            </h1>
            <p className="text-gray-300 text-lg">
              Oversee and manage teaching staff in your stage
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{teachers.length} Teachers</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                <Award className="w-4 h-4" />
                <span className="text-sm font-medium">{teachers.filter(t => t.experienceYears >= 5).length} Senior Staff</span>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.href = '/protected/teacher/director/teachers/reports'}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Award className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Performance Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search teachers by name or email..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-3">
            <div className="relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                className="bg-white/10 border border-white/20 rounded-xl pl-10 pr-8 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
              >
                <option value="all" className="bg-gray-800">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept} className="bg-gray-800 capitalize">{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 flex items-center text-red-300 shadow-lg backdrop-blur-xl">
          <MessageSquare className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Teachers Grid */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {filteredTeachers.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <UserCheck className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Teachers Found</h3>
            <p className="text-gray-400">
              {searchTerm || filterDepartment !== 'all' 
                ? 'Try adjusting your search criteria' 
                : 'No teachers have been assigned to your stage yet'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            {filteredTeachers.map((teacher) => {
              const experienceLevel = getExperienceLevel(teacher.experienceYears || 0);
              return (
                <div key={teacher.id} className="group relative">
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                    {/* Header with Avatar */}
                    <div className="relative p-6 pb-4">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                      
                      <div className="flex items-start gap-4 relative">
                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${getPerformanceColor(teacher.experienceYears || 0)} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">
                            {teacher.firstName} {teacher.lastName}
                          </h3>
                          <p className="text-gray-300 text-sm mb-2">{teacher.email}</p>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 text-xs font-bold rounded-full border bg-gradient-to-r from-${experienceLevel.color}-500/20 to-${experienceLevel.color}-600/20 text-${experienceLevel.color}-300 border-${experienceLevel.color}-500/30`}>
                              {experienceLevel.label}
                            </span>
                            {teacher.department && (
                              <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-gray-300 border border-white/20 capitalize">
                                {teacher.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="px-6 pb-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Employee ID</p>
                          <p className="text-white font-medium">{teacher.employeeId || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Experience</p>
                          <p className="text-white font-medium">{teacher.experienceYears || 0} years</p>
                        </div>
                      </div>

                      {/* Subjects */}
                      {teacher.subjects?.length > 0 && (
                        <div className="mb-4">
                          <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Subjects Teaching</p>
                          <div className="flex flex-wrap gap-2">
                            {teacher.subjects.slice(0, 3).map((subject, index) => (
                              <span key={index} className="px-2 py-1 text-xs font-medium rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {subject}
                              </span>
                            ))}
                            {teacher.subjects.length > 3 && (
                              <span className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                +{teacher.subjects.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Last Login */}
                      <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Last login: {formatDate(teacher.lastLogin)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => window.location.href = `/protected/teacher/director/teachers/${teacher.id}`}
                          className="flex-1 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <Eye className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">View</span>
                        </button>
                        
                        <button 
                          onClick={() => window.location.href = `/protected/teacher/director/messages?teacher=${teacher.id}`}
                          className="flex-1 group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <MessageSquare className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Message</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Summary */}
      {filteredTeachers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{filteredTeachers.length}</p>
                <p className="text-blue-300 text-sm font-medium">Total Teachers</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{filteredTeachers.filter(t => t.experienceYears >= 5).length}</p>
                <p className="text-emerald-300 text-sm font-medium">Senior Staff</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{filteredTeachers.filter(t => t.lastLogin && new Date(t.lastLogin) > new Date(Date.now() - 7*24*60*60*1000)).length}</p>
                <p className="text-purple-300 text-sm font-medium">Active This Week</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(filteredTeachers.reduce((sum, t) => sum + (t.experienceYears || 0), 0) / filteredTeachers.length) || 0}</p>
                <p className="text-yellow-300 text-sm font-medium">Avg. Experience</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}