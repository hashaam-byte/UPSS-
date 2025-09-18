import React from 'react';
import Link from 'next/link';
import { Users, BarChart3, MessageSquare, Settings, Home, Activity, Calendar } from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard', href: '/protected/teacher/class/dashboard', icon: Home },
  { title: 'My Students', href: '/protected/teacher/class/students', icon: Users },
  { title: 'Performance', href: '/protected/teacher/class/performance', icon: BarChart3 },
  { title: 'Messages', href: '/protected/teacher/class/messages', icon: MessageSquare },
  { title: 'Timetables', href: '/protected/teacher/class/timetables', icon: Calendar },
  { title: 'Settings', href: '/protected/teacher/class/settings', icon: Settings }
];

export default function ClassTeacherLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-purple-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-purple-700">Class Teacher Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded hover:bg-purple-800 transition">
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-purple-50">{children}</main>
    </div>
  );
}
