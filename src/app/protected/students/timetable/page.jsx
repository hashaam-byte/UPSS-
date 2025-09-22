'use client'
import React, { useEffect, useState } from 'react';

export default function StudentTimetable() {
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/students/timetable')
      .then(res => res.json())
      .then(data => {
        setTimetable(data.timetable || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load timetable');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Student Timetable</h1>
      <pre>{JSON.stringify(timetable, null, 2)}</pre>
    </div>
  );
}
