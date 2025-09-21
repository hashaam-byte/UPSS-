'use client'
import React, { useEffect, useState } from 'react';

export default function SubjectTeacherAnalytics() {
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/subject/analytics')
      .then(res => res.json())
      .then(data => {
        setAnalytics(data.analytics || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load analytics');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Subject Teacher Analytics</h1>
      <pre>{JSON.stringify(analytics, null, 2)}</pre>
    </div>
  );
}
