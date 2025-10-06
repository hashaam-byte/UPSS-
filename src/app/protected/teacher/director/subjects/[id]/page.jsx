// app/protected/teacher/director/subjects/[id]/page.jsx
'use client'
import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, BookOpen, Users, FileText, TrendingUp, Award, 
  Edit, Trash2, CheckCircle, XCircle, Calendar, User, Mail,
  BarChart3, PieChart, Activity, Loader2
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

export default function SubjectDetailPage() {
  const [subject, setSubject] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const params = useParams();
  const router = useRouter();
  const subjectId = params?.id;

  useEffect(() => {
    if (subjectId) {
      fetchSubjectDetails();
    }
  }, [subjectId]);

  const fetchSubjectDetails = async () => {
    try {
      const response = await fetch(`/api/protected/teachers/director/subjects/${subjectId}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setSubject(data.data.subject);
        setStatistics(data.data.statistics);
        setTeachers(data.data.teachers);
        setAssignments(data.data.recentAssignments);
      } else {
        setError(data.error || 'Failed to fetch subject details');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setError('Failed to load subject details');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to deactivate this subject?')) return;

    try {
      const response = await fetch(`/api/protected/teachers/director/subjects/${subjectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        alert('Subject deactivated successfully');
        router.push('/protected/teacher/director/subjects');
      } else {
        alert(data.error || 'Failed to deactivate subject');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to deactivate subject');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-16 h-16 text-emerald-500 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-8 text-center">
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Error Loading Subject</h2>
            <p className="text-red-300 mb-6">{error || 'Subject not found'}</p>
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

  const gradientClass = getCategoryColor(subject.category);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-4">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Subjects
            </button>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => router.push(`/protected/teacher/director/subjects/${subjectId}/edit`)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button 
                onClick={handleDelete}
                className="bg-gradient-to-r from-red-600 to-pink-600 text-white px-4 py-2 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Deactivate
              </button>
            </div>
          </div>

          {/* Subject Info */}
          <div className="flex items-start gap-6">
            <div className={`w-20 h-20 bg-gradient-to-br ${gradientClass} rounded-2xl flex items-center justify-center shadow-2xl`}>
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{subject.name}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full bg-gradient-to-r ${gradientClass} text-white`}>
                  {subject.code}
                </span>
                <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                  subject.isActive 
                    ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {subject.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-300 text-lg capitalize mb-3">{subject.category?.toLowerCase()} Subject</p>
              
              {/* Classes */}
              {subject.classes && subject.classes.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">Available For Classes</p>
                  <div className="flex flex-wrap gap-2">
                    {subject.classes.map((cls, idx) => (
                      <span key={idx} className="px-3 py-1 bg-white/10 text-gray-300 rounded-lg border border-white/20 text-sm">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statistics?.totalTeachers || 0}</p>
                <p className="text-blue-300 text-sm font-medium">Teachers</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statistics?.totalAssignments || 0}</p>
                <p className="text-emerald-300 text-sm font-medium">Assignments</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statistics?.averageGrade || 0}%</p>
                <p className="text-purple-300 text-sm font-medium">Average Grade</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{statistics?.passRate || 0}%</p>
                <p className="text-yellow-300 text-sm font-medium">Pass Rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Grade Distribution */}
        {statistics?.gradeDistribution && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <PieChart className="w-6 h-6 text-purple-400" />
              Grade Distribution
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(statistics.gradeDistribution).map(([grade, count]) => {
                const colors = {
                  A: 'from-emerald-500 to-teal-500',
                  B: 'from-blue-500 to-cyan-500',
                  C: 'from-yellow-500 to-orange-500',
                  D: 'from-orange-500 to-red-500',
                  F: 'from-red-500 to-pink-500'
                };
                return (
                  <div key={grade} className={`bg-gradient-to-br ${colors[grade]}/20 rounded-xl p-4 border border-white/20 text-center`}>
                    <div className="text-3xl font-bold text-white mb-1">{count}</div>
                    <div className="text-sm text-gray-300">Grade {grade}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Teachers Section */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            Teachers Assigned ({teachers.length})
          </h2>

          {teachers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No teachers assigned to this subject yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachers.map(teacher => (
                <div key={teacher.id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20 hover:border-white/40 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {teacher.name?.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{teacher.name}</h3>
                      <p className="text-xs text-gray-400 mb-2">{teacher.email}</p>
                      
                      {/* Classes teaching */}
                      {teacher.classes && teacher.classes.length > 0 && (
                        <div className="mb-2">
                          <div className="flex flex-wrap gap-1">
                            {teacher.classes.map((cls, idx) => (
                              <span key={idx} className="px-2 py-1 text-xs bg-gray-700/50 text-gray-300 rounded">
                                {cls}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>{teacher.assignmentsCreated} assignments</span>
                        <span>{teacher.gradesGiven} grades</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Assignments */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <FileText className="w-6 h-6 text-emerald-400" />
            Recent Assignments
          </h2>

          {assignments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-400">No assignments created for this subject yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignments.map(assignment => (
                <div key={assignment.id} className="bg-gradient-to-br from-white/5 to-white/10 rounded-xl p-4 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">{assignment.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {assignment.teacher.firstName} {assignment.teacher.lastName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </span>
                        <span>
                          {assignment.graded}/{assignment.submissions} graded
                        </span>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${
                      assignment.status === 'active' 
                        ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                        : assignment.status === 'closed'
                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                    }`}>
                      {assignment.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}