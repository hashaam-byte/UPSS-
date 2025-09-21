'use client'
import React, { useEffect, useState } from 'react';

export default function ClassTeacherAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/class/assignments')
      .then(res => res.json())
      .then(data => {
        setAssignments(data.assignments || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load assignments');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Class Teacher Assignments</h1>
      <pre>{JSON.stringify(assignments, null, 2)}</pre>
    </div>
  );
}
