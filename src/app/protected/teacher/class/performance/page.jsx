// /app/protected/teacher/class/performance/page.jsx
'use client'
import React, { useEffect, useState } from 'react';

export default function ClassTeacherPerformance() {
  const [performance, setPerformance] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/class/performance')
      .then(res => res.json())
      .then(data => {
        setPerformance(data.performance || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load performance');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Class Teacher Performance</h1>
      <pre>{JSON.stringify(performance, null, 2)}</pre>
    </div>
  );
}