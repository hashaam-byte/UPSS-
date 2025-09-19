'use client'
import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  Download, 
  Users, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Eye, 
  FileText, 
  Search,
  Loader2,
  UserPlus,
  Database,
  Filter,
  Zap,
  Target,
  TrendingUp,
  Activity,
  Plus,
  Edit,
  Trash2,
  X,
  ChevronDown,
  BookOpen,
  GraduationCap
} from 'lucide-react';

const StudentsImportPage = () => {
  const [students, setStudents] = useState([]);
  const [importStats, setImportStats] = useState({});
  const [availableClasses, setAvailableClasses] = useState([]);
  const [sampleFormat, setSampleFormat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  
  // Import form states
  const [csvData, setCsvData] = useState('');
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateDuplicates: false,
    includePasswords: false,
    defaultPassword: ''
  });
  const [importResults, setImportResults] = useState(null);
  
  // Table states
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(20);
  
  // Preview states
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState([]);

  // Fetch data on component mount
  useEffect(() => {
    fetchStudentsData();
  }, []);

  const fetchStudentsData = async () => {
    try {
      const response = await fetch('/api/protected/teachers/director/students/import', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // Only show unassigned students (those without proper class assignments)
        const unassignedStudents = (data.data.students || []).filter(student => 
          !student.className || student.className === 'Not assigned'
        );
        setStudents(unassignedStudents);
        setImportStats(data.data.importStats || {});
        setAvailableClasses(data.data.availableClasses || []);
        setSampleFormat(data.data.sampleCsvFormat || null);
      }
    } catch (error) {
      console.error('Error fetching students data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCsvChange = (value) => {
    setCsvData(value);
    if (value.trim()) {
      try {
        const lines = value.trim().split('\n');
        if (lines.length > 1) {
          const headers = lines[0].split(',').map(h => h.trim());
          const rows = lines.slice(1, 6).map(line => { // Preview first 5 rows
            const values = line.split(',');
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index]?.trim() || '';
            });
            return row;
          });
          setPreviewData(rows);
          setShowPreview(true);
        }
      } catch (error) {
        setShowPreview(false);
        setPreviewData([]);
      }
    } else {
      setShowPreview(false);
      setPreviewData([]);
    }
  };

  const handleImport = async () => {
    if (!csvData.trim()) {
      alert('Please paste CSV data or upload a file');
      return;
    }

    setImporting(true);
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const studentsData = lines.slice(1).map(line => {
        const values = line.split(',');
        const student = {};
        headers.forEach((header, index) => {
          student[header] = values[index]?.trim() || '';
        });
        return student;
      });

      const response = await fetch('/api/protected/teachers/director/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          students: studentsData,
          options: importOptions
        })
      });

      const result = await response.json();
      setImportResults(result.data);
      
      if (result.success) {
        // Clear CSV data and refresh
        setCsvData('');
        setShowPreview(false);
        setPreviewData([]);
        fetchStudentsData();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please check your data format.');
    } finally {
      setImporting(false);
    }
  };

  const downloadSampleCSV = () => {
    if (!sampleFormat) return;
    
    const csvContent = [
      sampleFormat.headers.join(','),
      sampleFormat.sampleRow.join(',')
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample_students_import.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Filter and paginate students
  const filteredStudents = students.filter(student => {
    const matchesSearch = searchTerm === '' || 
      student.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClass = classFilter === '' || student.className === classFilter;
    
    return matchesSearch && matchesClass;
  });

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto" />
            <div className="absolute inset-0 w-16 h-16 border-4 border-blue-400/20 rounded-full animate-pulse"></div>
          </div>
          <p className="text-white mt-6 font-medium text-lg">Loading import system...</p>
          <p className="text-gray-400 text-sm mt-2">Preparing student data interface</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8">
          <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Database className="h-8 w-8 text-white" />
                </div>
                Student Import Center
              </h1>
              <p className="text-gray-300 text-lg">
                Advanced bulk student registration and management system
              </p>
              <div className="flex flex-wrap items-center gap-4 mt-4">
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-300 rounded-full border border-blue-500/30">
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">{students.length} Pending</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                  <Target className="w-4 h-4" />
                  <span className="text-sm font-medium">{importStats.recentImports || 0} Recent</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-300 rounded-full border border-yellow-500/30">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-sm font-medium">{availableClasses.length} Classes</span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.href = '/protected/teacher/director/students'}
                className="group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Users className="w-4 h-4 relative z-10" />
                <span className="relative z-10">View Students</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{students.length}</p>
                <p className="text-blue-300 text-sm font-medium">Pending Import</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{importStats.recentImports || 0}</p>
                <p className="text-emerald-300 text-sm font-medium">Recent Imports</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{availableClasses.length}</p>
                <p className="text-purple-300 text-sm font-medium">Available Classes</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">Ready</p>
                <p className="text-orange-300 text-sm font-medium">System Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                Bulk Student Import
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadSampleCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white border border-white/20 rounded-xl transition-all text-sm"
                >
                  <Download className="h-4 w-4" />
                  Sample CSV
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CSV Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    CSV Data Input
                  </label>
                  <div className="relative">
                    <textarea
                      value={csvData}
                      onChange={(e) => handleCsvChange(e.target.value)}
                      placeholder="Paste your CSV data here or upload a file..."
                      rows={12}
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all resize-none"
                    />
                    {csvData && (
                      <button
                        onClick={() => {
                          setCsvData('');
                          setShowPreview(false);
                          setPreviewData([]);
                        }}
                        className="absolute top-3 right-3 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => handleCsvChange(event.target.result);
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium cursor-pointer hover:scale-105 transition-all"
                  >
                    <Upload className="h-4 w-4" />
                    Upload CSV File
                  </label>
                </div>

                {/* Data Preview */}
                {showPreview && previewData.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Data Preview (First 5 rows)</h3>
                    <div className="bg-white/5 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-white/10">
                          <tr>
                            {Object.keys(previewData[0] || {}).map((header, i) => (
                              <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                                {header}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                          {previewData.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                              {Object.values(row).map((value, colIndex) => (
                                <td key={colIndex} className="px-3 py-2 text-gray-300">
                                  {value || '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Import Options */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-4">
                    Import Configuration
                  </label>
                  
                  <div className="space-y-4">
                    {[
                      { key: 'skipDuplicates', label: 'Skip duplicate emails', icon: Filter },
                      { key: 'updateDuplicates', label: 'Update existing students', icon: Edit },
                      { key: 'includePasswords', label: 'Include passwords in results', icon: Eye }
                    ].map(({ key, label, icon: Icon }) => (
                      <label key={key} className="flex items-center p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 cursor-pointer transition-all group">
                        <input
                          type="checkbox"
                          checked={importOptions[key]}
                          onChange={(e) => setImportOptions(prev => ({
                            ...prev,
                            [key]: e.target.checked
                          }))}
                          className="w-4 h-4 text-blue-500 bg-white/10 border-white/20 rounded focus:ring-blue-500/50 focus:ring-2"
                        />
                        <Icon className="w-4 h-4 text-gray-400 group-hover:text-white mx-3 transition-colors" />
                        <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                          {label}
                        </span>
                      </label>
                    ))}

                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-300">
                        Default Password (optional)
                      </label>
                      <input
                        type="text"
                        value={importOptions.defaultPassword}
                        onChange={(e) => setImportOptions(prev => ({
                          ...prev,
                          defaultPassword: e.target.value
                        }))}
                        placeholder="Leave blank for auto-generated"
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing || !csvData.trim()}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent relative z-10"></div>
                      <span className="relative z-10">Importing Students...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5 relative z-10" />
                      <span className="relative z-10">Import Students</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
              <h2 className="text-xl font-semibold text-white">Import Results</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Successful', value: importResults.summary?.successful || 0, color: 'emerald', icon: CheckCircle },
                  { label: 'Failed', value: importResults.summary?.failed || 0, color: 'red', icon: XCircle },
                  { label: 'Duplicates', value: importResults.summary?.duplicates || 0, color: 'yellow', icon: AlertCircle },
                  { label: 'Total Processed', value: importResults.summary?.totalProcessed || 0, color: 'blue', icon: TrendingUp }
                ].map(({ label, value, color, icon: Icon }) => (
                  <div key={label} className={`text-center p-4 bg-gradient-to-br from-${color}-500/20 to-${color}-600/20 rounded-xl border border-${color}-500/30`}>
                    <Icon className={`h-8 w-8 text-${color}-400 mx-auto mb-2`} />
                    <p className={`text-2xl font-bold text-${color}-300`}>{value}</p>
                    <p className={`text-sm text-${color}-400`}>{label}</p>
                  </div>
                ))}
              </div>

              {importResults.results?.failed?.length > 0 && (
                <div className="mt-4 p-4 bg-red-500/10 rounded-xl border border-red-500/30">
                  <h3 className="text-lg font-medium text-red-300 mb-2 flex items-center gap-2">
                    <XCircle className="w-5 h-5" />
                    Failed Imports
                  </h3>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResults.results.failed.map((item, index) => (
                      <div key={index} className="text-sm text-red-400 p-2 bg-red-500/5 rounded">
                        <span className="font-medium">Row {item.row}:</span> {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Students Table */}
        {students.length > 0 && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-b border-white/10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Pending Assignment</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm w-64"
                    />
                  </div>
                  
                  <select
                    value={classFilter}
                    onChange={(e) => setClassFilter(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
                  >
                    <option value="">All Classes</option>
                    {availableClasses.map(className => (
                      <option key={className} value={className}>{className}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 border-b border-white/10">
                  <tr>
                    {['Student', 'Student ID', 'Class Status', 'Parent Contact', 'Date Added', 'Actions'].map(header => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {currentStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {student.fullName?.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">
                              {student.fullName}
                            </div>
                            <div className="text-sm text-gray-400">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {student.studentId || (
                          <span className="px-2 py-1 bg-yellow-500/20 text-yellow-300 rounded text-xs">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 bg-red-500/20 text-red-300 border border-red-500/30 rounded-full text-xs font-medium">
                          Unassigned
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{student.parentName || 'Not provided'}</div>
                        <div className="text-sm text-gray-400">{student.parentPhone || ''}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                        {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button 
                          onClick={() => window.location.href = `/protected/teacher/director/students/${student.id}`}
                          className="flex items-center gap-1 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-all text-sm font-medium"
                        >
                          <Eye className="h-3 w-3" />
                          Assign Class
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/50 px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Previous
                  </button>
                  
                  <span className="px-4 py-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-sm font-medium">
                    {currentPage} of {totalPages}
                  </span>
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {students.length === 0 && !loading && (
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gradient-to-br from-emerald-600/20 to-teal-700/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">All Students Processed</h3>
              <p className="text-gray-400 mb-6">
                All imported students have been assigned to classes. Ready for new imports.
              </p>
              <button
                onClick={() => window.location.href = '/protected/teacher/director/students'}
                className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center gap-2 mx-auto"
              >
                <Users className="w-4 h-4" />
                View All Students
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentsImportPage;