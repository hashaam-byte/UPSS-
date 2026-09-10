'use client'
import React, { useState, useEffect, useRef } from 'react';
import {
  GraduationCap, UserCheck, Shield, Plus, Search, Filter,
  Edit3, Trash2, Eye, EyeOff, Download, Upload, UserPlus,
  Mail, Phone, Calendar, Check, X, AlertTriangle, Loader2,
  Zap, BookOpen, FileText, CheckCircle, MoreHorizontal,
  ChevronLeft, ChevronRight, Users
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ─── Role config ──────────────────────────────────────────────────────────────
const ROLE_CONFIG = {
  STUDENT: { label: 'Student', color: 'bg-sky-100 text-sky-700 ring-sky-200',     dot: 'bg-sky-500'     },
  TEACHER: { label: 'Teacher', color: 'bg-emerald-100 text-emerald-700 ring-emerald-200', dot: 'bg-emerald-500' },
  Admin:   { label: 'Admin',   color: 'bg-violet-100 text-violet-700 ring-violet-200',    dot: 'bg-violet-500'  },
};

const TEACHER_TYPE_LABELS = {
  coordinator:     'Coordinator',
  director:        'Director',
  class_teacher:   'Class Teacher',
  subject_teacher: 'Subject Teacher',
};

const TABS = [
  { id: 'students', label: 'Students', role: 'student', icon: GraduationCap, accent: 'sky'     },
  { id: 'teachers', label: 'Teachers', role: 'teacher', icon: UserCheck,    accent: 'emerald'  },
  { id: 'Admins',   label: 'Admins',   role: 'Admin',   icon: Shield,        accent: 'violet'   },
];

const CLASS_LEVELS = ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', username: '', password: '',
  role: 'student', phone: '', dateOfBirth: '', address: '', gender: '',
  teacherType: '', coordinatorClasses: [], classTeacherClass: '', classTeacherArm: ''
};

// ─── Small reusable pieces ────────────────────────────────────────────────────
function RolePill({ role }) {
  const cfg = ROLE_CONFIG[role] ?? { label: role, color: 'bg-gray-100 text-gray-600 ring-gray-200', dot: 'bg-gray-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function StatusPill({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ring-1 ${
      active ? 'bg-green-50 text-green-700 ring-green-200' : 'bg-red-50 text-red-600 ring-red-200'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-green-500' : 'bg-red-400'}`} />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function Avatar({ firstName, lastName, role }) {
  const colors = {
    STUDENT: 'from-sky-400 to-blue-500',
    TEACHER: 'from-emerald-400 to-teal-500',
    Admin:   'from-violet-400 to-purple-500',
  };
  return (
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colors[role] ?? 'from-gray-300 to-gray-400'} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>
      {firstName?.[0]}{lastName?.[0]}
    </div>
  );
}

