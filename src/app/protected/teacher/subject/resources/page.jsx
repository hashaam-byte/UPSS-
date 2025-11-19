'use client'
import { useState, useEffect } from 'react';
import { Upload, File, Folder, Trash2, Download, Search, Grid, List, Plus, FolderPlus, X, ChevronRight, Clock, FileText, Image, Film, Music, Archive, Check, AlertCircle, Loader2 } from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [selectedFolder]);

  // Auto-dismiss notifications
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const url = selectedFolder 
        ? `/api/protected/teacher/subject/resources/upload?folderId=${selectedFolder}`
        : '/api/protected/teacher/subject/resources/upload';
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        setResources(data.data.resources || []);
        setFolders(data.data.folders || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load resources');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load resources. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (50MB limit)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      e.target.value = '';
      return;
    }

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name.replace(/\.[^/.]+$/, '')); // Remove extension
      if (selectedFolder) {
        formData.append('folderId', selectedFolder);
      }

      const response = await fetch('/api/protected/teacher/subject/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchResources();
        setSuccess(`${file.name} uploaded successfully!`);
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (resourceId, resourceName) => {
    if (!confirm(`Are you sure you want to delete "${resourceName}"?`)) return;

    try {
      setDeletingId(resourceId);
      setError(null);

      const response = await fetch(
        `/api/protected/teacher/subject/resources/upload?id=${resourceId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        await fetchResources();
        setSuccess('Resource deleted successfully!');
      } else {
        setError(data.error || 'Delete failed');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('Delete failed. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setError('Folder name is required');
      return;
    }

    try {
      setCreatingFolder(true);
      setError(null);

      const response = await fetch('/api/protected/teacher/subject/resources/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName.trim(),
          parentId: selectedFolder
        }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchResources();
        setSuccess(`Folder "${newFolderName}" created successfully!`);
        setShowNewFolderModal(false);
        setNewFolderName('');
      } else {
        setError(data.error || 'Failed to create folder');
      }
    } catch (err) {
      console.error('Create folder error:', err);
      setError('Failed to create folder. Please try again.');
    } finally {
      setCreatingFolder(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="w-8 h-8 text-purple-400" />;
    if (mimeType.startsWith('video/')) return <Film className="w-8 h-8 text-pink-400" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-8 h-8 text-cyan-400" />;
    if (mimeType.includes('pdf')) return <FileText className="w-8 h-8 text-red-400" />;
    if (mimeType.includes('zip') || mimeType.includes('rar')) return <Archive className="w-8 h-8 text-yellow-400" />;
    return <File className="w-8 h-8 text-blue-400" />;
  };

  const filteredResources = resources.filter(resource =>
    resource.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    resource.originalName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentFolder = folders.find(f => f.id === selectedFolder);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      {/* Success Notification */}
      {success && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5">
          <div className="backdrop-blur-xl bg-green-500/20 border border-green-500/50 rounded-2xl p-4 flex items-center gap-3 shadow-2xl">
            <div className="w-8 h-8 rounded-full bg-green-500/30 flex items-center justify-center">
              <Check className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-green-100 font-medium">{success}</span>
            <button onClick={() => setSuccess(null)} className="text-green-200 hover:text-white ml-2">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Error Notification */}
      {error && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-5">
          <div className="backdrop-blur-xl bg-red-500/20 border border-red-500/50 rounded-2xl p-4 flex items-center gap-3 shadow-2xl max-w-md">
            <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-100 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-200 hover:text-white ml-2 flex-shrink-0">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="backdrop-blur-xl bg-slate-900/90 border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Folder</h3>
            <div>
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                placeholder="Folder name"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 mb-6"
                autoFocus
                disabled={creatingFolder}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNewFolderModal(false);
                    setNewFolderName('');
                  }}
                  disabled={creatingFolder}
                  className="flex-1 px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateFolder}
                  disabled={creatingFolder || !newFolderName.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {creatingFolder ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-8 shadow-2xl">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Resource Library
              </h1>
              <div className="flex items-center gap-2 text-white/60">
                <Folder className="w-4 h-4" />
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="hover:text-white transition-colors"
                >
                  Home
                </button>
                {currentFolder && (
                  <>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-white/90">{currentFolder.name}</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 flex-wrap">
              <label className={`px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl cursor-pointer hover:from-cyan-600 hover:to-blue-600 transition-all shadow-lg hover:shadow-cyan-500/50 flex items-center gap-2 font-medium ${
                uploading ? 'opacity-50 cursor-not-allowed' : ''
              }`}>
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload File
                  </>
                )}
                <input
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
              
              <button 
                onClick={() => setShowNewFolderModal(true)}
                className="px-6 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all border border-white/20 flex items-center gap-2 font-medium"
              >
                <FolderPlus size={20} />
                New Folder
              </button>
            </div>
          </div>

          {/* Search and View Controls */}
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50"
              />
            </div>
            
            <div className="flex gap-2 bg-white/10 p-1 rounded-xl border border-white/20">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white/20 text-white' 
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="max-w-7xl mx-auto mb-8">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5 text-cyan-400" />
              Folders
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`group p-6 rounded-2xl transition-all border ${
                    selectedFolder === folder.id
                      ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border-cyan-500/50 shadow-lg shadow-cyan-500/25'
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Folder className={`w-12 h-12 mb-3 ${
                    selectedFolder === folder.id ? 'text-cyan-400' : 'text-white/60 group-hover:text-white'
                  }`} />
                  <h3 className="font-semibold text-white mb-1 text-left truncate">{folder.name}</h3>
                  <p className="text-sm text-white/60">{folder._count?.resources || 0} files</p>
                </button>
              ))}
            </div>
            {selectedFolder && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="mt-4 text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                ← Back to all resources
              </button>
            )}
          </div>
        </div>
      )}

      {/* Resources Section */}
      <div className="max-w-7xl mx-auto">
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <File className="w-5 h-5 text-purple-400" />
              {selectedFolder ? 'Folder Contents' : 'All Resources'}
              <span className="text-white/60">({filteredResources.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="inline-block animate-spin h-12 w-12 text-cyan-400 mb-4" />
              <p className="text-white/60">Loading resources...</p>
            </div>
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <File className="w-12 h-12 text-white/40" />
              </div>
              <p className="text-white/60 text-lg">
                {searchQuery ? 'No resources match your search' : 'No resources found'}
              </p>
              <p className="text-white/40 text-sm mt-2">
                {searchQuery ? 'Try a different search term' : 'Upload your first file to get started!'}
              </p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="group relative bg-white/5 hover:bg-white/10 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:shadow-xl hover:shadow-purple-500/10"
                >
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      {getFileIcon(resource.mimeType)}
                    </div>
                    
                    <h3 className="font-semibold text-white mb-2 line-clamp-2 flex-1" title={resource.name}>
                      {resource.name}
                    </h3>
                    
                    <div className="space-y-1 text-sm text-white/60 mb-4">
                      <p>{formatFileSize(resource.size)}</p>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-2 border border-cyan-500/30"
                      >
                        <Download size={16} />
                        <span className="text-sm">Download</span>
                      </a>
                      <button
                        onClick={() => handleDelete(resource.id, resource.name)}
                        disabled={deletingId === resource.id}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all border border-red-500/30 disabled:opacity-50"
                      >
                        {deletingId === resource.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="group bg-white/5 hover:bg-white/10 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {getFileIcon(resource.mimeType)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate" title={resource.name}>
                        {resource.name}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-white/60 flex-wrap">
                        <span>{formatFileSize(resource.size)}</span>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>•</span>
                        <span className="truncate">{resource.mimeType}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-all"
                        title="Download"
                      >
                        <Download size={20} />
                      </a>
                      <button
                        onClick={() => handleDelete(resource.id, resource.name)}
                        disabled={deletingId === resource.id}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === resource.id ? (
                          <Loader2 size={20} className="animate-spin" />
                        ) : (
                          <Trash2 size={20} />
                        )}
                      </button>
                    </div>
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