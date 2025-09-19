import React, { useState, useEffect } from 'react';
import { Upload, Download, Users, AlertCircle, CheckCircle, XCircle, Eye, FileText, Search } from 'lucide-react';

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

  // Fetch data on component mount
  useEffect(() => {
    fetchStudentsData();
  }, []);

  const fetchStudentsData = async () => {
    try {
      const response = await fetch('/api/protected/teacher/director/students/import', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStudents(data.data.students || []);
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

      const response = await fetch('/api/protected/teacher/director/students/import', {
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
        // Refresh students data
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
      student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading students data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Users className="h-8 w-8 text-blue-600" />
            Students Import & Management
          </h1>
          <p className="text-gray-600 mt-2">Import students in bulk or manage existing student records</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="text-2xl font-bold text-gray-900">{importStats.totalStudents || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Recent Imports</p>
                <p className="text-2xl font-bold text-gray-900">{importStats.recentImports || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">{availableClasses.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Upload className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Import Ready</p>
                <p className="text-2xl font-bold text-green-600">Ready</p>
              </div>
            </div>
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Bulk Import Students
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* CSV Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data
                </label>
                <textarea
                  value={csvData}
                  onChange={(e) => setCsvData(e.target.value)}
                  placeholder="Paste your CSV data here or upload a file..."
                  rows={12}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                />
                
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={downloadSampleCSV}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4" />
                    Download Sample CSV
                  </button>
                  
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => setCsvData(event.target.result);
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                  >
                    <FileText className="h-4 w-4" />
                    Upload CSV File
                  </label>
                </div>
              </div>

              {/* Import Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Import Options
                </label>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="skipDuplicates"
                      checked={importOptions.skipDuplicates}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        skipDuplicates: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="skipDuplicates" className="ml-2 text-sm text-gray-700">
                      Skip duplicate emails
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="updateDuplicates"
                      checked={importOptions.updateDuplicates}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        updateDuplicates: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="updateDuplicates" className="ml-2 text-sm text-gray-700">
                      Update existing students
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="includePasswords"
                      checked={importOptions.includePasswords}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        includePasswords: e.target.checked
                      }))}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="includePasswords" className="ml-2 text-sm text-gray-700">
                      Include passwords in results
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <button
                  onClick={handleImport}
                  disabled={importing || !csvData.trim()}
                  className="w-full mt-6 bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Import Students
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Import Results */}
        {importResults && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-xl font-semibold text-gray-900">Import Results</h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-900">{importResults.summary.successful}</p>
                  <p className="text-sm text-green-700">Successful</p>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-red-900">{importResults.summary.failed}</p>
                  <p className="text-sm text-red-700">Failed</p>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-yellow-900">{importResults.summary.duplicates}</p>
                  <p className="text-sm text-yellow-700">Duplicates</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-900">{importResults.summary.totalProcessed}</p>
                  <p className="text-sm text-blue-700">Total Processed</p>
                </div>
              </div>

              {importResults.results.failed.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-medium text-red-900 mb-2">Failed Imports</h3>
                  <div className="max-h-40 overflow-y-auto">
                    {importResults.results.failed.map((item, index) => (
                      <div key={index} className="text-sm text-red-700 mb-1">
                        Row {item.row}: {item.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Students Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Current Students</h2>
              <div className="flex gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm w-64"
                  />
                </div>
                
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
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
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parent Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admission Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {student.fullName}
                        </div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.className || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{student.parentName || 'Not provided'}</div>
                      <div className="text-sm text-gray-500">{student.parentPhone || ''}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : 'Not set'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Previous
              </button>
              
              <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                {currentPage} of {totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentsImportPage;