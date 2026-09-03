'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LogOut, Users } from 'lucide-react';

export default function ParentLayout({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    verifyAccess();
  }, []);

  const verifyAccess = async () => {
    try {
      const res = await fetch('/api/auth/verify', { credentials: 'include' });
      const data = await res.json();

      if (!res.ok || !data.authenticated || data.user.role !== 'PARENT') {
        router.push('/auth/parent');
        return;
      }

      setUser(data.user);
    } catch (err) {
      router.push('/auth/parent');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/parent');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-900">
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Users className="w-5 h-5 text-emerald-400" />
            U-Plus Parent Portal
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
