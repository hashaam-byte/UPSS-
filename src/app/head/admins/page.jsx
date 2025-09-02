'use client'
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2,
  MoreHorizontal,
  Shield,
  ShieldCheck,
  Key,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  UserCheck,
  UserX,
  Download,
  Upload,
  Send
} from 'lucide-react';

const HeadAdminAdministrators = () => {
  const [administrators, setAdministrators] = useState([]);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data
  useEffect(() => {
    const mockAdmins = [
      {
        id: 1,
        name: "John Doe",
        email: "john.doe@upss.com",
        phone: "+234 801 234 5678",
        role: "HEAD_ADMIN",
        status: "ACTIVE",
        lastLogin: "2024-09-01 14:30",
        createdAt: "2024-01-15",
        location: "Lagos, Nigeria",
        permissions: ["ALL"],
        schoolsManaged: 47,
        avatar: null,
        backupEmail: "john.backup@gmail.com",
        department: "Platform Operations"
      },
      {
        id: 2,
        name: "Sarah Johnson",
        email: "sarah.johnson@upss.com",
        phone: "+234 802 345 6789",
        role: "PLATFORM_ADMIN",
        status: "ACTIVE",
        lastLogin: "2024-09-01 09:15",
        createdAt: "2024-03-20",
        location: "Abuja, Nigeria",
        permissions: ["SCHOOLS_MANAGE", "USERS_VIEW", "BILLING_VIEW"],
        schoolsManaged: 15,
        avatar: null,
        backupEmail: "sarah.backup@gmail.com",
        department: "School Relations"
      },
      {
        id: 3,
        name: "Michael Chen",
        email: "michael.chen@upss.com",
        phone: "+234 803 456 7890",
        role: "SUPPORT_ADMIN",
        status: "ACTIVE",
        lastLogin: "2024-08-31 16:45",
        createdAt: "2024-05-10",
        location: "Port Harcourt, Nigeria",
        permissions: ["SUPPORT_MANAGE", "USERS_VIEW"],
        schoolsManaged: 8,
        avatar: null,
        backupEmail: "michael.backup@gmail.com",
        department: "Technical Support"
      },
      {
        id: 4,
        name: "Amina Hassan",
        email: "amina.hassan@upss.com",
        phone: "+234 804 567 8901",
        role: "PLATFORM_ADMIN",
        status: "SUSPENDED",
        lastLogin: "2024-08-25 11:20",
        createdAt: "2024-02-28",
        location: "Kano, Nigeria",
        permissions: ["SCHOOLS_MANAGE", "ANALYTICS_VIEW"],
        schoolsManaged: 12,
        avatar: null,
        backupEmail: "amina.backup@gmail.com",
        department: "Analytics"
      }
    ];
    setAdministrators(mockAdmins);
    setFilteredAdmins(mockAdmins);
  }, []);

  useEffect(() => {
    const filtered = administrators.filter(admin => {
      const matchesSearch = 
        admin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.department.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterRole === 'ALL' || admin.role === filterRole;
      return matchesSearch && matchesFilter;
    });
    setFilteredAdmins(filtered);
  }, [administrators, searchTerm, filterRole]);

  const getRoleColor = (role) => {
    switch (role) {
      case 'HEAD_ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'PLATFORM_ADMIN': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'SUPPORT_ADMIN': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'HEAD_ADMIN': return <ShieldCheck size={16} className="text-purple-600" />;
      case 'PLATFORM_ADMIN': return <Shield size={16} className="text-blue-600" />;
      case 'SUPPORT_ADMIN': return <UserCheck size={16} className="text-green-600" />;
      default: return <Shield size={16} className="text-gray-600" />;
    }
  };

  const CreateAdminModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Administrator</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            ✕
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Personal Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Enter full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="admin@upss.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Email
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="backup@gmail.com"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="+234 xxx xxx xxxx"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="City, State"
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Role & Permissions</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Role *
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                <option>HEAD_ADMIN</option>
                <option>PLATFORM_ADMIN</option>
                <option>SUPPORT_ADMIN</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
                <option>Platform Operations</option>
                <option>School Relations</option>
                <option>Technical Support</option>
                <option>Analytics</option>
                <option>Finance</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Temporary Password *
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Generate secure password"
              />
              <button className="text-xs text-indigo-600 hover:text-indigo-800 mt-1">
                Generate Random Password
              </button>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Permissions
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {[
                  'Schools Management',
                  'User Management', 
                  'Billing & Revenue',
                  'Platform Analytics',
                  'System Settings',
                  'Support Management'
                ].map((permission) => (
                  <label key={permission} className="flex items-center">
                    <input type="checkbox" className="mr-2 text-indigo-600" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{permission}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200 dark:border-slate-700">
          <button
            onClick={() => setShowCreateModal(false)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 font-medium">
            Create Admin & Send Invite
          </button>
        </div>
      </div>
    </div>
  );

  const AdminDetailModal = () => (
    selectedAdmin && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Administrator Details</h3>
            <button
              onClick={() => {setShowDetailModal(false); setSelectedAdmin(null);}}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              ✕
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Section */}
            <div className="lg:col-span-1">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4">
                  {selectedAdmin.name.split(' ').map(n => n[0]).join('')}
                </div>
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedAdmin.name}</h4>
                <p className="text-gray-600 dark:text-gray-400">{selectedAdmin.department}</p>
                <div className="flex items-center justify-center gap-2 mt-2">
                  {getRoleIcon(selectedAdmin.role)}
                  <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(selectedAdmin.role)}`}>
                    {selectedAdmin.role.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <button className="w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 flex items-center justify-center gap-2">
                    <Send size={16} />
                    Send Message
                  </button>
                  <button className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2">
                    <Key size={16} />
                    Reset Password
                  </button>
                </div>
              </div>
            </div>
            
            {/* Details Section */}
            <div className="lg:col-span-2 space-y-6">
              <div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">Contact Information</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Primary Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Backup Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.backupEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.phone}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.location}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">Activity & Status</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Activity className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Last Login</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.lastLogin}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.createdAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedAdmin.status)}`}>
                        {selectedAdmin.status}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Shield className="text-gray-400" size={16} />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Schools Managed</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedAdmin.schoolsManaged}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 border-b pb-2">Permissions</h5>
                <div className="flex flex-wrap gap-2">
                  {selectedAdmin.permissions.map((permission, index) => (
                    <span key={index} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm rounded-full border border-blue-200 dark:border-blue-800">
                      {permission.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
            Administrator Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Manage platform administrators and their permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
            <Download size={18} />
            Export
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add Administrator
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Admins</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{administrators.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
              <Shield className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Admins</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {administrators.filter(a => a.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
              <UserCheck className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Head Admins</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {administrators.filter(a => a.role === 'HEAD_ADMIN').length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-xl">
              <ShieldCheck className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Schools Managed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {administrators.reduce((sum, admin) => sum + admin.schoolsManaged, 0)}
              </p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
              <Activity className="text-indigo-600 dark:text-indigo-400" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Administrators Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
        <div className="p-6 border-b border-gray-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Administrators</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search administrators..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Roles</option>
                  <option value="HEAD_ADMIN">Head Admin</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="SUPPORT_ADMIN">Support Admin</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-slate-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Administrator</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Schools</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Login</th>
                <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {filteredAdmins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{admin.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">{admin.email}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{admin.location}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getRoleIcon(admin.role)}
                      <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getRoleColor(admin.role)}`}>
                        {admin.role.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {admin.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(admin.status)}`}>
                      {admin.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {admin.schoolsManaged}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {admin.lastLogin}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => {setSelectedAdmin(admin); setShowDetailModal(true);}}
                        className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="p-2 text-yellow-600 hover:text-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-900/20 rounded-lg transition-all">
                        <Edit size={16} />
                      </button>
                      <div className="relative group">
                        <button className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAdmins.length === 0 && (
          <div className="text-center py-12">
            <Shield size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No administrators found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {searchTerm || filterRole !== 'ALL' 
                ? 'Try adjusting your search or filter criteria.' 
                : 'Get started by adding your first administrator.'}
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateModal && <CreateAdminModal />}
      {showDetailModal && <AdminDetailModal />}
    </div>
  );
};

export default HeadAdminAdministrators;
