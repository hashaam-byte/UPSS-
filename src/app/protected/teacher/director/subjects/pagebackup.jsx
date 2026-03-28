'use client'
import { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Users, Eye, UserCheck, Award, TrendingUp, AlertTriangle, RefreshCw, Loader2, Plus, X } from 'lucide-react';

export default function DirectorSubjects() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState('all');
  const [categories, setCategories] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [addClass, setAddClass] = useState('SS1');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchAvailableClasses();
  }, [selectedClass]);

  const fetchAvailableClasses = async () => {
    try {
      const response = await fetch('/api/protected/teachers/director/students?limit=1', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success && data.data.filters?.availableClasses) {
        let classOptions = data.data.filters.availableClasses;
        
        // If no classes exist, provide fallback options
        if (classOptions.length === 0) {
          classOptions = [
            'JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'
          ];
        }
        
        // Get unique stages/levels for filtering
        const stages = [...new Set(classOptions.map(cls => cls.substring(0, 3)))].sort();
        setAvailableClasses(['all', ...stages]);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
      setAvailableClasses(['all', 'JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3']);
    }
  };

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError('');
      
      const url = selectedClass && selectedClass !== 'all' 
        ? `/api/protected/teachers/director/subjects?class=${selectedClass}`
        : '/api/protected/teachers/director/subjects';
        
      const response = await fetch(url, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setSubjects(data.data.subjects || []);
        setCategories(data.data.categories || []);
        setAvailableSubjects(data.data.availableSubjects || {});
        setError('');
      } else {
        setError(data.error || 'Failed to fetch subjects');
        setSubjects([]);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
      setError('Network error occurred. Please check your connection.');
      setSubjects([]);
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchSubjectOptions = async () => {
    try {
      const res = await fetch('/api/protected/teachers/director/subjects');
      const data = await res.json();
      if (data.success) {
        setSubjectOptions(
          Object.entries(data.data.availableSubjects)
            .flatMap(([cat, arr]) => arr.map(s => ({ ...s, category: cat })))
        );
      }
    } catch {}
  };

  const handleAddSubjects = async () => {
    setAdding(true);
    try {
      for (const subj of selectedSubjects) {
        await fetch('/api/protected/teachers/director/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: subj.name,
            code: subj.code,
            category: subj.category,
            classes: [addClass]
          })
        });
      }
      setShowAddModal(false);
      setSelectedSubjects([]);
      fetchSubjects();
    } finally {
      setAdding(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubjects();
  };

  const filteredSubjects = subjects.filter(subject => 
    subject.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSubjectStats = () => {
    const totalSubjects = subjects.length;
    const assignedTeachers = subjects.reduce((sum, subject) => sum + (subject.teachers?.length || 0), 0);
    const unassignedSubjects = subjects.filter(subject => !subject.teachers?.length).length;
    const coreSubjects = subjects.filter(subject => subject.category?.toUpperCase() === 'CORE').length;

    return { totalSubjects, assignedTeachers, unassignedSubjects, coreSubjects };
  };

  const stats = getSubjectStats();

  const getCategoryColor = (category) => {
    const colors = {
      'CORE': 'from-blue-500 to-cyan-500',
      'SCIENCE': 'from-emerald-500 to-teal-500',
      'ARTS': 'from-purple-500 to-pink-500',
      'COMMERCIAL': 'from-yellow-500 to-orange-500',
      'VOCATIONAL': 'from-red-500 to-pink-500',
      'GENERAL': 'from-indigo-500 to-purple-500'
    };
    return colors[category?.toUpperCase()] || 'from-gray-500 to-slate-500';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'CORE': BookOpen,
      'SCIENCE': Award,
      'ARTS': Users,
      'COMMERCIAL': TrendingUp,
      'VOCATIONAL': Users,
      'GENERAL': BookOpen
    };
    return icons[category?.toUpperCase()] || BookOpen;
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="relative">
                <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
              </div>
              <p className="text-white mt-6 font-medium text-lg">Loading subjects...</p>
              <p className="text-gray-400 text-sm mt-2">Fetching curriculum data</p>
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
              Subject Overview
            </h1>
            <p className="text-gray-300 text-lg">
              View and manage curriculum subjects and teacher assignments
            </p>
            <div className="flex items-center gap-4 mt-4">
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                <BookOpen className="w-4 h-4" />
                <span className="text-sm font-medium">{stats.totalSubjects} Subjects</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                <UserCheck className="w-4 h-4" />
                <span className="text-sm font-medium">{stats.assignedTeachers} Teachers Assigned</span>
              </div>
              {stats.unassignedSubjects > 0 && (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 rounded-full border border-red-500/30">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">{stats.unassignedSubjects} Unassigned</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={() => { setShowAddModal(true); fetchSubjectOptions(); }}
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Subject to Class
            </button>
          </div>
        </div>
      </div>

      {/* Class Selection and Search */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
          {/* Class Selection */}
          <div className="flex flex-wrap gap-2">
            {availableClasses.map((className) => (
              <button
                key={className}
                onClick={() => setSelectedClass(className)}
                className={`px-4 py-2 rounded-xl transition-all duration-300 font-medium text-sm ${
                  selectedClass === className
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20 hover:border-white/40'
                }`}
              >
                {className === 'all' ? 'All Classes' : className}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 lg:max-w-md relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search subjects, codes, categories..."
              className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 backdrop-blur-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 flex items-center text-red-300 shadow-lg backdrop-blur-xl">
          <AlertTriangle className="w-5 h-5 mr-3" />
          <div>
            <p className="font-medium">{error}</p>
            <button
              onClick={handleRefresh}
              className="text-sm text-red-200 hover:text-white underline mt-1"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalSubjects}</p>
              <p className="text-emerald-300 text-sm font-medium">Total Subjects</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
              <UserCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.assignedTeachers}</p>
              <p className="text-blue-300 text-sm font-medium">Teachers Assigned</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.coreSubjects}</p>
              <p className="text-yellow-300 text-sm font-medium">Core Subjects</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.unassignedSubjects}</p>
              <p className="text-red-300 text-sm font-medium">Need Teachers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subjects by Category */}
      <div className="space-y-6">
        {categories.length === 0 && !loading ? (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-16">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Subjects Found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? 'No subjects match your search criteria' 
                  : selectedClass !== 'all'
                  ? `No subjects configured for ${selectedClass} yet`
                  : 'No subjects have been configured yet'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                  Clear Search
                </button>
              )}
            </div>
          </div>
        ) : (
          categories.map((category) => {
            const categorySubjects = filteredSubjects.filter((subject) => subject.category === category);
            if (categorySubjects.length === 0) return null;

            const CategoryIcon = getCategoryIcon(category);
            const gradientClass = getCategoryColor(category);

            return (
              <div
                key={category}
                className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden"
              >
                {/* Category Header */}
                <div className={`bg-gradient-to-r ${gradientClass} p-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{category}</h3>
                        <p className="text-white/80 text-sm">{categorySubjects.length} subjects in this category</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Category Subjects */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {categorySubjects.map((subject) => (
                      <div
                        key={subject.id}
                        className="group relative bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:border-white/40 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-white font-semibold text-lg">{subject.name}</h4>
                              {subject.code && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                  {subject.code}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs text-gray-400">
                                {subject.teachers?.length || 0} teacher{subject.teachers?.length !== 1 ? 's' : ''} assigned
                              </span>
                              {subject.teachers?.length === 0 && (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border border-red-500/30">
                                  Needs Teacher
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Classes Available For */}
                        {subject.classes?.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Available For</p>
                            <div className="flex flex-wrap gap-1">
                              {subject.classes.slice(0, 3).map((cls, index) => (
                                <span key={index} className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded">
                                  {cls}
                                </span>
                              ))}
                              {subject.classes.length > 3 && (
                                <span className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded">
                                  +{subject.classes.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Teachers List */}
                        {subject.teachers?.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Assigned Teachers</p>
                            <div className="space-y-1">
                              {subject.teachers.slice(0, 2).map((teacher, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                                    {teacher.name?.charAt(0) || 'T'}
                                  </div>
                                  <span className="text-gray-300 text-sm">{teacher.name || 'Unknown Teacher'}</span>
                                </div>
                              ))}
                              {subject.teachers.length > 2 && (
                                <p className="text-xs text-gray-400 ml-8">
                                  +{subject.teachers.length - 2} more
                                </p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button 
                            onClick={() => window.location.href = `/protected/teacher/director/subjects/${subject.id}`}
                            className="flex-1 group relative overflow-hidden bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white px-3 py-2 rounded-lg font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center gap-2 text-sm"
                          >
                            <Eye className="w-4 h-4" />
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Section */}
      {filteredSubjects.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-2">
              Showing {filteredSubjects.length} of {subjects.length} subjects
              {selectedClass !== 'all' && ` for ${selectedClass}`}
            </h3>
            {searchTerm && (
              <p className="text-gray-400 text-sm">
                Filtered by search: "{searchTerm}"
              </p>
            )}
          </div>
        </div>
      )}

      {/* Add Subject Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl p-6 w-full max-w-lg border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Subjects to Class</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Class</label>
              <select
                value={addClass}
                onChange={e => setAddClass(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white"
              >
                {['JS1', 'JS2', 'JS3', 'SS1', 'SS2', 'SS3'].map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-300 mb-2">Select Subjects</label>
              <div className="max-h-48 overflow-y-auto bg-white/5 rounded-lg p-2">
                {subjectOptions.map(subj => (
                  <label key={subj.code} className="flex items-center gap-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedSubjects.some(s => s.code === subj.code)}
                      onChange={e => {
                        setSelectedSubjects(prev =>
                          e.target.checked
                            ? [...prev, subj]
                            : prev.filter(s => s.code !== subj.code)
                        );
                      }}
                    />
                    <span className="text-white">{subj.name} <span className="text-xs text-gray-400">({subj.category})</span></span>
                  </label>
                ))}
              </div>
            </div>
            <button
              onClick={handleAddSubjects}
              disabled={adding || selectedSubjects.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg font-semibold mt-2 disabled:opacity-50"
            >
              {adding ? 'Adding...' : 'Add Selected Subjects'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}