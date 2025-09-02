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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  GraduationCap,
  DollarSign,
  Calendar,
  Download,
  Upload
} from 'lucide-react';

const HeadAdminSchools = () => {
  const [schools, setSchools] = useState([]);
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);

  // Mock data
  useEffect(() => {
    const mockSchools = [
      {
        id: 1,
        name: "Rainbow College",
        slug: "rainbow-college",
        status: "ACTIVE",
        adminName: "Mrs. Sarah Johnson",
        adminEmail: "admin@rainbow-college.edu",
        studentsCount: 445,
        teachersCount: 27,
        claimedStudents: 450,
        claimedTeachers: 28,
        verifiedStudents: 445,
        verifiedTeachers: 27,
        revenue: 112500,
        trialEndDate: null,
        createdAt: "2024-09-01",
        lastActivity: "2 hours ago",
        location: "Lagos, Nigeria",
        subscription: "Premium"
      },
      {
        id: 2,
        name: "Future Leaders Academy",
        slug: "future-leaders",
        status: "TRIAL",
        adminName: "Mr. David Okafor",
        adminEmail: "admin@futureleaders.edu",
        studentsCount: 320,
        teachersCount: 22,
        claimedStudents: 320,
        claimedTeachers: 22,
        verifiedStudents: null,
        verifiedTeachers: null,
        revenue: 0,
        trialEndDate: "2024-09-10",
        createdAt: "2024-08-25",
        lastActivity: "1 day ago",
        location: "Abuja, Nigeria",
        subscription: "Trial"
      },
      {
        id: 3,
        name: "Excellence High School",
        slug: "excellence-high",
        status: "SUSPENDED",
        adminName: "Dr. Amina Hassan",
        adminEmail: "admin@excellence-high.edu",
        studentsCount: 275,
        teachersCount: 17,
        claimedStudents: 280,
        claimedTeachers: 18,
        verifiedStudents: 275,
        verifiedTeachers: 17,
        revenue: 68750,
        trialEndDate: null,
        createdAt: "2024-07-15",
        lastActivity: "5 days ago",
        location: "Port Harcourt, Nigeria",
        subscription: "Basic"
      },
      {
        id: 4,
        name: "Green Valley International",
        slug: "green-valley",
        status: "ACTIVE",
        adminName: "Prof. Michael Adebayo",
        adminEmail: "admin@greenvalley.edu",
        studentsCount: 680,
        teachersCount: 45,
        claimedStudents: 680,
        claimedTeachers: 45,
        verifiedStudents: 678,
        verifiedTeachers: 44,
        revenue: 170000,
        trialEndDate: null,
        createdAt: "2024-06-10",
        lastActivity: "30 minutes ago",
        location: "Ibadan, Nigeria",
        subscription: "Enterprise"
      }
    ];
    setSchools(mockSchools);
    setFilteredSchools(mockSchools);
  }, []);

  useEffect(() => {
    const filtered = schools.filter(school => {
      const matchesSearch = 
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' || school.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
    setFilteredSchools(filtered);
  }, [schools, searchTerm, filterStatus]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'TRIAL': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ACTIVE': return <CheckCircle size={16} className="text-emerald-600" />;
      case 'TRIAL': return <AlertTriangle size={16} className="text-yellow-600" />;
      case 'SUSPENDED': return <XCircle size={16} className="text-red-600" />;
      default: return null;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const CreateSchoolModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create New School</h3>
          <button
            onClick={() => setShowCreateModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700"
          >
            <XCircle size={24} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">School Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Enter school name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                School Slug *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="school-name"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This will be used in the URL: UPLUS.com/schools/school-name
              </p>
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
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Term Start
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Term End
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white border-b pb-2">Admin Information</h4>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Name *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="Enter admin full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Admin Email *
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="admin@school.com"
              />
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                placeholder="+234 xxx xxx xxxx"
              />
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
            Create School & Send Invite
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="w-full flex justify-center">
      <div className="w-full max-w-5xl px-2 py-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-indigo-600 bg-clip-text text-transparent">
              Schools Management
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Manage all registered schools and their administrators
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Download size={18} />
              Export
            </button>
            <button className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Upload size={18} />
              Import
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Plus size={18} />
              Create School
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{schools.length}</p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-xl">
                <GraduationCap className="text-blue-600 dark:text-blue-400" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Active Schools</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  {schools.filter(s => s.status === 'ACTIVE').length}
                </p>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl">
                <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Trial Schools</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">
                  {schools.filter(s => s.status === 'TRIAL').length}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-xl">
                <AlertTriangle className="text-yellow-600 dark:text-yellow-400" size={20} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {formatCurrency(schools.reduce((sum, school) => sum + school.revenue, 0))}
                </p>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/20 rounded-xl">
                <DollarSign className="text-indigo-600 dark:text-indigo-400" size={20} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-gray-200 dark:border-slate-700 p-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">All Schools</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Search schools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="relative">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="appearance-none pl-4 pr-8 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="TRIAL">Trial</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                <Filter className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              </div>
            </div>
          </div>

          {/* Schools Table */}
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full">
              <thead className="bg-gray-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">School</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Admin</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Activity</th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
                {filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-semibold text-sm mr-3">
                          {school.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{school.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">/{school.slug}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{school.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{school.adminName}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{school.adminEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(school.status)}
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(school.status)}`}>
                          {school.status}
                        </span>
                      </div>
                      {school.status === 'TRIAL' && school.trialEndDate && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Expires: {school.trialEndDate}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Users size={14} className="text-gray-400" />
                          <span>{school.studentsCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GraduationCap size={14} className="text-gray-400" />
                          <span>{school.teachersCount}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(school.revenue)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {school.subscription}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {school.lastActivity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 rounded-lg transition-all">
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

          {filteredSchools.length === 0 && (
            <div className="text-center py-6">
              <GraduationCap size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No schools found</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm || filterStatus !== 'ALL' 
                  ? 'Try adjusting your search or filter criteria.' 
                  : 'Get started by creating your first school.'}
              </p>
            </div>
          )}
        </div>

        {/* Create School Modal */}
        {showCreateModal && <CreateSchoolModal />}
      </div>
    </div>
  );
};

export default HeadAdminSchools;