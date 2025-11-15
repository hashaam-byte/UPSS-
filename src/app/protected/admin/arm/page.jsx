'use client'
import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
  Shield,
  GraduationCap,
  Settings
} from 'lucide-react';

const AdminArmsSettings = () => {
  const [arms, setArms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form states
  const [newArmName, setNewArmName] = useState('');
  const [editingArm, setEditingArm] = useState(null);
  const [editArmName, setEditArmName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchArms();
  }, []);

  const fetchArms = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/protected/admin/school/arms', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setArms(data.arms || []);
      } else {
        throw new Error('Failed to fetch arms');
      }
    } catch (err) {
      setError('Failed to load arms: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddArm = async () => {
    if (!newArmName.trim()) {
      setError('Please enter an arm name');
      return;
    }

    // Check for duplicates
    if (arms.some(arm => arm.toLowerCase() === newArmName.trim().toLowerCase())) {
      setError('This arm already exists');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/protected/admin/school/arms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'add',
          armName: newArmName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArms(data.arms);
        setNewArmName('');
        setSuccess('Arm added successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to add arm');
      }
    } catch (err) {
      setError('Failed to add arm: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEditArm = async (oldName) => {
    if (!editArmName.trim()) {
      setError('Please enter an arm name');
      return;
    }

    // Check for duplicates (excluding current arm)
    if (arms.some(arm => arm.toLowerCase() === editArmName.trim().toLowerCase() && arm !== oldName)) {
      setError('This arm already exists');
      return;
    }

    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/protected/admin/school/arms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'edit',
          oldName,
          newName: editArmName.trim()
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArms(data.arms);
        setEditingArm(null);
        setEditArmName('');
        setSuccess('Arm updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        throw new Error('Failed to update arm');
      }
    } catch (err) {
      setError('Failed to update arm: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArm = async (armName) => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch('/api/protected/admin/school/arms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          action: 'delete',
          armName
        })
      });

      if (response.ok) {
        const data = await response.json();
        setArms(data.arms);
        setShowDeleteConfirm(null);
        setSuccess('Arm deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete arm');
      }
    } catch (err) {
      setError('Failed to delete arm: ' + err.message);
      setShowDeleteConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  const defaultArms = ['Silver', 'Diamond', 'Gold', 'Ruby', 'Emerald', 'Sapphire', 'Platinum', 'Copper', 'Mercury'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              Class Arms Management
            </h2>
            <p className="text-gray-600 mt-1">
              Configure custom arms for your school classes. These will be used by coordinators when assigning students.
            </p>
          </div>
          <Settings className="w-8 h-8 text-gray-400" />
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-700 hover:text-red-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center text-green-700">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Add New Arm */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Arm</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={newArmName}
            onChange={(e) => setNewArmName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAddArm()}
            placeholder="Enter arm name (e.g., Bronze, Titanium)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={saving}
          />
          <button
            onClick={handleAddArm}
            disabled={saving || !newArmName.trim()}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Add Arm
          </button>
        </div>
      </div>

      {/* Current Arms */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900">
            Current Arms ({arms.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Manage your school's class arms. These will be available for coordinators when organizing students.
          </p>
        </div>

        <div className="p-6">
          {arms.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No arms configured yet</p>
              <p className="text-sm text-gray-500">Add your first arm using the form above</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {arms.map((arm) => (
                <div
                  key={arm}
                  className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                  {editingArm === arm ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={editArmName}
                        onChange={(e) => setEditArmName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleEditArm(arm)}
                        className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditArm(arm)}
                          disabled={saving}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingArm(null);
                            setEditArmName('');
                          }}
                          disabled={saving}
                          className="flex-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                          <Shield className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold text-gray-900">{arm}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingArm(arm);
                            setEditArmName(arm);
                          }}
                          disabled={saving}
                          className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Edit arm"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(arm)}
                          disabled={saving}
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete arm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Default Arms Reference */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Default Arms Reference
        </h3>
        <p className="text-blue-700 text-sm mb-3">
          Common arm names used in schools (for reference):
        </p>
        <div className="flex flex-wrap gap-2">
          {defaultArms.map((arm) => (
            <span
              key={arm}
              className="px-3 py-1 bg-white border border-blue-300 text-blue-800 rounded-full text-sm font-medium"
            >
              {arm}
            </span>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Arm</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete the arm <strong>"{showDeleteConfirm}"</strong>?
              This may affect students already assigned to this arm.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteArm(showDeleteConfirm)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminArmsSettings;