// Placeholder MapSubjectsModal component

'use client';

import React from 'react';

export default function MapSubjectsModal({ stream, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Map Subjects - {stream?.displayName}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">Close</button>
        </div>
        <p className="text-sm text-gray-600">MapSubjectsModal not implemented yet. Replace with full implementation from Phase 2 package.</p>
      </div>
    </div>
  );
}
