'use client'
import React, { useEffect, useState } from 'react';

export default function StudentDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/students/dashboard')
      .then(res => res.json())
      .then(data => {
        setDashboard(data.dashboard);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load dashboard');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Student Dashboard</h1>
      <pre>{JSON.stringify(dashboard, null, 2)}</pre>
    </div>
  );
}
