'use client'
import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, X, Loader2, Pin, AlertTriangle } from 'lucide-react';

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students' },
  { value: 'teachers', label: 'Teachers' },
  { value: 'parents', label: 'Parents' },
];

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showComposer, setShowComposer] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/protected/admin/announcements', { credentials: 'include' });
      const data = await res.json();
      if (res.ok) setAnnouncements(data.data || []);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-emerald-600" />
            Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1">Post a notice to your students, teachers, and/or parents.</p>
        </div>
        <button
          onClick={() => setShowComposer(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No announcements yet.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  {a.isPinned && <Pin className="w-4 h-4 text-emerald-600" />}
                  {a.isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
                  <h3 className="font-semibold text-gray-900">{a.title}</h3>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  {new Date(a.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <p className="text-gray-600 text-sm whitespace-pre-wrap">{a.content}</p>
              <div className="flex gap-1.5 mt-3">
                {(a.targetAudience || []).map((aud) => (
                  <span key={aud} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">{aud}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showComposer && (
        <ComposerModal
          onClose={() => setShowComposer(false)}
          onCreated={() => { setShowComposer(false); fetchAnnouncements(); }}
        />
      )}
    </div>
  );
}

function ComposerModal({ onClose, onCreated }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetAudience, setTargetAudience] = useState(['all']);
  const [isPinned, setIsPinned] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const toggleAudience = (value) => {
    if (value === 'all') {
      setTargetAudience(['all']);
      return;
    }
    setTargetAudience(prev => {
      const withoutAll = prev.filter(a => a !== 'all');
      return withoutAll.includes(value) ? withoutAll.filter(a => a !== value) : [...withoutAll, value];
    });
  };

  const handleSubmit = async () => {
    setError('');
    if (!title || !content) {
      setError('Title and content are required');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/protected/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          content,
          targetAudience: targetAudience.length > 0 ? targetAudience : ['all'],
          isPinned,
          isUrgent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to post announcement');
        return;
      }
      onCreated();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-bold text-gray-900 mb-4">New announcement</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
        )}

        <div className="space-y-3">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
          <textarea placeholder="Write your announcement..." value={content} onChange={(e) => setContent(e.target.value)} rows={5} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />

          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Who should see this?</p>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleAudience(opt.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    targetAudience.includes(opt.value) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isPinned} onChange={(e) => setIsPinned(e.target.checked)} className="accent-emerald-600" />
              Pin to top
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input type="checkbox" checked={isUrgent} onChange={(e) => setIsUrgent(e.target.checked)} className="accent-emerald-600" />
              Mark urgent
            </label>
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full mt-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post announcement'}
        </button>
      </div>
    </div>
  );
}
