'use client'
import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Calendar, 
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  Award,
  BookOpen,
  FileText,
  Plus,
  ArrowUp,
  ArrowDown,
  Eye,
  MessageSquare,
  Star
} from 'lucide-react';

export default function DirectorDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teachers/director/dashboard', {
        credentials: 'include'
      });
      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data.data);
      } else {
        setError(data.error || 'Failed to load dashboard data');
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const StatCard = ({ title, value, icon: Icon, trend, gradientFrom, gradientTo, onClick, badge }) => (
    <div 
      className={`relative group cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 hover:border-white/40 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300`}
      onClick={onClick}
    >
      {/* Animated Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
      
      {/* Content */}
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-sm font-medium text-gray-300">{title}</p>
              {badge && (
                <span className="text-xs font-bold px-2 py-1 rounded-full bg-white/20 text-white border border-white/30">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-3xl font-bold text-white mb-3">{value}</p>
            {trend && (
              <div className="flex items-center">
                <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium border ${
                  trend.positive 
                    ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-300 border-green-500/30' 
                    : 'bg-gradient-to-r from-red-500/20 to-pink-500/20 text-red-300 border-red-500/30'
                }`}>
                  {trend.positive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
                  {trend.value}%
                </div>
                <span className="text-xs text-gray-400 ml-2">vs last term</span>
              </div>
            )}
          </div>
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* Hover Effect Border */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none`}></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl animate-pulse"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl animate-ping"></div>
          </div>
          <p className="text-white mt-6 font-medium text-lg">Loading dashboard...</p>
          <p className="text-gray-400 text-sm mt-2">Fetching your stage overview</p>
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
              Director Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Welcome back, {dashboardData?.director?.name}. Here's your stage overview.
            </p>
            {dashboardData?.director?.department && (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30 text-sm font-medium">
                  {dashboardData.director.department} Director
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => window.location.href = '/protected/teacher/director/reports'}
              className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <FileText className="w-4 h-4 relative z-10" />
              <span className="relative z-10">Generate Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-xl p-4 flex items-center text-red-300 shadow-lg backdrop-blur-xl">
          <AlertTriangle className="w-5 h-5 mr-3" />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={dashboardData?.stats?.totalStudents || 0}
          icon={Users}
          gradientFrom="from-blue-500"
          gradientTo="to-cyan-500"
          trend={{ positive: true, value: 12 }}
          badge="In Stage"
          onClick={() => window.location.href = '/protected/teacher/director/students'}
        />
        
        <StatCard
          title="Teachers Supervised"
          value={dashboardData?.stats?.totalTeachers || 0}
          icon={UserCheck}
          gradientFrom="from-emerald-500"
          gradientTo="to-teal-500"
          trend={{ positive: true, value: 8 }}
          badge="Active"
        />
        
        <StatCard
          title="Average Pass Rate"
          value={`${dashboardData?.stats?.averagePassRate || 0}%`}
          icon={Award}
          gradientFrom="from-purple-500"
          gradientTo="to-pink-500"
          trend={{ positive: true, value: 5 }}
          badge="This Term"
        />
        
        <StatCard
          title="Pending Approvals"
          value={dashboardData?.stats?.pendingApprovals || 0}
          icon={Clock}
          gradientFrom="from-orange-500"
          gradientTo="to-red-500"
          badge="Timetables"
          onClick={() => window.location.href = '/protected/teacher/director/timetable'}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Alerts - Takes 2 columns */}
        <div className="xl:col-span-2">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-600 to-orange-600 p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Recent Performance Alerts</h3>
                </div>
                <button 
                  onClick={() => window.location.href = '/protected/teacher/director/reports'}
                  className="text-white/80 hover:text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
                >
                  View all
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData?.recentAlerts?.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.recentAlerts.map((alert, idx) => (
                    <div key={idx} className="group relative">
                      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl hover:from-yellow-500/20 hover:to-orange-500/20 transition-all duration-300 hover:shadow-lg backdrop-blur-sm">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <AlertTriangle className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <p className="text-white font-semibold text-lg">{alert.name}</p>
                            <p className="text-gray-300">{alert.class} - {alert.alert}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-xs text-gray-400 bg-white/10 px-3 py-1 rounded-full border border-white/20">
                            {formatDate(alert.timestamp)}
                          </span>
                          <button className="p-2 text-yellow-400 hover:text-white hover:bg-yellow-500/20 rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium text-lg">No recent alerts</p>
                  <p className="text-gray-500 text-sm mt-1">All students are performing well</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Top Performers */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Top Performers</h3>
              </div>
            </div>
            
            <div className="p-6">
              {dashboardData?.topPerformers?.length > 0 ? (
                <div className="space-y-3">
                  {dashboardData.topPerformers.slice(0, 5).map((student, index) => (
                    <div key={student.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-lg hover:shadow-md transition-all duration-200 backdrop-blur-sm">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8">
                          <span className="text-lg font-bold text-emerald-400">#{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-sm">{student.name}</p>
                          <p className="text-xs text-gray-400">{student.class}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-emerald-400 font-bold text-sm">{student.average}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-700/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Star className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-gray-400 font-medium">No performance data</p>
                  <p className="text-gray-500 text-xs mt-1">Data will appear after assessments</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                <button 
                  onClick={() => window.location.href = '/protected/teacher/director/timetable'}
                  className="w-full group relative overflow-hidden bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 rounded-xl p-4 border border-blue-500/30 hover:border-blue-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Review Timetables</p>
                      <p className="text-xs text-gray-400">Approve pending schedules</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/protected/teacher/director/reports'}
                  className="w-full group relative overflow-hidden bg-gradient-to-br from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 rounded-xl p-4 border border-emerald-500/30 hover:border-emerald-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Generate Reports</p>
                      <p className="text-xs text-gray-400">Stage performance analysis</p>
                    </div>
                  </div>
                </button>

                <button 
                  onClick={() => window.location.href = '/protected/teacher/director/messages'}
                  className="w-full group relative overflow-hidden bg-gradient-to-br from-orange-500/20 to-red-500/20 hover:from-orange-500/30 hover:to-red-500/30 rounded-xl p-4 border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-white">Send Messages</p>
                      <p className="text-xs text-gray-400">Communicate with staff</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}