'use client'
import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  BarChart3,
  Users,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  PieChart,
  Activity
} from 'lucide-react';

const CoordinatorReports = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedReport, setSelectedReport] = useState('timetable_coverage');
  const [filters, setFilters] = useState({
    class: '',
    period: 'current_term',
    format: 'json'
  });

  const reportTypes = [
    {
      id: 'timetable_coverage',
      name: 'Timetable Coverage',
      description: 'Analyze timetable completion rates by class',
      icon: Calendar,
      color: 'purple'
    },
    {
      id: 'teacher_allocation',
      name: 'Teacher Allocation',
      description: 'Review teacher assignments to subjects',
      icon: Users,
      color: 'blue'
    },
    {
      id: 'class_distribution',
      name: 'Class Distribution',
      description: 'Student distribution across classes and arms',
      icon: BarChart3,
      color: 'green'
    },
    {
      id: 'conflicts',
      name: 'Timetable Conflicts',
      description: 'Identify scheduling conflicts and issues',
      icon: AlertTriangle,
      color: 'red'
    },
    {
      id: 'summary',
      name: 'Summary Report',
      description: 'Overall coordination statistics',
      icon: Activity,
      color: 'orange'
    }
  ];

  useEffect(() => {
    if (selectedReport) {
      fetchReport();
    }
  }, [selectedReport, filters]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('type', selectedReport);
      if (filters.class) params.append('class', filters.class);
      params.append('period', filters.period);
      params.append('format', filters.format);

      const response = await fetch(`/api/protected/teachers/coordinator/reports?${params}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setReportData(data.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report fetch error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportData) return;
    
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedReport}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderTimetableCoverage = () => {
    if (!reportData?.coverage) return null;

    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.overallStats?.totalClasses || 0}
            </div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.overallStats?.averageCompletion || 0}%
            </div>
            <div className="text-sm text-gray-600">Average Completion</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {reportData.overallStats?.totalSlotsUsed || 0}
            </div>
            <div className="text-sm text-gray-600">Slots Used</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-gray-600">
              {reportData.overallStats?.totalPossibleSlots || 0}
            </div>
            <div className="text-sm text-gray-600">Total Possible</div>
          </div>
        </div>

        {/* Class Coverage Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Coverage by Class</h3>
          <div className="space-y-4">
            {Object.entries(reportData.coverage).map(([className, coverage]) => (
              <div key={className} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{className}</h4>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    coverage.completionRate >= 80 
                      ? 'bg-green-100 text-green-800'
                      : coverage.completionRate >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {coverage.completionRate}% Complete
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Slots Usage</div>
                    <div>{coverage.usedSlots} / {coverage.totalSlots} slots</div>
                    <div className="text-red-600">{coverage.emptySlots} empty</div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600 mb-1">Daily Distribution</div>
                    {Object.entries(coverage.dayAnalysis || {}).map(([day, count]) => (
                      <div key={day} className="text-xs">
                        {day}: {count} periods
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <div className="text-gray-600 mb-1">Top Subjects</div>
                    {Object.entries(coverage.subjectAnalysis || {})
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 3)
                      .map(([subject, count]) => (
                        <div key={subject} className="text-xs">
                          {subject}: {count} periods
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderTeacherAllocation = () => {
    if (!reportData?.teacherAllocation) return null;

    return (
      <div className="space-y-6">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.statistics?.totalTeachers || 0}
            </div>
            <div className="text-sm text-gray-600">Total Teachers</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {reportData.statistics?.assignedSubjects || 0}
            </div>
            <div className="text-sm text-gray-600">Assigned Subjects</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {reportData.statistics?.unassignedSubjects || 0}
            </div>
            <div className="text-sm text-gray-600">Unassigned Subjects</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.statistics?.coverageRate || 0}%
            </div>
            <div className="text-sm text-gray-600">Coverage Rate</div>
          </div>
        </div>

        {/* Teacher Allocations */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Assignments</h3>
          <div className="space-y-4">
            {Object.entries(reportData.teacherAllocation || {}).map(([teacherName, allocation]) => (
              <div key={teacherName} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{teacherName}</h4>
                  <span className="text-sm text-gray-600">
                    {allocation.totalClasses} classes • {allocation.subjects.length} subjects
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allocation.subjects.map((subject, index) => (
                    <div key={index} className="p-2 bg-white rounded border">
                      <div className="font-medium text-sm">{subject.name}</div>
                      <div className="text-xs text-gray-600">
                        Classes: {subject.classes.join(', ')}
                      </div>
                      <div className="text-xs text-purple-600">{subject.category}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unassigned Subjects */}
        {reportData.unassignedSubjects && reportData.unassignedSubjects.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-4">
              Unassigned Subjects ({reportData.unassignedSubjects.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.unassignedSubjects.map((subject, index) => (
                <div key={index} className="p-3 bg-white rounded border border-red-200">
                  <div className="font-medium text-red-800">{subject.name}</div>
                  <div className="text-sm text-red-600">Code: {subject.code}</div>
                  <div className="text-xs text-red-600">
                    Affected Classes: {subject.affectedClasses.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderClassDistribution = () => {
    if (!reportData?.classDistribution) return null;

    return (
      <div className="space-y-6">
        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.overallStats?.totalStudents || 0}
            </div>
            <div className="text-sm text-gray-600">Total Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {reportData.overallStats?.averageClassSize || 0}
            </div>
            <div className="text-sm text-gray-600">Average Class Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {reportData.overallStats?.totalRecentEnrollments || 0}
            </div>
            <div className="text-sm text-gray-600">Recent Enrollments</div>
          </div>
        </div>

        {/* Class Distribution Details */}
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribution by Class</h3>
          <div className="space-y-4">
            {Object.entries(reportData.classDistribution || {}).map(([className, distribution]) => (
              <div key={className} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{className}</h4>
                  <span className="text-sm text-gray-600">
                    {distribution.totalStudents} students
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600 mb-1">Gender Distribution</div>
                    {Object.entries(distribution.genderDistribution || {}).map(([gender, count]) => (
                      <div key={gender} className="text-xs">
                        {gender}: {count}
                      </div>
                    ))}
                  </div>
                  
                  <div>
                    <div className="text-gray-600 mb-1">Recent Enrollments</div>
                    <div className="text-xs text-green-600">
                      {distribution.recentEnrollments} in last 30 days
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-gray-600 mb-1">Contact Info</div>
                    <div className="text-xs text-blue-600">
                      {distribution.studentsWithParentContact} with parent contact
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderConflicts = () => {
    if (!reportData?.conflicts) return null;

    return (
      <div className="space-y-6">
        {/* Conflict Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">
              {reportData.conflictsSummary?.totalConflicts || 0}
            </div>
            <div className="text-sm text-gray-600">Total Conflicts</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {reportData.conflictsSummary?.teacherConflicts || 0}
            </div>
            <div className="text-sm text-gray-600">Teacher Conflicts</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.conflictsSummary?.affectingCoordinatorClasses || 0}
            </div>
            <div className="text-sm text-gray-600">Affecting Your Classes</div>
          </div>
        </div>

        {/* Conflict Details */}
        {reportData.conflicts.length > 0 ? (
          <div className="bg-white rounded-xl p-6 shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Conflict Details</h3>
            <div className="space-y-4">
              {reportData.conflicts.map((conflict, index) => (
                <div key={index} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-red-800">
                      {conflict.type.replace('_', ' ').toUpperCase()}
                    </h4>
                    <span className="text-sm text-red-600">
                      {conflict.dayOfWeek} Period {conflict.period}
                    </span>
                  </div>
                  
                  <div className="text-sm text-red-700 mb-2">
                    Teacher: {conflict.teacher}
                  </div>
                  
                  <div className="text-xs text-red-600">
                    Conflicting classes: {conflict.conflictingEntries.map(e => e.className).join(', ')}
                  </div>
                  
                  {conflict.coordinatorClassesInvolved && conflict.coordinatorClassesInvolved.length > 0 && (
                    <div className="text-xs text-purple-600 mt-1">
                      Your classes involved: {conflict.coordinatorClassesInvolved.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800">No Conflicts Detected</h3>
            <p className="text-green-600">Your timetables are conflict-free!</p>
          </div>
        )}
      </div>
    );
  };

  const renderSummary = () => {
    if (!reportData?.summary) return null;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-purple-600">
              {reportData.summary.classCount}
            </div>
            <div className="text-sm text-gray-600">Classes Managed</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-blue-600">
              {reportData.summary.totalStudents}
            </div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-green-600">
              {reportData.summary.totalTeachers}
            </div>
            <div className="text-sm text-gray-600">Teachers</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-orange-600">
              {reportData.summary.totalSubjects}
            </div>
            <div className="text-sm text-gray-600">Subjects</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-indigo-600">
              {reportData.summary.totalTimetableSlots}
            </div>
            <div className="text-sm text-gray-600">Timetable Slots</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-teal-600">
              {reportData.summary.timetableCompletion}%
            </div>
            <div className="text-sm text-gray-600">Completion</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-pink-600">
              {reportData.summary.averageStudentsPerClass}
            </div>
            <div className="text-sm text-gray-600">Avg Class Size</div>
          </div>
          <div className="bg-white p-4 rounded-lg border text-center">
            <div className="text-2xl font-bold text-cyan-600">
              {reportData.summary.maxPossibleSlots}
            </div>
            <div className="text-sm text-gray-600">Max Possible Slots</div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Managed Classes</h3>
          <div className="flex flex-wrap gap-2">
            {reportData.summary.coordinatorClasses.map(className => (
              <span key={className} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {className}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderReportContent = () => {
    switch (selectedReport) {
      case 'timetable_coverage':
        return renderTimetableCoverage();
      case 'teacher_allocation':
        return renderTeacherAllocation();
      case 'class_distribution':
        return renderClassDistribution();
      case 'conflicts':
        return renderConflicts();
      case 'summary':
        return renderSummary();
      default:
        return null;
    }
  };

  return (
    <CoordinatorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-600">Generate comprehensive coordination reports</p>
          </div>
          {reportData && (
            <button
              onClick={handleDownloadReport}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download Report</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center">
            <AlertTriangle className="h-5 w-5 mr-3" />
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Report Types Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Types</h3>
              <div className="space-y-2">
                {reportTypes.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`w-full p-3 rounded-lg text-left transition-colors ${
                      selectedReport === report.id
                        ? `bg-${report.color}-100 text-${report.color}-800 border-${report.color}-200`
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <report.icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium text-sm">{report.name}</div>
                        <div className="text-xs opacity-75">{report.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Filters</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Class Filter</label>
                    <select
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      value={filters.class}
                      onChange={(e) => setFilters(prev => ({ ...prev, class: e.target.value }))}
                    >
                      <option value="">All Classes</option>
                      {reportData?.coordinatorClasses?.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Period</label>
                    <select
                      className="w-full px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-purple-500 focus:border-transparent"
                      value={filters.period}
                      onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
                    >
                      <option value="current_term">Current Term</option>
                      <option value="last_term">Last Term</option>
                      <option value="academic_year">Academic Year</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                </div>
              </div>
            ) : reportData ? (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{reportData.reportType}</h2>
                    <div className="text-sm text-gray-600">
                      Generated on {new Date(reportData.generatedAt).toLocaleDateString()} by {reportData.generatedBy}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Period: {filters.period.replace('_', ' ')}
                  </div>
                </div>
                
                {renderReportContent()}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="text-center text-gray-500 py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a report type to generate analytics</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </CoordinatorLayout>
  );
};

export default CoordinatorReports;