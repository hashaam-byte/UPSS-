'use client'
import React, { useEffect, useState } from 'react';

export default function SubjectTeacherGrading() {
  const [grading, setGrading] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/subject/grading')
      .then(res => res.json())
      .then(data => {
        setGrading(data.grading || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load grading data');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Subject Teacher Grading</h1>
      <pre>{JSON.stringify(grading, null, 2)}</pre>
    </div>
  );
}
