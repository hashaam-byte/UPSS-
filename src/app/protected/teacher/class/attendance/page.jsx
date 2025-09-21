'use client'
import React, { useEffect, useState } from 'react';

export default function ClassTeacherAttendance() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/class/attendance')
      .then(res => res.json())
      .then(data => {
        setAttendance(data.attendance || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load attendance');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Class Teacher Attendance</h1>
      <pre>{JSON.stringify(attendance, null, 2)}</pre>
    </div>
  );
}
