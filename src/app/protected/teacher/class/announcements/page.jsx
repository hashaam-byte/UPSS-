'use client'
import React, { useState, useEffect } from 'react';
import { Megaphone, Pin, AlertTriangle, Loader2 } from 'lucide-react';

export default function TeacherClassAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch('/api/protected/announcements', { credentials: 'include' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to load announcements');
        return;
      }
      setAnnouncements(data.data || []);
    } catch (err) {
      setError('Network error while loading announcements');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
        <Megaphone className="w-6 h-6 text-blue-600" />
        Announcements
      </h1>
      <p className="text-gray-500 mb-8 text-sm">Notices from your school.</p>

      {announcements.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No announcements yet.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-2">
                {a.isPinned && <Pin className="w-4 h-4 text-blue-600" />}
                {a.isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
                <h3 className="font-semibold text-gray-900">{a.title}</h3>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap mb-2">{a.content}</p>
              <p className="text-gray-400 text-xs">
                {a.author} · {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
