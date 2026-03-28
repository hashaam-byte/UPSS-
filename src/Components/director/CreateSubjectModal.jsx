// Component: /components/director/CreateSubjectModal.jsx
// Modal for creating new subjects

'use client';

import { useState } from 'react';

export default function CreateSubjectModal({ onClose, onSuccess, directorLevel }) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    subjectType: 'CORE',
    classLevel: [],
    eligibleStreams: [],
    isElectiveOption: false,
    electiveGroup: '',
    maxStudents: '',
    creditHours: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isJunior = directorLevel === 'JUNIOR';
  const isSenior = directorLevel === 'SENIOR';

  const availableLevels = isJunior
    ? ['JS1', 'JS2', 'JS3']
    : ['SS1', 'SS2', 'SS3'];

  const subjectTypes = isJunior
    ? ['CORE', 'ELECTIVE', 'VOCATIONAL']
    : ['CORE', 'SCIENCE', 'ARTS', 'COMMERCIAL', 'ELECTIVE', 'VOCATIONAL'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/protected/teachers/director/subjects/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
          creditHours: formData.creditHours ? parseInt(formData.creditHours) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subject');
      }

      alert('Subject created successfully!');
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleClassLevel = (level) => {
    setFormData(prev => ({
      ...prev,
      classLevel: prev.classLevel.includes(level)
        ? prev.classLevel.filter(l => l !== level)
        : [...prev.classLevel, level]
    }));
  };

  const toggleStream = (stream) => {
    setFormData(prev => ({
      ...prev,
      eligibleStreams: prev.eligibleStreams.includes(stream)
        ? prev.eligibleStreams.filter(s => s !== stream)
        : [...prev.eligibleStreams, stream]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Create New Subject</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Mathematics"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Code *
            </label>
            <input
              type="text"
              required
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., MTH-SS"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Brief description of the subject..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject Type *
            </label>
            <select
              required
              value={formData.subjectType}
              onChange={(e) => setFormData({ ...formData, subjectType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {subjectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Class Levels * (Select at least one)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableLevels.map(level => (
                <button
                  key={level}
                  type="button"
                  onClick={() => toggleClassLevel(level)}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    formData.classLevel.includes(level)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {isSenior && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Eligible Streams
              </label>
              <div className="flex flex-wrap gap-2">
                {['SCIENCE', 'ARTS', 'COMMERCIAL'].map(stream => (
                  <button
                    key={stream}
                    type="button"
                    onClick={() => toggleStream(stream)}
                    className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                      formData.eligibleStreams.includes(stream)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {stream}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isElective"
              checked={formData.isElectiveOption}
              onChange={(e) => setFormData({ ...formData, isElectiveOption: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isElective" className="ml-2 block text-sm text-gray-700">
              This is an elective subject
            </label>
          </div>

          {formData.isElectiveOption && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elective Group
              </label>
              <input
                type="text"
                value={formData.electiveGroup}
                onChange={(e) => setFormData({ ...formData, electiveGroup: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., GROUP_A"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Students
              </label>
              <input
                type="number"
                value={formData.maxStudents}
                onChange={(e) => setFormData({ ...formData, maxStudents: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Credit Hours
              </label>
              <input
                type="number"
                value={formData.creditHours}
                onChange={(e) => setFormData({ ...formData, creditHours: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 3"
              />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400"
              disabled={loading || formData.classLevel.length === 0}
            >
              {loading ? 'Creating...' : 'Create Subject'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
