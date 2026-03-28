// Page: /app/protected/teacher/director/subjects/page.jsx
// Director Subject Catalog Dashboard

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SubjectCatalogTable from '@/components/director/SubjectCatalogTable';
import CreateSubjectModal from '@/components/director/CreateSubjectModal';
import SubjectStatsCards from '@/components/director/SubjectStatsCards';
import StreamManagement from '@/components/director/StreamManagement';

export default function DirectorSubjectsDashboard() {
  const router = useRouter();
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [directorInfo, setDirectorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState('subjects'); // 'subjects' or 'streams'
  
  // Filters
  const [filters, setFilters] = useState({
    subjectType: '',
    isActive: 'true',
    search: '',
  });

  // Fetch subjects catalog
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.subjectType) queryParams.append('subjectType', filters.subjectType);
      if (filters.isActive) queryParams.append('isActive', filters.isActive);
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(
        `/api/protected/teachers/director/subjects/catalog?${queryParams.toString()}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch subjects');
      }

      setSubjects(data.subjects);
      setStats(data.stats);
      setDirectorInfo(data.directorInfo);

    } catch (err) {
      console.error('Error fetching catalog:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [filters]);

  const handleCreateSubject = () => {
    setShowCreateModal(true);
  };

  const handleSubjectCreated = () => {
    setShowCreateModal(false);
    fetchCatalog(); // Refresh the list
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!confirm('Are you sure you want to delete this subject?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/protected/teachers/director/subjects/${subjectId}`,
        {
          method: 'DELETE',
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete subject');
      }

      if (data.wasDeactivated) {
        alert(data.message);
      } else {
        alert('Subject deleted successfully');
      }

      fetchCatalog(); // Refresh the list

    } catch (err) {
      console.error('Error deleting subject:', err);
      alert(err.message);
    }
  };

  const handleToggleActive = async (subjectId, currentStatus) => {
    try {
      const response = await fetch(
        `/api/protected/teachers/director/subjects/${subjectId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !currentStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subject');
      }

      alert(data.message);
      fetchCatalog(); // Refresh the list

    } catch (err) {
      console.error('Error updating subject:', err);
      alert(err.message);
    }
  };

  if (loading && !subjects.length) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subject Catalog Management
          </h1>
          {directorInfo && (
            <p className="text-gray-600">
              Managing subjects for{' '}
              <span className="font-semibold">{directorInfo.canManage}</span> •{' '}
              <span className="text-blue-600">{directorInfo.name}</span>
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`${
                activeTab === 'subjects'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
            >
              Subject Catalog
            </button>
            
            {directorInfo?.level === 'SENIOR' && (
              <button
                onClick={() => setActiveTab('streams')}
                className={`${
                  activeTab === 'streams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                Stream Management
              </button>
            )}
          </nav>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'subjects' ? (
          <>
            {/* Stats Cards */}
            {stats && <SubjectStatsCards stats={stats} />}

            {/* Filters and Actions */}
            <div className="mb-6 bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                {/* Search */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search subjects by name or code..."
                    value={filters.search}
                    onChange={(e) =>
                      setFilters({ ...filters, search: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Filters */}
                <div className="flex gap-4">
                  <select
                    value={filters.subjectType}
                    onChange={(e) =>
                      setFilters({ ...filters, subjectType: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Types</option>
                    <option value="CORE">Core</option>
                    <option value="SCIENCE">Science</option>
                    <option value="ARTS">Arts</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="ELECTIVE">Elective</option>
                  </select>

                  <select
                    value={filters.isActive}
                    onChange={(e) =>
                      setFilters({ ...filters, isActive: e.target.value })
                    }
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateSubject}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + Create Subject
                </button>
              </div>
            </div>

            {/* Subject Table */}
            <SubjectCatalogTable
              subjects={subjects}
              loading={loading}
              onDelete={handleDeleteSubject}
              onToggleActive={handleToggleActive}
              onEdit={(subject) => router.push(`/protected/teacher/director/subjects/${subject.id}/edit`)}
            />
          </>
        ) : (
          <StreamManagement directorInfo={directorInfo} />
        )}

        {/* Create Subject Modal */}
        {showCreateModal && (
          <CreateSubjectModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleSubjectCreated}
            directorLevel={directorInfo?.level}
          />
        )}
      </div>
    </div>
  );
}
