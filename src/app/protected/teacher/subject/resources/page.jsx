'use client';

import { useState, useEffect } from 'react';
import { Upload, File, Folder, Trash2, Download } from 'lucide-react';

export default function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [selectedFolder]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const url = selectedFolder 
        ? `/api/protected/teacher/subject/resources/upload?folderId=${selectedFolder}`
        : '/api/protected/teacher/subject/resources/upload';
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setResources(data.data.resources || []);
        setFolders(data.data.folders || []);
        setError(null);
      } else {
        setError(data.error);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', file.name);
      if (selectedFolder) {
        formData.append('folderId', selectedFolder);
      }

      const response = await fetch('/api/protected/teacher/subject/resources/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        await fetchResources(); // Refresh the list
        alert('File uploaded successfully!');
      } else {
        setError(data.error || 'Upload failed');
        alert(`Upload failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed');
      alert('Upload failed. Check console for details.');
    } finally {
      setUploading(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleDelete = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(
        `/api/protected/teacher/subject/resources/upload?id=${resourceId}`,
        { method: 'DELETE' }
      );

      const data = await response.json();

      if (data.success) {
        await fetchResources(); // Refresh the list
        alert('Resource deleted successfully!');
      } else {
        alert(`Delete failed: ${data.error}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed. Check console for details.');
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
    if (mimeType.startsWith('image/')) return '🖼️';
    if (mimeType.startsWith('video/')) return '🎥';
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊';
    return '📎';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">My Resources</h1>
            <label className="px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 flex items-center gap-2">
              <Upload size={20} />
              {uploading ? 'Uploading...' : 'Upload File'}
              <input
                type="file"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="m-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Folders */}
        {folders.length > 0 && (
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold mb-3">Folders</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolder(folder.id)}
                  className={`p-4 border rounded-lg hover:bg-gray-50 flex items-center gap-2 ${
                    selectedFolder === folder.id ? 'bg-blue-50 border-blue-500' : ''
                  }`}
                >
                  <Folder size={20} />
                  <div className="text-left">
                    <div className="font-medium">{folder.name}</div>
                    <div className="text-sm text-gray-500">
                      {folder._count.resources} files
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {selectedFolder && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="mt-4 text-blue-600 hover:underline"
              >
                ← Back to all resources
              </button>
            )}
          </div>
        )}

        {/* Resources List */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-3">
            {selectedFolder ? 'Folder Contents' : 'All Resources'} 
            ({resources.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading resources...</div>
          ) : resources.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File size={48} className="mx-auto mb-2 opacity-50" />
              <p>No resources found. Upload your first file!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-2xl">{getFileIcon(resource.mimeType)}</span>
                    <div className="flex-1">
                      <h3 className="font-medium">{resource.name}</h3>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(resource.size)} • 
                        {new Date(resource.createdAt).toLocaleDateString()} •
                        {resource.mimeType}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                      title="Download"
                    >
                      <Download size={20} />
                    </a>
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                      title="Delete"
                    >
                      <Trash2 size={20} />
                    </button>
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