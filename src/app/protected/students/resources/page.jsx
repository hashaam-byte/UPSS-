// /app/protected/students/resources/page.jsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  Download,
  FileText,
  Image,
  Video,
  File,
  Folder,
  Search,
  Filter,
  Eye,
  Clock,
  User,
  BookOpen,
  Loader2,
  AlertTriangle,
  Grid,
  List
} from 'lucide-react';

const StudentResources = () => {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    fetchResources();
  }, [selectedFolder, filterType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedFolder) params.append('folderId', selectedFolder);
      if (filterType !== 'all') params.append('type', filterType);

      const response = await fetch(`/api/protected/students/resources?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch resources: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setResources(data.data.resources || []);
        setFolders(data.data.folders || []);
      } else {
        throw new Error(data.error || 'Failed to load resources');
      }
    } catch (err) {
      setError(err.message);
      console.error('Fetch resources error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8" />;
    if (mimeType.startsWith('video/')) return <Video className="w-8 h-8" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8" />;
    return <File className="w-8 h-8" />;
  };

  const getFileColor = (mimeType) => {
    if (mimeType.startsWith('image/')) return 'text-green-600 bg-green-100';
    if (mimeType.startsWith('video/')) return 'text-purple-600 bg-purple-100';
    if (mimeType.includes('pdf')) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDownload = async (resource) => {
    try {
      const response = await fetch(`/api/protected/students/resources/download/${resource.id}`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resource.originalName || resource.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
      alert('Failed to download file');
    }
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchTerm === '' || 
      resource.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 flex items-center space-x-4">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <span className="text-gray-700">Loading resources...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Resources</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchResources}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Resources</h1>
              <p className="text-gray-600 mt-1">
                Access study materials, notes, and resources shared by your teachers
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${
                  viewMode === 'grid'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${
                  viewMode === 'list'
                    ? 'bg-purple-100 text-purple-600'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-gray-100">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="sm:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="document">Documents</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Folders */}
        {folders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Folders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(selectedFolder === folder.id ? null : folder.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-center ${
                    selectedFolder === folder.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 bg-white hover:border-purple-300'
                  }`}
                >
                  <Folder className={`w-12 h-12 mx-auto mb-2 ${
                    selectedFolder === folder.id ? 'text-purple-600' : 'text-gray-400'
                  }`} />
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {folder.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {folder._count?.resources || 0} files
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resources Grid/List View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-16 h-16 rounded-xl ${getFileColor(resource.mimeType)} flex items-center justify-center`}>
                    {getFileIcon(resource.mimeType)}
                  </div>
                </div>

                <h3 className="font-semibold text-gray-900 mb-2 truncate">
                  {resource.name}
                </h3>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{resource.uploadedBy?.firstName} {resource.uploadedBy?.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <File className="w-4 h-4" />
                    <span>{formatFileSize(resource.size)}</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDownload(resource)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button
                    onClick={() => window.open(resource.url, '_blank')}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded By
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredResources.map((resource) => (
                    <tr key={resource.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-lg ${getFileColor(resource.mimeType)} flex items-center justify-center`}>
                            {getFileIcon(resource.mimeType)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {resource.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {resource.uploadedBy?.firstName} {resource.uploadedBy?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(resource.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatFileSize(resource.size)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => window.open(resource.url, '_blank')}
                          className="text-purple-600 hover:text-purple-900 mr-4"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleDownload(resource)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Resources Found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'No resources have been uploaded yet.'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentResources;