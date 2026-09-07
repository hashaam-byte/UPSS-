'use client'
import React, { useState } from 'react';
import { Shield, ExternalLink, Loader2 } from 'lucide-react';

// Full-screen blocking overlay shown on an admin's first login until they
// accept the Privacy Policy, Terms of Service, and Refund Policy. Rendered
// by the admin layout when policyAcceptedAt is null on the current user.
export default function PolicyConsentGate({ onAccepted }) {
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!agreed) {
      setError('Please confirm you have read and agree to continue.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/protected/accept-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ agreed: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      onAccepted?.();
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-slate-900 border border-white/10 rounded-2xl p-8">
        <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-5">
          <Shield className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Before you continue</h2>
        <p className="text-gray-400 text-sm mb-6">
          Please review these documents before using U-Plus. They cover how your
          school's data is handled, the terms of your subscription, and our refund
          policy.
        </p>

        <div className="space-y-2 mb-6">
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-200 text-sm transition-colors">
            Privacy Policy <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-200 text-sm transition-colors">
            Terms of Service <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
          <a href="/refund-policy" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-200 text-sm transition-colors">
            Refund Policy <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-4 h-4 rounded accent-emerald-500"
          />
          <span className="text-sm text-gray-300">
            I have read and agree to the Privacy Policy, Terms of Service, and Refund Policy.
          </span>
        </label>

        <button
          onClick={handleContinue}
          disabled={loading || !agreed}
          className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Agree and continue'}
        </button>
      </div>
    </div>
  );
}
