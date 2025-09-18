import React from 'react';
import Link from 'next/link';
import { Users, BarChart3, MessageSquare, Settings, Home, Calendar, Activity } from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard', href: '/protected/teacher/coordinator/dashboard', icon: Home },
  { title: 'Timetables', href: '/protected/teacher/coordinator/timetables', icon: Calendar },
  { title: 'Subject Allocation', href: '/protected/teacher/coordinator/allocation', icon: Users },
  { title: 'Reports', href: '/protected/teacher/coordinator/reports', icon: BarChart3 },
  { title: 'Messages', href: '/protected/teacher/coordinator/messages', icon: MessageSquare },
  { title: 'Settings', href: '/protected/teacher/coordinator/settings', icon: Settings }
];

export default function CoordinatorLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-green-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-green-700">Coordinator Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded hover:bg-green-800 transition">
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-green-50">{children}</main>
    </div>
  );
}
