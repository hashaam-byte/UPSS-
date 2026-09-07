'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, KeyRound, Loader2, CheckCircle, X, ArrowLeft, ChevronRight } from 'lucide-react';

export default function ParentDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [resetModalChild, setResetModalChild] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch('/api/protected/parent/dashboard', { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load dashboard');
        return;
      }
      setData(json.data);
    } catch (err) {
      setError('Network error while loading your dashboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Welcome back</h1>
      <p className="text-gray-400 mb-8">{data.school?.name}</p>

      <h2 className="text-lg font-semibold text-white mb-4">Your children</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {data.children.map((child) => (
          <div
            key={child.id}
            className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-white font-medium">{child.name}</p>
                <p className="text-gray-400 text-xs">
                  {child.className} {child.section ? `- ${child.section}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/protected/parent/dashboard/${child.id}`)}
              className="w-full flex items-center justify-between gap-2 py-2.5 px-4 mb-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 text-sm rounded-xl transition-colors"
            >
              <span>View grades, attendance & tests</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setResetModalChild(child)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white text-sm rounded-xl transition-colors"
            >
              <KeyRound className="w-4 h-4" />
              Reset {child.name.split(' ')[0]}'s password
            </button>
          </div>
        ))}
      </div>

      {data.children.length === 0 && (
        <p className="text-gray-400">No children are currently linked to your account.</p>
      )}

      {resetModalChild && (
        <ChildPasswordResetModal
          child={resetModalChild}
          onClose={() => setResetModalChild(null)}
        />
      )}
    </div>
  );
}

function ChildPasswordResetModal({ child, onClose }) {
  const [step, setStep] = useState('request'); // 'request' | 'confirm' | 'done'
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/protected/parent/child-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId: child.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send code');
        return;
      }
      setStep('confirm');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async () => {
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/protected/parent/child-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ studentId: child.id, code, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to reset password');
        return;
      }
      setStep('done');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="max-w-sm w-full bg-slate-900 border border-white/10 rounded-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-white font-semibold mb-1">Reset password for {child.name}</h3>
        <p className="text-gray-400 text-sm mb-5">
          {step === 'request' && "We'll text a code to your own phone number to confirm it's you."}
          {step === 'confirm' && 'Enter the code we just sent you and choose a new password.'}
          {step === 'done' && 'Password updated successfully.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {step === 'request' && (
          <button
            onClick={requestOtp}
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send code to my phone'}
          </button>
        )}

        {step === 'confirm' && (
          <div className="space-y-3">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              placeholder="New password for child"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={confirmReset}
              disabled={loading || code.length !== 6 || !newPassword || !confirmPassword}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update password'}
            </button>
            <button
              onClick={() => setStep('request')}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Resend code
            </button>
          </div>
        )}

        {step === 'done' && (
          <div className="text-center">
            <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
            <button
              onClick={onClose}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
