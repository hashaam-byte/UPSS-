'use client'
import React, { useEffect, useState } from 'react';

export default function SubjectTeacherSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/subject/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data.settings || {});
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Subject Teacher Settings</h1>
      <pre>{JSON.stringify(settings, null, 2)}</pre>
    </div>
  );
}
