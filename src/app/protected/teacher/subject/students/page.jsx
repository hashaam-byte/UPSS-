'use client'
import React, { useEffect, useState } from 'react';

export default function SubjectTeacherStudents() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/subject/students')
      .then(res => res.json())
      .then(data => {
        setStudents(data.students || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load students');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Subject Teacher Students</h1>
      <pre>{JSON.stringify(students, null, 2)}</pre>
    </div>
  );
}
