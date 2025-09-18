import React from 'react';
import Link from 'next/link';
import { BookOpen, BarChart3, MessageSquare, Settings, Home, Activity, Calendar } from 'lucide-react';

const sidebarItems = [
  { title: 'Dashboard', href: '/protected/teacher/subject/dashboard', icon: Home },
  { title: 'My Subjects', href: '/protected/teacher/subject/subjects', icon: BookOpen },
  { title: 'Assignments', href: '/protected/teacher/subject/assignments', icon: Activity },
  { title: 'Performance', href: '/protected/teacher/subject/performance', icon: BarChart3 },
  { title: 'Messages', href: '/protected/teacher/subject/messages', icon: MessageSquare },
  { title: 'Settings', href: '/protected/teacher/subject/settings', icon: Settings }
];

export default function SubjectTeacherLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-pink-900 text-white flex flex-col">
        <div className="p-6 font-bold text-xl border-b border-pink-700">Subject Teacher Panel</div>
        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 p-3 rounded hover:bg-pink-800 transition">
              <item.icon className="w-5 h-5" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-pink-50">{children}</main>
    </div>
  );
}