// ─── User Card ────────────────────────────────────────────────────────────────
function UserCard({ user, onEdit, onDelete, onToggle }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const teacherType = user.teacherProfile?.department;
  const coordinatorClasses = user.role === 'TEACHER' && teacherType === 'coordinator'
    ? [...new Set(user.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [])]
    : null;
  const classAssignment = user.role === 'TEACHER' && teacherType === 'class_teacher'
    ? [...new Set(user.teacherProfile?.teacherSubjects?.flatMap(ts => ts.classes) || [])]
    : null;

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 overflow-hidden">
      {/* Top bar – accent color per role */}
      <div className={`h-1 w-full ${
        user.role === 'STUDENT' ? 'bg-sky-400' :
        user.role === 'TEACHER' ? 'bg-emerald-400' : 'bg-violet-400'
      }`} />

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar firstName={user.firstName} lastName={user.lastName} role={user.role} />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 text-[15px] truncate leading-tight">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">@{user.username}</p>
            </div>
          </div>

          {/* Three-dot menu */}
          <div className="relative shrink-0 ml-2">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 w-40 text-sm">
                  <button onClick={() => { onEdit(user.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-50 transition-colors">
                    <Edit3 className="w-3.5 h-3.5" /> Edit user
                  </button>
                  <button onClick={() => { onToggle(user.id, user.isActive); setMenuOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 transition-colors hover:bg-gray-50 ${user.isActive ? 'text-amber-600' : 'text-green-600'}`}>
                    {user.isActive ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {user.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <div className="my-1 border-t border-gray-100" />
                  <button onClick={() => { onDelete(user.id); setMenuOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Info rows */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-700 truncate font-medium">{user.email}</span>
          </div>
          {user.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <span className="text-gray-600">{user.phone}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Teacher sub-info */}
        {user.role === 'TEACHER' && teacherType && (
          <div className="mb-4">
            <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
              {TEACHER_TYPE_LABELS[teacherType] ?? teacherType}
            </span>
            {coordinatorClasses?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {coordinatorClasses.slice(0, 4).map(c => (
                  <span key={c} className="text-xs bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded-md font-medium">{c}</span>
                ))}
                {coordinatorClasses.length > 4 && (
                  <span className="text-xs bg-gray-50 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-md">+{coordinatorClasses.length - 4}</span>
                )}
              </div>
            )}
            {classAssignment?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {classAssignment.map(a => (
                  <span key={a} className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">{a}</span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Student profile info */}
        {user.role === 'STUDENT' && user.studentProfile && (
          <div className="mb-4 text-xs text-gray-500 space-y-0.5">
            {user.studentProfile.className && (
              <p>Class: <span className="text-gray-700 font-medium">{user.studentProfile.className}</span></p>
            )}
            {user.studentProfile.studentId && (
              <p>ID: <span className="text-gray-700 font-medium font-mono">{user.studentProfile.studentId}</span></p>
            )}
          </div>
        )}

        {/* Footer pills */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <RolePill role={user.role} />
            <StatusPill active={user.isActive} />
          </div>
          <span className={`text-xs font-medium ${user.isEmailVerified ? 'text-green-600' : 'text-amber-500'}`}>
            {user.isEmailVerified ? '✓ Verified' : '⚠ Unverified'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Input field helper ───────────────────────────────────────────────────────
function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all";
const selectCls = inputCls + " cursor-pointer";

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab]         = useState('students');
  const [users, setUsers]                 = useState([]);
  const [isLoading, setIsLoading]         = useState(true);
  const [searchQuery, setSearchQuery]     = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [total, setTotal]                 = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [error, setError]                 = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [availableArms, setAvailableArms] = useState([]);
  const [loadingArms, setLoadingArms]     = useState(false);
  const [importFile, setImportFile]       = useState(null);
  const [importResults, setImportResults] = useState(null);
  const [createForm, setCreateForm]       = useState(EMPTY_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const fileInputRef = useRef(null);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => { fetchUsers(); }, [activeTab, currentPage, searchQuery]);

  useEffect(() => {
    if (showCreateModal && createForm.teacherType === 'class_teacher') fetchAvailableArms();
  }, [showCreateModal, createForm.teacherType]);

  const fetchAvailableArms = async () => {
    try {
      setLoadingArms(true);
      const res = await fetch('/api/protected/admin/school/arms');
      const d = await res.json();
      setAvailableArms(res.ok ? (d.arms || []) : ['Silver', 'Diamond', 'Gold']);
    } catch { setAvailableArms(['Silver', 'Diamond', 'Gold']); }
    finally { setLoadingArms(false); }
  };

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const tab = TABS.find(t => t.id === activeTab);
      const params = new URLSearchParams({
        page: currentPage.toString(), limit: '12', role: tab?.role || 'all',
        ...(searchQuery && { search: searchQuery })
      });
      const res = await fetch(`/api/protected/admin/users?${params}`);
      const d = await res.json();
      if (res.ok) {
        setUsers(d.users || []);
        setTotalPages(d.pagination?.pages || 1);
        setTotal(d.pagination?.total || 0);
      } else { setError(d.error || 'Failed to fetch users'); }
    } catch { setError('Network error occurred'); }
    finally { setIsLoading(false); }
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError('');
    if (createForm.role === 'teacher' && createForm.teacherType === 'class_teacher') {
      if (!createForm.classTeacherClass || !createForm.classTeacherArm) {
        setError('Please select both a class and an arm for the class teacher'); return;
      }
    }
    if (createForm.role === 'teacher' && createForm.teacherType === 'coordinator' && !createForm.coordinatorClasses.length) {
      setError('Please select at least one class for the coordinator'); return;
    }
    try {
      setCreateLoading(true);
      const res = await fetch('/api/protected/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(createForm)
      });
      const d = await res.json();
      if (res.ok) { setSuccessMessage('User created successfully'); setShowCreateModal(false); setCreateForm(EMPTY_FORM); fetchUsers(); }
      else setError(d.error || 'Failed to create user');
    } catch { setError('Network error occurred'); }
    finally { setCreateLoading(false); }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/protected/admin/users/${userId}`, { method: 'DELETE' });
      const d = await res.json();
      if (res.ok) { setSuccessMessage('User deleted successfully'); fetchUsers(); }
      else setError(d.error || 'Failed to delete user');
    } catch { setError('Network error occurred'); }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const res = await fetch(`/api/protected/admin/users/${userId}/toggle-status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !currentStatus })
      });
      const d = await res.json();
      if (res.ok) { setSuccessMessage(`User ${!currentStatus ? 'activated' : 'deactivated'}`); fetchUsers(); }
      else setError(d.error || 'Failed to update status');
    } catch { setError('Network error occurred'); }
  };

  const handleImportCSV = async () => {
    if (!importFile) { setError('Please select a CSV file first'); return; }
    try {
      setIsLoading(true); setImportResults(null);
      const tab = TABS.find(t => t.id === activeTab);
      const fd = new FormData();
      fd.append('file', importFile); fd.append('role', tab?.role || 'student');
      const res = await fetch('/api/protected/admin/users/import', { method: 'POST', body: fd });
      const d = await res.json();
      if (res.ok) {
        setImportResults({ success: d.success || 0, failed: d.failed || 0, errors: d.errors || [] });
        setSuccessMessage(`Imported ${d.success} users`); fetchUsers();
        setImportFile(null); if (fileInputRef.current) fileInputRef.current.value = '';
      } else setError(d.error || 'Import failed');
    } catch { setError('Network error during import'); }
    finally { setIsLoading(false); }
  };

  const downloadCSVTemplate = () => {
    const tab = TABS.find(t => t.id === activeTab);
    const role = tab?.role || 'student';
    const rows = {
      student: 'firstName,lastName,email,username,password,phone,dateOfBirth,gender,className,section,parentName,parentPhone,parentEmail\nJohn,Doe,john@example.com,johndoe,Pass1234,+234801234,2005-01-15,male,SS1,A,Jane Doe,+234808765,jane@example.com',
      teacher: 'firstName,lastName,email,username,password,phone,dateOfBirth,gender,teacherType,coordinatorClasses,classTeacherClass,classTeacherArm\nJane,Smith,jane@example.com,janesmith,Pass1234,+234801234,1985-03-20,female,subject_teacher,,,',
      Admin:   'firstName,lastName,email,username,password,phone,dateOfBirth,gender\nAdmin,User,Admin@example.com,Adminuser,Pass1234,+234801234,1990-05-10,male'
    };
    const blob = new Blob([rows[role]], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement('a'), { href: url, download: `${role}_template.csv` });
    document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  };

  const generatePassword = () => {
    const c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%';
    setCreateForm(p => ({ ...p, password: Array.from({ length: 12 }, () => c[Math.floor(Math.random() * c.length)]).join('') }));
  };

  const toggleCoordinatorClass = (cls) =>
    setCreateForm(p => ({
      ...p, coordinatorClasses: p.coordinatorClasses.includes(cls)
        ? p.coordinatorClasses.filter(c => c !== cls)
        : [...p.coordinatorClasses, cls]
    }));

  const activeTabData = TABS.find(t => t.id === activeTab);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* ── Page header ───────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-500 text-sm mt-1">{total} total users across all roles</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
            >
              <Upload className="w-4 h-4" /> Import CSV
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-700 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add User
            </button>
          </div>
        </div>

        {/* ── Alerts ────────────────────────────────────────────────────────── */}
        {successMessage && (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <CheckCircle className="w-4 h-4" /> {successMessage}
            </div>
            <button onClick={() => setSuccessMessage('')}><X className="w-4 h-4 text-green-500" /></button>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2 text-red-700 text-sm font-medium">
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
            <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
          </div>
        )}

        {/* ── Tabs + search ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active ? 'bg-gray-900 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`Search ${activeTabData?.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-400 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* ── Cards grid ────────────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-sm font-medium">Loading {activeTabData?.label.toLowerCase()}...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Users className="w-14 h-14 mb-4 opacity-30" />
            <p className="font-semibold text-lg text-gray-500">No {activeTabData?.label.toLowerCase()} found</p>
            <p className="text-sm mt-1">Try adjusting your search or add a new user</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={id => router.push(`/protected/admin/users/${id}/edit`)}
                onDelete={handleDeleteUser}
                onToggle={handleToggleStatus}
              />
            ))}
          </div>
        )}

        {/* ── Pagination ────────────────────────────────────────────────────── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-gray-500">
              Page <span className="font-semibold text-gray-700">{currentPage}</span> of {totalPages} · {total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Import Modal ──────────────────────────────────────────────────────── */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Import from CSV</h2>
                <p className="text-sm text-gray-500 mt-0.5">Bulk import {activeTabData?.label.toLowerCase()}</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResults(null); }} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">Download the template first</p>
                  <p className="text-xs text-gray-500 mt-0.5">Ensure your CSV matches the required format</p>
                </div>
                <button onClick={downloadCSVTemplate} className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors">
                  <Download className="w-3.5 h-3.5" /> Template
                </button>
              </div>

              <label htmlFor="csv-upload" className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700">{importFile ? importFile.name : 'Click to select CSV file'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{importFile ? 'Ready to import' : 'or drag and drop here'}</p>
                </div>
                <input ref={fileInputRef} id="csv-upload" type="file" accept=".csv" onChange={e => {
                  const f = e.target.files[0];
                  f?.type === 'text/csv' ? setImportFile(f) : setError('Please select a valid CSV file');
                }} className="hidden" />
              </label>

              {importResults && (
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <p className="text-sm font-semibold text-green-800 mb-1">Import complete</p>
                  <p className="text-sm text-green-700">✓ {importResults.success} users imported successfully</p>
                  {importResults.failed > 0 && <p className="text-sm text-red-600 mt-0.5">✗ {importResults.failed} failed</p>}
                </div>
              )}
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button onClick={() => { setShowImportModal(false); setImportFile(null); setImportResults(null); }} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                {importResults ? 'Close' : 'Cancel'}
              </button>
              {!importResults && (
                <button onClick={handleImportCSV} disabled={!importFile || isLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Importing...</> : <><Upload className="w-4 h-4" /> Import</>}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create User Modal ──────────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Create New User</h2>
                <p className="text-sm text-gray-500 mt-0.5">Add a new account to the system</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                {[['firstName','First Name'],['lastName','Last Name']].map(([f, l]) => (
                  <Field key={f} label={l} required>
                    <input type="text" value={createForm[f]} onChange={e => setCreateForm(p => ({ ...p, [f]: e.target.value }))} className={inputCls} required />
                  </Field>
                ))}
              </div>

              <Field label="Email" required>
                <input type="email" value={createForm.email} onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} className={inputCls} required />
              </Field>

              <Field label="Username" required>
                <input type="text" value={createForm.username} onChange={e => setCreateForm(p => ({ ...p, username: e.target.value }))} className={inputCls} required />
              </Field>

              {/* Role + teacher type */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Role" required>
                  <select value={createForm.role} onChange={e => setCreateForm({ ...EMPTY_FORM, role: e.target.value })} className={selectCls} required>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="Admin">Admin</option>
                  </select>
                </Field>
                {createForm.role === 'teacher' && (
                  <Field label="Teacher Type" required>
                    <select value={createForm.teacherType} onChange={e => setCreateForm(p => ({ ...p, teacherType: e.target.value, coordinatorClasses: [], classTeacherClass: '', classTeacherArm: '' }))} className={selectCls} required>
                      <option value="">Select type</option>
                      <option value="coordinator">Coordinator</option>
                      <option value="director">Director</option>
                      <option value="class_teacher">Class Teacher</option>
                      <option value="subject_teacher">Subject Teacher</option>
                    </select>
                  </Field>
                )}
              </div>

              {/* Coordinator classes */}
              {createForm.role === 'teacher' && createForm.teacherType === 'coordinator' && (
                <div>
                  <Field label="Coordinator Classes" required>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      {CLASS_LEVELS.map(cls => (
                        <label key={cls} className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-all text-sm font-medium ${
                          createForm.coordinatorClasses.includes(cls) ? 'bg-gray-900 border-gray-900 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}>
                          <input type="checkbox" checked={createForm.coordinatorClasses.includes(cls)} onChange={() => toggleCoordinatorClass(cls)} className="sr-only" />
                          {cls}
                        </label>
                      ))}
                    </div>
                  </Field>
                </div>
              )}

              {/* Class teacher */}
              {createForm.role === 'teacher' && createForm.teacherType === 'class_teacher' && (
                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Class Assignment</p>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Class Level" required>
                      <select value={createForm.classTeacherClass} onChange={e => setCreateForm(p => ({ ...p, classTeacherClass: e.target.value }))} className={selectCls} required>
                        <option value="">Select class</option>
                        {CLASS_LEVELS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </Field>
                    <Field label="Arm" required>
                      {loadingArms ? (
                        <div className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-400">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <select value={createForm.classTeacherArm} onChange={e => setCreateForm(p => ({ ...p, classTeacherArm: e.target.value }))} className={`${selectCls} ${!createForm.classTeacherClass ? 'opacity-50 cursor-not-allowed' : ''}`} required disabled={!createForm.classTeacherClass}>
                          <option value="">Select arm</option>
                          {availableArms.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      )}
                    </Field>
                  </div>
                  {createForm.classTeacherClass && createForm.classTeacherArm && (
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <p className="text-sm font-semibold text-emerald-700">
                        Assigned to: {createForm.classTeacherClass} {createForm.classTeacherArm}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Password */}
              <Field label="Password" required>
                <div className="flex gap-2">
                  <input type="text" value={createForm.password} onChange={e => setCreateForm(p => ({ ...p, password: e.target.value }))} className={`${inputCls} flex-1 font-mono`} required minLength={8} placeholder="Min. 8 characters" />
                  <button type="button" onClick={generatePassword} className="px-3 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-700 transition-colors" title="Generate">
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              </Field>

              {/* Phone + Gender */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Phone">
                  <input type="tel" value={createForm.phone} onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Gender">
                  <select value={createForm.gender} onChange={e => setCreateForm(p => ({ ...p, gender: e.target.value }))} className={selectCls}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={createLoading} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors">
                  {createLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : <><UserPlus className="w-4 h-4" /> Create User</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}pre