'use client'
import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Loader2, LogOut, Users, LayoutDashboard, Wallet, Megaphone } from 'lucide-react';
import { applyBrandColor } from '@/lib/theme';

export default function ParentLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
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
      applyBrandColor(data.school?.themeColor);
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
        <nav className="max-w-5xl mx-auto px-4 flex gap-1 -mb-px">
          <NavLink href="/protected/parent/dashboard" pathname={pathname} icon={LayoutDashboard} label="Dashboard" />
          <NavLink href="/protected/parent/fees" pathname={pathname} icon={Wallet} label="Fees" />
          <NavLink href="/protected/parent/announcements" pathname={pathname} icon={Megaphone} label="Announcements" />
        </nav>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, pathname, icon: Icon, label }) {
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        isActive ? 'border-emerald-500 text-white' : 'border-transparent text-gray-400 hover:text-white'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </Link>
  );
}
