// app/protected/teacher/subject/resources/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Upload,
  File,
  FileText,
  Video,
  Image,
  Link,
  Search,
  MoreVertical,
  Download,
  Edit,
  Trash2,
  Eye,
  Share2,
  FolderPlus,
  Plus
} from 'lucide-react';

export default function SubjectTeacherResources() {
  const [resources, setResources] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchResources();
    fetchFolders();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/teacher/subject/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await fetch('/api/protected/teacher/subject/resources/folders');
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
      }
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  const handleFileUpload = async (formData) => {
    try {
      setUploading(true);
      const response = await fetch('/api/protected/teacher/subject/resources/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        await fetchResources();
        setUploadDialogOpen(false);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFolder = async (folderName, description) => {
    try {
      const response = await fetch('/api/protected/teacher/subject/resources/folders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: folderName,
          description,
        }),
      });
      
      if (response.ok) {
        await fetchFolders();
        setFolderDialogOpen(false);
      }
    } catch (error) {
      console.error('Error creating folder:', error);
    }
  };

  const handleDeleteResource = async (resourceId) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    
    try {
      const response = await fetch(`/api/protected/teacher/subject/resources/${resourceId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await fetchResources();
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (mimeType.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || resource.folderId === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Resources</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resources</h1>
          <p className="text-muted-foreground">
            Manage your teaching materials and share them with students
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={folderDialogOpen} onOpenChange={setFolderDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderPlus className="w-4 h-4 mr-2" />
                New Folder
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Folder</DialogTitle>
                <DialogDescription>
                  Organize your resources into folders
                </DialogDescription>
              </DialogHeader>
              <CreateFolderForm onSubmit={handleCreateFolder} />
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Resource</DialogTitle>
                <DialogDescription>
                  Add a new teaching resource for your students
                </DialogDescription>
              </DialogHeader>
              <UploadResourceForm 
                onSubmit={handleFileUpload} 
                folders={folders}
                uploading={uploading}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedFolder}
          onChange={(e) => setSelectedFolder(e.target.value)}
          className="px-3 py-2 border rounded-md"
        >
          <option value="all">All Folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {resources.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Resources</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {folders.length}
              </div>
              <p className="text-sm text-muted-foreground">Folders</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {resources.reduce((acc, r) => acc + (r.downloadCount || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Total Downloads</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatFileSize(resources.reduce((acc, r) => acc + (r.size || 0), 0))}
              </div>
              <p className="text-sm text-muted-foreground">Storage Used</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resources Grid */}
      <div className="grid gap-4">
        {filteredResources.map((resource) => (
          <Card key={resource.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {getFileIcon(resource.mimeType)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{resource.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatFileSize(resource.size)}</span>
                      <span>•</span>
                      <span>{resource.downloadCount || 0} downloads</span>
                      <span>•</span>
                      <span>{new Date(resource.createdAt).toLocaleDateString()}</span>
                    </div>
                    {resource.folder && (
                      <Badge variant="outline" className="mt-1">
                        {resource.folder.name}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={resource.isPublic ? 'default' : 'secondary'}>
                    {resource.isPublic ? 'Public' : 'Private'}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Eye className="w-4 h-4 mr-2" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Link
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={() => handleDeleteResource(resource.id)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredResources.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No resources found</h3>
              <p className="text-muted-foreground mb-4">
                Start by uploading your first teaching resource
              </p>
              <Button onClick={() => setUploadDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Upload Resource
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// Upload Resource Form Component
function UploadResourceForm({ onSubmit, folders, uploading }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    folderId: '',
    isPublic: false,
    file: null
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        file,
        name: prev.name || file.name
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.file) return;

    const data = new FormData();
    data.append('file', formData.file);
    data.append('name', formData.name);
    data.append('description', formData.description);
    data.append('folderId', formData.folderId);
    data.append('isPublic', formData.isPublic);

    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">File</label>
        <input
          type="file"
          onChange={handleFileChange}
          className="w-full p-2 border rounded-md"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Resource Name</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="Enter resource name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe this resource"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Folder</label>
        <select
          value={formData.folderId}
          onChange={(e) => setFormData(prev => ({ ...prev, folderId: e.target.value }))}
          className="w-full p-2 border rounded-md"
        >
          <option value="">No folder</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPublic"
          checked={formData.isPublic}
          onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
        />
        <label htmlFor="isPublic" className="text-sm">
          Make this resource publicly accessible to students
        </label>
      </div>

      <Button type="submit" disabled={uploading} className="w-full">
        {uploading ? 'Uploading...' : 'Upload Resource'}
      </Button>
    </form>
  );
}

// Create Folder Form Component
function CreateFolderForm({ onSubmit }) {
  const [folderName, setFolderName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(folderName, description);
    setFolderName('');
    setDescription('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Folder Name</label>
        <Input
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
          placeholder="Enter folder name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe this folder"
          rows={3}
        />
      </div>

      <Button type="submit" className="w-full">
        Create Folder
      </Button>
    </form>
  );
}