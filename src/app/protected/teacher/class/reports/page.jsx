// /app/protected/teacher/class/reports/page.jsx
'use client'
import React, { useEffect, useState } from 'react';

export default function ClassTeacherReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/class/reports')
      .then(res => res.json())
      .then(data => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load reports');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Class Teacher Reports</h1>
      <pre>{JSON.stringify(reports, null, 2)}</pre>
    </div>
  );
}