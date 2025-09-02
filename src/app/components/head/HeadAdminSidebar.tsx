'use client'
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  School, 
  Users, 
  DollarSign, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  Shield,
  Plus,
  ChevronDown,
  User,
  Mail,
  Key,
  LogOut,
  Edit,
  Camera,
  Check,
  X
} from 'lucide-react';

const HeadAdminSidebar = ({ activeTab, setActiveTab, isCollapsed, setIsCollapsed }) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "John Doe",
    email: "john.doe@upss.com",
    backupEmail: "backup@upss.com",
    role: "Head Administrator",
    avatar: null
  });

  const userDropdownRef = useRef(null);

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/head/dashboard' },
    { id: 'schools', icon: School, label: 'Schools', path: '/head/schools' },
    { id: 'admins', icon: Users, label: 'Administrators', path: '/head/admins' },
    { id: 'billing', icon: DollarSign, label: 'Billing & Revenue', path: '/head/billing' },
    { id: 'analytics', icon: BarChart3, label: 'Platform Analytics', path: '/head/analytics' },
    { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/head/messages' },
    { id: 'settings', icon: Settings, label: 'System Settings', path: '/head/settings' },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileUpdate = () => {
    // Here you would typically make an API call to update the profile
    setEditingProfile(false);
  };

  const AddAdminModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add New Admin</h3>
          <button
            onClick={() => setShowAddAdminModal(false)}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="Enter admin name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
              placeholder="admin@upss.com"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Role
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-white">
              <option>Head Administrator</option>
              <option>Platform Administrator</option>
              <option>Support Administrator</option>
            </select>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddAdminModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-indigo-500 text-white rounded-lg hover:from-emerald-600 hover:to-indigo-600 transition-all duration-300"
            >
              Add Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="w-16 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 h-screen flex flex-col transition-all duration-300 ease-in-out">
        {/* Navigation Menu */}
        <div className="flex-1 py-6">
          <nav className="px-1 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              return (
                <Link
                  key={item.id}
                  href={item.path}
                  className={`w-full flex items-center justify-center px-0 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-indigo-500 text-white shadow-lg'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  title={item.label}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon 
                    size={22} 
                    className={`${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'} transition-colors`}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Add Admin Button */}
        {/* <div className="px-3 pb-4">
          <button
            onClick={() => setShowAddAdminModal(true)}
            className="w-full flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-emerald-100 to-indigo-100 dark:from-emerald-900/20 dark:to-indigo-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl hover:from-emerald-200 hover:to-indigo-200 dark:hover:from-emerald-900/40 dark:hover:to-indigo-900/40 transition-all duration-200 border border-emerald-200 dark:border-emerald-800"
          >
            <Plus size={18} />
            <span className="font-medium">Quick Add Admin</span>
          </button>
        </div> */}

        {/* User Profile Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 p-3">
          <div className="relative" ref={userDropdownRef}>
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors ${
                isCollapsed ? 'justify-center' : ''
              }`}
            >
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                {profileData.avatar ? (
                  <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  profileData.name.split(' ').map(n => n[0]).join('')
                )}
              </div>
              
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <div className="font-semibold text-gray-900 dark:text-white text-sm">
                    {profileData.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {profileData.role}
                  </div>
                </div>
              )}
              
              {!isCollapsed && (
                <ChevronDown 
                  size={16} 
                  className={`text-gray-400 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* User Dropdown */}
            {showUserDropdown && (
              <div className={`absolute ${isCollapsed ? 'left-16' : 'left-0'} bottom-16 w-72 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl z-50`}>
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {profileData.avatar ? (
                          <img src={profileData.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          profileData.name.split(' ').map(n => n[0]).join('')
                        )}
                      </div>
                      <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-indigo-500 hover:bg-indigo-600 text-white rounded-full flex items-center justify-center transition-colors">
                        <Camera size={12} />
                      </button>
                    </div>
                    <div className="flex-1">
                      {editingProfile ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={profileData.name}
                            onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded bg-white dark:bg-slate-700 text-gray-900 dark:text-white"
                          />
                          <div className="flex gap-1">
                            <button
                              onClick={handleProfileUpdate}
                              className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => setEditingProfile(false)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {profileData.name}
                            </div>
                            <button
                              onClick={() => setEditingProfile(true)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {profileData.role}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-2">
                  <div className="mb-3 px-3 py-2">
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Account
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="text-gray-900 dark:text-white">{profileData.email}</div>
                      <div className="text-gray-500 dark:text-gray-400">Backup: {profileData.backupEmail}</div>
                    </div>
                  </div>

                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <User size={16} />
                    Manage Profile
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Mail size={16} />
                    Update Email
                  </button>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                    <Key size={16} />
                    Change Password
                  </button>
                  
                  <div className="border-t border-gray-200 dark:border-slate-700 my-2"></div>
                  
                  <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddAdminModal && <AddAdminModal />}
    </>
  );
};

export default HeadAdminSidebar;