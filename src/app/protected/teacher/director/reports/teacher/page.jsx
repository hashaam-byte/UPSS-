// app/protected/teacher/director/reports/teacher/page.jsx
'use client'
import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText, Award, Calendar, Loader2, Download, Filter, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TeacherPerformanceReport() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [needsAttention, setNeedsAttention] = useState([]);
  const [period, setPeriod] = useState('term');
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchReport();
  }, [period]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/protected/teachers/director/reports/teacher?period=${period}`, {
        credentials: 'include'
      });
      const data = await response.json();

      if (data.success) {
        setSummary(data.data.summary);
        setTeachers(data.data.teachers);
        setTopPerformers(data.data.topPerformers);
        setNeedsAttention(data.data.needsAttention);
      }
    } catch (error) {
      console.error('Failed to fetch report:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewTeacherDetail = (teacherId) => {
    router.push(`/protected/teacher/director/teachers/${teacherId}`);
  };

  const getPerformanceColor = (gradingRate, passRate) => {
    const score = gradingRate + passRate;
    if (score >= 160) return 'from-emerald-500 to-teal-500';
    if (score >= 120) return 'from-blue-500 to-cyan-500';
    if (score >= 80) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
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
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Teacher Performance Report</h1>
            <p className="text-gray-300 text-lg">Comprehensive analysis of teacher effectiveness</p>
          </div>
          
          <div className="flex gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="term">This Term</option>
              <option value="year">This Year</option>
            </select>
            
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-xl font-medium hover:scale-105 transition-transform flex items-center gap-2">
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.totalTeachers}</p>
                <p className="text-blue-300 text-sm font-medium">Total Teachers</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.totalAssignments}</p>
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
                <p className="text-2xl font-bold text-white">{summary.avgGradingRate}%</p>
                <p className="text-purple-300 text-sm font-medium">Avg Grading Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-xl rounded-2xl p-6 border border-yellow-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.avgPassRate}%</p>
                <p className="text-yellow-300 text-sm font-medium">Avg Pass Rate</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-pink-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-pink-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{summary.activeTeachers}</p>
                <p className="text-pink-300 text-sm font-medium">Active This Week</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Performers */}
      {topPerformers.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <Award className="w-6 h-6 text-yellow-400" />
            Top Performing Teachers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {topPerformers.map((teacher, index) => (
              <div key={teacher.id} className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/30">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      {teacher.name?.charAt(0)}
                    </div>
                    {index < 3 && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg">
                        {index + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{teacher.name}</h3>
                    <p className="text-xs text-gray-400 capitalize mb-2">{teacher.department || 'Teacher'}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-400">Grading: </span>
                        <span className="text-emerald-300 font-semibold">{teacher.gradingRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Pass Rate: </span>
                        <span className="text-blue-300 font-semibold">{teacher.passRate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Assignments: </span>
                        <span className="text-purple-300 font-semibold">{teacher.assignmentsCreated}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Subjects: </span>
                        <span className="text-yellow-300 font-semibold">{teacher.subjects}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => viewTeacherDetail(teacher.id)}
                  className="w-full mt-3 bg-gradient-to-r from-yellow-600/50 to-orange-600/50 text-white px-3 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teachers Need Attention */}
      {needsAttention.length > 0 && (
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-red-400" />
            Teachers Needing Support ({needsAttention.length})
          </h2>

          <div className="space-y-3">
            {needsAttention.map(teacher => (
              <div key={teacher.id} className="bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-xl p-4 border border-red-500/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold">
                      {teacher.name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{teacher.name}</h3>
                      <p className="text-xs text-gray-400 capitalize">{teacher.department || 'Teacher'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    {teacher.gradingRate < 50 && (
                      <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-xs border border-red-500/30">
                        Low Grading: {teacher.gradingRate}%
                      </span>
                    )}
                    {teacher.passRate < 50 && (
                      <span className="px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full text-xs border border-orange-500/30">
                        Low Pass Rate: {teacher.passRate}%
                      </span>
                    )}
                    {teacher.assignmentsCreated === 0 && (
                      <span className="px-3 py-1 bg-yellow-500/20 text-yellow-300 rounded-full text-xs border border-yellow-500/30">
                        No Assignments
                      </span>
                    )}
                    <button
                      onClick={() => viewTeacherDetail(teacher.id)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Teachers Table */}
      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          All Teachers Performance
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left text-gray-300 font-semibold py-3 px-4">Teacher</th>
                <th className="text-left text-gray-300 font-semibold py-3 px-4">Department</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Subjects</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Assignments</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Grading Rate</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Pass Rate</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Timetable</th>
                <th className="text-center text-gray-300 font-semibold py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map(teacher => {
                const gradientClass = getPerformanceColor(teacher.gradingRate, teacher.passRate);
                return (
                  <tr key={teacher.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 bg-gradient-to-br ${gradientClass} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                          {teacher.name?.charAt(0)}
                        </div>
                        <span className="text-white font-medium">{teacher.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-300 capitalize text-sm">{teacher.department || 'N/A'}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-semibold">{teacher.subjects}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-semibold">{teacher.assignmentsCreated}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        teacher.gradingRate >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                        teacher.gradingRate >= 60 ? 'bg-blue-500/20 text-blue-300' :
                        teacher.gradingRate >= 40 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {teacher.gradingRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        teacher.passRate >= 70 ? 'bg-emerald-500/20 text-emerald-300' :
                        teacher.passRate >= 50 ? 'bg-blue-500/20 text-blue-300' :
                        teacher.passRate >= 30 ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {teacher.passRate}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-white font-semibold">{teacher.timetableSlots}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => viewTeacherDetail(teacher.id)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:scale-105 transition-transform"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}