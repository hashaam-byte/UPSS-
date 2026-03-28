// Placeholder SubjectSelector component

'use client';

import React from 'react';

export default function SubjectSelector({ subjects = [], selected = [], onChange }) {
  return (
    <div>
      <p className="text-sm text-gray-600">SubjectSelector not implemented yet.</p>
      <ul className="mt-2 list-disc pl-5 text-sm text-gray-700">
        {subjects.map(s => (
          <li key={s.id}>{s.name}</li>
        ))}
      </ul>
    </div>
  );
}
