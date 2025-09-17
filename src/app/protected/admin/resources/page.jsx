'use client'
import React, { useState, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Video, 
  Music,
  Download,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Edit3,
  Trash2,
  Share2,
  Star,
  Folder,
  FolderPlus,
  File,
  Calendar,
  User,
  CheckCircle,
  AlertTriangle,
  Loader2,
  X,
  Plus
} from 'lucide-react';

const AdminResourcesPage = () => {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('grid'); // 'grid' or 'list'
  const [selectedResources, setSelectedResources] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchResources();
    fetchFolders();
  }, [currentFolder]);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (currentFolder) params.append('folderId', currentFolder.id);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/protected/admin/resources?${params}`);
      const data = await response.json();

      if (response.ok) {
        setResources(data.resources || []);
      } else {
        setError(data.error || 'Failed to fetch resources');
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/protected/admin/resources/folders');
      const data = await response.json();

      if (response.ok) {
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (uploadFiles.length === 0) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      uploadFiles.forEach(file => formData.append('files', file));
      if (currentFolder) formData.append('folderId', currentFolder.id);

      const response = await fetch('/api/protected/admin/resources/upload', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(`${uploadFiles.length} file(s) uploaded successfully`);
        setShowUploadModal(false);
        setUploadFiles([]);
        fetchResources();
      } else {
        setError(data.error || 'Failed to upload files');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
      setError('Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch('/api/protected/admin/resources/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: currentFolder?.id || null
        })
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Folder created successfully');
        setShowCreateFolderModal(false);
        setNewFolderName('');
        fetchFolders();
      } else {
        setError(data.error || 'Failed to create folder');
      }
    } catch (error) {
      console.error('Error creating folder:', error);
      setError('Network error occurred');
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`/api/protected/admin/resources/${resourceId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage('Resource deleted successfully');
        fetchResources();
      } else {
        setError(data.error || 'Failed to delete resource');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      setError('Network error occurred');
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return Image;
    if (fileType?.startsWith('video/')) return Video;
    if (fileType?.startsWith('audio/')) return Music;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const filteredResources = resources.filter(resource =>
    resource.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Resources & Files</h1>
          <p className="text-gray-400">Manage documents, images, and other school resources</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowCreateFolderModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg hover:from-emerald-600 hover:to-cyan-600 transition-all"
          >
            <Upload className="w-4 h-4" />
            Upload Files
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb and Controls */}
      <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/20 p-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`px-3 py-1 rounded-lg transition-colors ${
              !currentFolder ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            Home
          </button>
          {currentFolder && (
            <>
              <span className="text-gray-500">/</span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg">
                {currentFolder.name}
              </span>
            </>
          )}
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/20 rounded-lg transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <select
              value={selectedView}
              onChange={(e) => setSelectedView(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            >
              <option value="grid">Grid View</option>
              <option value="list">List View</option>
            </select>
          </div>
        </div>

        {/* Resources Display */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          </div>
        ) : (
          <>
            {/* Folders First */}
            {!currentFolder && folders.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Folders</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {folders.map((folder) => (
                    <button
                      key={folder.id}
                      onClick={() => setCurrentFolder(folder)}
                      className="flex flex-col items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-lg border border-white/20 hover:border-emerald-500/30 transition-all group"
                    >
                      <Folder className="w-12 h-12 text-blue-400 group-hover:text-blue-300" />
                      <span className="text-sm text-white text-center truncate w-full">
                        {folder.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {selectedView === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filteredResources.map((resource) => {
                  const FileIcon = getFileIcon(resource.mimeType);
                  return (
                    <div
                      key={resource.id}
                      className="bg-white/5 rounded-lg border border-white/20 p-4 hover:bg-white/10 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <FileIcon className="w-8 h-8 text-blue-400" />
                        <div className="relative">
                          <button className="p-1 text-gray-400 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-white text-sm truncate" title={resource.name}>
                          {resource.name}
                        </h4>
                        <div className="text-xs text-gray-400 space-y-1">
                          <p>{formatFileSize(resource.size)}</p>
                          <p>{formatDate(resource.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => window.open(resource.url, '_blank')}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View
                        </button>
                        <button
                          onClick={() => handleDeleteResource(resource.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-400 pb-2 border-b border-white/10">
                  <div className="col-span-1">
                    <input type="checkbox" className="w-4 h-4" />
                  </div>
                  <div className="col-span-4">Name</div>
                  <div className="col-span-2">Size</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Modified</div>
                  <div className="col-span-1">Actions</div>
                </div>
                {filteredResources.map((resource) => {
                  const FileIcon = getFileIcon(resource.mimeType);
                  return (
                    <div
                      key={resource.id}
                      className="grid grid-cols-12 gap-4 items-center py-3 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <div className="col-span-1">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4"
                          checked={selectedResources.includes(resource.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedResources([...selectedResources, resource.id]);
                            } else {
                              setSelectedResources(selectedResources.filter(id => id !== resource.id));
                            }
                          }}
                        />
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <FileIcon className="w-5 h-5 text-blue-400" />
                        <span className="text-white truncate">{resource.name}</span>
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {formatFileSize(resource.size)}
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {resource.mimeType?.split('/')[1]?.toUpperCase() || 'Unknown'}
                      </div>
                      <div className="col-span-2 text-gray-400 text-sm">
                        {formatDate(resource.createdAt)}
                      </div>
                      <div className="col-span-1">
                        <div className="flex gap-1">
                          <button
                            onClick={() => window.open(resource.url, '_blank')}
                            className="p-1 text-blue-400 hover:bg-blue-500/20 rounded transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteResource(resource.id)}
                            className="p-1 text-red-400 hover:bg-red-500/20 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredResources.length === 0 && (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
                <p className="text-gray-400 mb-4">
                  {searchQuery ? 'Try adjusting your search terms' : 'Upload your first resource to get started'}
                </p>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors mx-auto"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Upload Files</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Select Files
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-500/20 file:text-emerald-400"
                />
                {uploadFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="text-sm text-gray-400 flex items-center justify-between">
                        <span>{file.name} ({formatFileSize(file.size)})</span>
                        <button
                          type="button"
                          onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== index))}
                          className="text-red-400 hover:text-red-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadFiles.length === 0 || isLoading}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload ({uploadFiles.length})
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-white/20 p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Folder</h2>
              <button
                onClick={() => setShowCreateFolderModal(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
                  placeholder="Enter folder name..."
                  required
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateFolderModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newFolderName.trim()}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminResourcesPage;