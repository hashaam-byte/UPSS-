'use client'
import React, { useEffect, useState } from 'react';

export default function SubjectTeacherMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/protected/teachers/subject/messages')
      .then(res => res.json())
      .then(data => {
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load messages');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h1>Subject Teacher Messages</h1>
      <pre>{JSON.stringify(messages, null, 2)}</pre>
    </div>
  );
}
