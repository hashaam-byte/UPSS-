'use client'
import React, { useEffect, useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  MessageSquare, 
  GraduationCap, 
  TrendingUp, 
  AlertCircle, 
  Calendar, 
  Star, 
  Award, 
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Plus,
  Edit,
  Trash2,
  UserPlus,
  FileText,
  Activity,
  Clock,
  ChevronDown,
  X,
  Loader2
} from 'lucide-react';

export default function StudentsManagement() {
  const [apiData, setApiData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStage, setFilterStage] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPerformance, setFilterPerformance] = useState('all');
  const [selectedStudents, setSelectedStudents] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchStudents();
  }, [currentPage, filterClass, filterStage]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      if (filterClass !== 'all') params.append('class', filterClass);
      if (filterStage !== 'all') params.append('stage', filterStage);

      const response = await fetch(`/api/protected/teachers/director/students?${params}`, {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApiData(data.data);
        setError('');
      } else {
        setError(data.error || 'Failed to fetch students');
      }
    } catch (error) {
      console.error('Students fetch error:', error);
      setError('Failed to fetch students. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Get students from API data
  const students = apiData?.students || [];
  const availableClasses = apiData?.filters?.availableClasses || [];
  const classesByStage = apiData?.filters?.classesByStage || { JS: [], SS: [] };
  const availableStages = apiData?.filters?.availableStages || [];
  const pagination = apiData?.pagination || {};
  const summary = apiData?.summary || {};

  // Client-side filtering for search and performance
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.parentName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'active' && student.isActive) ||
      (filterStatus === 'inactive' && !student.isActive);

    const matchesPerformance = filterPerformance === 'all' ||
      (filterPerformance === 'excellent' && student.currentAverage >= 80) ||
      (filterPerformance === 'good' && student.currentAverage >= 70 && student.currentAverage < 80) ||
      (filterPerformance === 'average' && student.currentAverage >= 60 && student.currentAverage < 70) ||
      (filterPerformance === 'below' && student.currentAverage < 60);

    return matchesSearch && matchesStatus && matchesPerformance;
  });

  // Group students by arms/levels for better organization
  const groupStudentsByLevel = () => {
    const grouped = {};
    filteredStudents.forEach(student => {
      const level = student.level || 'Other'; // JS1, SS2, etc.
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push(student);
    });
    
    // Sort levels logically (JS1, JS2, JS3, SS1, SS2, SS3)
    const sortedLevels = Object.keys(grouped).sort((a, b) => {
      const order = ['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3', 'Other'];
      return order.indexOf(a) - order.indexOf(b);
    });
    
    const result = {};
    sortedLevels.forEach(level => {
      result[level] = grouped[level];
    });
    
    return result;
  };

  const studentsByLevel = groupStudentsByLevel();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStudentGrade = (average) => {
    if (!average && average !== 0) return { grade: 'N/A', color: 'gray', label: 'No Data' };
    if (average >= 80) return { grade: 'A', color: 'emerald', label: 'Excellent' };
    if (average >= 70) return { grade: 'B', color: 'blue', label: 'Good' };
    if (average >= 60) return { grade: 'C', color: 'yellow', label: 'Average' };
    if (average >= 50) return { grade: 'D', color: 'orange', label: 'Below Average' };
    return { grade: 'F', color: 'red', label: 'Needs Improvement' };
  };

  const getStageColor = (stage) => {
    if (stage === 'JS') return 'from-green-500 to-emerald-500';
    if (stage === 'SS') return 'from-blue-500 to-indigo-500';
    return 'from-gray-500 to-gray-600';
  };
  // 🔄 Refresh students after import
   const handleImportComplete = () => {
  fetchStudents();
};


  const handleSelectStudent = (studentId) => {
    const newSelected = new Set(selectedStudents);
    if (newSelected.has(studentId)) {
      newSelected.delete(studentId);
    } else {
      newSelected.add(studentId);
    }
    setSelectedStudents(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedStudents(new Set(filteredStudents.map(s => s.id)));
      setShowBulkActions(true);
    }
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterClass('all');
    setFilterStage('all');
    setFilterStatus('all');
    setFilterPerformance('all');
    setCurrentPage(1);
  };

  if (loading && !apiData) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
              </div>
              <p className="text-white mt-6 font-medium text-lg">Loading students...</p>
              <p className="text-gray-400 text-sm mt-2">Fetching comprehensive student data</p>
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
              Students Management
            </h1>
            <p className="text-gray-300 text-lg">
              Comprehensive student monitoring and management system
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">{summary.totalStudents || 0} Total</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">{summary.activeStudents || 0} Active</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">{summary.statistics?.excellentPerformers || 0} Excellent</span>
              </div>
              {summary.statistics?.needsAttention > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-full border border-red-500/30">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{summary.statistics.needsAttention} Need Attention</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.href = '/protected/teacher/director/students/reports'}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <TrendingUp className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Analytics Report</span>
            </button>
            <button 
              onClick={() => window.location.href = '/protected/teacher/director/students/import'}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <UserPlus className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Import Students</span>
            </button>
          </div>
        </div>
      </div>

      {/* Advanced Search and Filters */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="space-y-4">
          {/* Main Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email, student ID, or parent name..."
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-white/10 rounded-xl border border-white/20 p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    viewMode === 'table' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  Table
                </button>
              </div>

              <button 
                onClick={() => {}}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            {/* Stage Filter */}
            <div className="relative">
              <Filter className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <select
                className="bg-white/10 border border-white/20 rounded-xl pl-9 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer text-sm"
                value={filterStage}
                onChange={(e) => {
                  setFilterStage(e.target.value);
                  setFilterClass('all'); // Reset class filter when stage changes
                  setCurrentPage(1);
                }}
              >
                <option value="all" className="bg-gray-800">All Stages</option>
                {availableStages.map(stage => (
                  <option key={stage} value={stage} className="bg-gray-800">
                    {stage === 'JS' ? 'Junior Secondary' : 'Senior Secondary'} ({stage})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Class Filter */}
            <div className="relative">
              <select
                className="bg-white/10 border border-white/20 rounded-xl px-4 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer text-sm"
                value={filterClass}
                onChange={(e) => {
                  setFilterClass(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all" className="bg-gray-800">All Classes</option>
                {filterStage !== 'all' ? (
                  classesByStage[filterStage]?.map(className => (
                    <option key={className} value={className} className="bg-gray-800">{className}</option>
                  ))
                ) : (
                  availableClasses.map(className => (
                    <option key={className} value={className} className="bg-gray-800">{className}</option>
                  ))
                )}
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="bg-white/10 border border-white/20 rounded-xl px-4 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer text-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all" className="bg-gray-800">All Status</option>
                <option value="active" className="bg-gray-800">Active</option>
                <option value="inactive" className="bg-gray-800">Inactive</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                className="bg-white/10 border border-white/20 rounded-xl px-4 pr-8 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm appearance-none cursor-pointer text-sm"
                value={filterPerformance}
                onChange={(e) => setFilterPerformance(e.target.value)}
              >
                <option value="all" className="bg-gray-800">All Performance</option>
                <option value="excellent" className="bg-gray-800">Excellent (80%+)</option>
                <option value="good" className="bg-gray-800">Good (70-79%)</option>
                <option value="average" className="bg-gray-800">Average (60-69%)</option>
                <option value="below" className="bg-gray-800">Below Average (&lt;60%)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none" />
            </div>

            {(searchTerm || filterClass !== 'all' || filterStage !== 'all' || filterStatus !== 'all' || filterPerformance !== 'all') && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 rounded-xl transition-all text-sm"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {showBulkActions && (
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-xl border border-blue-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">{selectedStudents.size}</span>
              </div>
              <span className="text-blue-300 font-medium">
                {selectedStudents.size} student{selectedStudents.size !== 1 ? 's' : ''} selected
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-all text-sm font-medium">
                Export Selected
              </button>
              <button className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium">
                Message Group
              </button>
              <button 
                onClick={() => {
                  setSelectedStudents(new Set());
                  setShowBulkActions(false);
                }}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 flex items-center text-red-300 shadow-lg backdrop-blur-xl">
          <AlertCircle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Students Content */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        {filteredStudents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Students Found</h3>
            <p className="text-gray-400 mb-6">
              {searchTerm || filterClass !== 'all' || filterStage !== 'all' || filterStatus !== 'all' || filterPerformance !== 'all'
                ? 'No students match your current filters' 
                : 'No students have been registered in your stage yet'
              }
            </p>
            {!searchTerm && filterClass === 'all' && filterStage === 'all' && filterStatus === 'all' && filterPerformance === 'all' && (
              <button
                onClick={() => window.location.href = '/protected/teacher/director/students/import'}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <UserPlus className="w-4 h-4" />
                Import Students
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Table Header for Bulk Selection */}
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/50 focus:ring-2"
                    />
                    <span className="text-gray-300 text-sm font-medium">
                      Select All ({filteredStudents.length})
                    </span>
                  </label>
                </div>
                
                <div className="text-gray-400 text-sm">
                  Showing {filteredStudents.length} students
                  {pagination.totalStudents && ` of ${pagination.totalStudents} total`}
                </div>
              </div>
            </div>

            {/* Students organized by Level/Arm */}
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="space-y-8">
                  {Object.entries(studentsByLevel).map(([level, levelStudents]) => (
                    <div key={level}>
                      {/* Level Header */}
                      <div className="flex items-center gap-4 mb-6">
                        <div className={`px-6 py-3 rounded-xl bg-gradient-to-r ${getStageColor(level.substring(0, 2))} shadow-lg`}>
                          <h2 className="text-xl font-bold text-white">{level}</h2>
                        </div>
                        <div className="text-gray-400 text-sm">
                          {levelStudents.length} student{levelStudents.length !== 1 ? 's' : ''}
                        </div>
                      </div>

                      {/* Students Grid for this level */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {levelStudents.map((student) => {
                          const gradeInfo = getStudentGrade(student.currentAverage);
                          const isSelected = selectedStudents.has(student.id);
                          
                          return (
                            <div key={student.id} className={`group relative ${isSelected ? 'ring-2 ring-blue-500/50' : ''}`}>
                              <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-white/40 shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                                {/* Selection Checkbox */}
                                <div className="absolute top-4 left-4 z-10">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleSelectStudent(student.id)}
                                    className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500/50 focus:ring-2"
                                  />
                                </div>

                                {/* Header with Avatar */}
                                <div className="relative p-6 pb-4">
                                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-16 translate-x-16"></div>
                                  
                                  <div className="flex items-start gap-4 relative mt-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                                      {student.firstName?.[0]}{student.lastName?.[0]}
                                    </div>
                                    
                                    <div className="flex-1">
                                      <h3 className="text-xl font-bold text-white mb-1">
                                        {student.firstName} {student.lastName}
                                      </h3>
                                      <p className="text-gray-300 text-sm mb-2 flex items-center gap-1">
                                        <Mail className="w-3 h-3" />
                                        {student.email}
                                      </p>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                          student.isActive 
                                            ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
                                            : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30'
                                        }`}>
                                          {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                                        </span>
                                        {student.className && (
                                          <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                            {student.className}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Academic Details */}
                                <div className="px-6 pb-4">
                                  <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Student ID</p>
                                      <p className="text-white font-medium">{student.studentId || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Admission</p>
                                      <p className="text-white font-medium">{formatDate(student.admissionDate)}</p>
                                    </div>
                                  </div>

                                  {/* Performance Grade */}
                                  {student.currentAverage !== undefined && (
                                    <div className="mb-4">
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Current Performance</p>
                                      <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-${gradeInfo.color}-500 to-${gradeInfo.color}-600 flex items-center justify-center shadow-lg`}>
                                          <span className="text-white font-bold text-lg">{gradeInfo.grade}</span>
                                        </div>
                                        <div>
                                          <p className="text-white font-semibold">{student.currentAverage}%</p>
                                          <p className={`text-${gradeInfo.color}-300 text-xs font-medium`}>{gradeInfo.label}</p>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Parent Info */}
                                  {student.parentName && (
                                    <div className="mb-4">
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Parent Contact</p>
                                      <div className="space-y-1">
                                        <p className="text-white font-medium text-sm flex items-center gap-1">
                                          <Users className="w-3 h-3" />
                                          {student.parentName}
                                        </p>
                                        {student.parentPhone && (
                                          <p className="text-gray-400 text-xs flex items-center gap-1">
                                            <Phone className="w-3 h-3" />
                                            {student.parentPhone}
                                          </p>
                                        )}
                                        {student.parentEmail && (
                                          <p className="text-gray-400 text-xs flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {student.parentEmail}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}

                                  {/* Address */}
                                  {student.address && (
                                    <div className="mb-4">
                                      <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Address</p>
                                      <p className="text-gray-300 text-xs flex items-start gap-1">
                                        <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {student.address}
                                      </p>
                                    </div>
                                  )}
                                </div>

                                {/* Actions */}
                                <div className="px-6 pb-6">
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={() => window.location.href = `/protected/teacher/director/students/${student.id}`}
                                      className="flex-1 group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <Eye className="w-4 h-4 relative z-10" />
                                      <span className="relative z-10">View</span>
                                    </button>
                                    
                                    <button 
                                      onClick={() => window.location.href = `/protected/teacher/director/messages?student=${student.id}`}
                                      className="flex-1 group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-2 rounded-xl font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      <MessageSquare className="w-4 h-4 relative z-10" />
                                      <span className="relative z-10">Message</span>
                                    </button>

                                    <button 
                                      onClick={() => {/* Edit student */}}
                                      className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30 hover:border-yellow-400/50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Student
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          ID & Class
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Performance
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Parent
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {Object.entries(studentsByLevel).map(([level, levelStudents]) => (
                        <React.Fragment key={level}>
                          {/* Level Header Row */}
                          <tr className="bg-gradient-to-r from-gray-700/30 to-gray-600/30">
                            <td colSpan={6} className="px-6 py-3">
                              <div className="flex items-center gap-3">
                                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${getStageColor(level.substring(0, 2))} shadow-lg`}>
                                  <span className="text-white font-bold">{level}</span>
                                </div>
                                <span className="text-gray-400 text-sm">
                                  {levelStudents.length} student{levelStudents.length !== 1 ? 's' : ''}
                                </span>
                              </div>
                            </td>
                          </tr>
                          
                          {/* Students in this level */}
                          {levelStudents.map((student) => {
                            const gradeInfo = getStudentGrade(student.currentAverage);
                            const isSelected = selectedStudents.has(student.id);
                            
                            return (
                              <tr key={student.id} className={`hover:bg-white/5 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-4">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleSelectStudent(student.id)}
                                      className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/50 focus:ring-2"
                                    />
                                    <div className="flex items-center gap-3">
                                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                                        {student.firstName?.[0]}{student.lastName?.[0]}
                                      </div>
                                      <div>
                                        <div className="text-base font-semibold text-white">
                                          {student.firstName} {student.lastName}
                                        </div>
                                        <div className="text-sm text-gray-400">{student.email}</div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="space-y-1">
                                    <div className="text-sm font-medium text-white">
                                      {student.studentId || 'N/A'}
                                    </div>
                                    <div className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded-full inline-block">
                                      {student.className}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {student.currentAverage !== undefined ? (
                                    <div className="flex items-center gap-2">
                                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-${gradeInfo.color}-500 to-${gradeInfo.color}-600 flex items-center justify-center shadow-lg`}>
                                        <span className="text-white font-bold text-sm">{gradeInfo.grade}</span>
                                      </div>
                                      <div>
                                        <div className="text-sm font-semibold text-white">{student.currentAverage}%</div>
                                        <div className={`text-xs text-${gradeInfo.color}-300`}>{gradeInfo.label}</div>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">No data</span>
                                  )}
                                </td>
                                <td className="px-6 py-4">
                                  {student.parentName ? (
                                    <div className="space-y-1">
                                      <div className="text-sm font-medium text-white">{student.parentName}</div>
                                      {student.parentPhone && (
                                        <div className="text-xs text-gray-400">{student.parentPhone}</div>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-gray-400 text-sm">No parent info</span>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                                    student.isActive 
                                      ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/30'
                                      : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30'
                                  }`}>
                                    {student.isActive ? 'ACTIVE' : 'INACTIVE'}
                                  </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <button 
                                      onClick={() => window.location.href = `/protected/teacher/director/students/${student.id}`}
                                      className="p-2 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/30 hover:border-blue-400/50"
                                    >
                                      <Eye className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => window.location.href = `/protected/teacher/director/messages?student=${student.id}`}
                                      className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/30 hover:border-emerald-400/50"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                    </button>
                                    <button 
                                      onClick={() => {/* Edit student */}}
                                      className="p-2 text-yellow-400 hover:bg-yellow-500/20 rounded-lg transition-colors border border-yellow-500/30 hover:border-yellow-400/50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="border-t border-white/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-gray-400 text-sm">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={!pagination.hasPrev || loading}
                      className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      Previous
                    </button>
                    
                    <span className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium">
                      {currentPage}
                    </span>
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                      disabled={!pagination.hasNext || loading}
                      className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Comprehensive Stats Summary */}
      {filteredStudents.length > 0 && summary.statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.totalStudents || 0}</p>
                <p className="text-blue-300 text-sm font-medium">Total Students</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.activeStudents || 0}</p>
                <p className="text-emerald-300 text-sm font-medium">Active Students</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.statistics.excellentPerformers || 0}</p>
                <p className="text-yellow-300 text-sm font-medium">Excellence (80%+)</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.statistics.byStage?.JS || 0}</p>
                <p className="text-purple-300 text-sm font-medium">Junior Secondary</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 backdrop-blur-xl rounded-2xl p-6 border border-indigo-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.statistics.byStage?.SS || 0}</p>
                <p className="text-indigo-300 text-sm font-medium">Senior Secondary</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}