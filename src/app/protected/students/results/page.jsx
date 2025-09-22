'use client'
import React, { useEffect, useState } from 'react';

export default function StudentResults() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/students/results')
      .then(res => res.json())
      .then(data => {
        setResults(data.results || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load results');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Student Results</h1>
      <pre>{JSON.stringify(results, null, 2)}</pre>
    </div>
  );
}
