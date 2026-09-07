'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, User, BookOpen, CalendarCheck,
  FileText, TrendingUp, TrendingDown, Minus
} from 'lucide-react';

const TABS = [
  { id: 'grades', label: 'Grades', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'tests', label: 'Tests & Exams', icon: FileText },
  { id: 'assignments', label: 'Assignments', icon: FileText },
];

export default function ChildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.studentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [activeTab, setActiveTab] = useState('grades');

  useEffect(() => {
    fetchChildData();
  }, [studentId]);

  const fetchChildData = async () => {
    try {
      const res = await fetch(`/api/protected/parent/child/${studentId}`, { credentials: 'include' });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to load student data');
        return;
      }
      setData(json.data);
    } catch (err) {
      setError('Network error while loading student data');
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
        <p className="text-red-300 mb-4">{error}</p>
        <button onClick={() => router.push('/protected/parent/dashboard')} className="text-emerald-400 hover:underline">
          Back to dashboard
        </button>
      </div>
    );
  }

  const { student, grades, attendance, tests, assignments } = data;

  return (
    <div>
      <button
        onClick={() => router.push('/protected/parent/dashboard')}
        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </button>

      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{student.name}</h1>
          <p className="text-gray-400 text-sm">
            {student.className} {student.section ? `- ${student.section}` : ''} · {student.studentId}
          </p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard
          label="Attendance rate"
          value={attendance.rate !== null ? `${attendance.rate}%` : 'N/A'}
          tone={attendance.rate === null ? 'neutral' : attendance.rate >= 85 ? 'good' : attendance.rate >= 70 ? 'warn' : 'bad'}
        />
        <StatCard label="Grades recorded" value={grades.length} tone="neutral" />
        <StatCard label="Tests taken" value={tests.length} tone="neutral" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'grades' && <GradesTab grades={grades} />}
      {activeTab === 'attendance' && <AttendanceTab attendance={attendance} />}
      {activeTab === 'tests' && <SubmissionsTab items={tests} emptyLabel="No tests or exams recorded yet." />}
      {activeTab === 'assignments' && <SubmissionsTab items={assignments} emptyLabel="No assignments recorded yet." />}
    </div>
  );
}

function StatCard({ label, value, tone }) {
  const toneClasses = {
    good: 'text-emerald-400',
    warn: 'text-yellow-400',
    bad: 'text-red-400',
    neutral: 'text-white',
  };
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className={`text-2xl font-bold ${toneClasses[tone]}`}>{value}</p>
    </div>
  );
}

function GradesTab({ grades }) {
  if (grades.length === 0) {
    return <EmptyState text="No grades recorded yet." />;
  }
  return (
    <div className="space-y-3">
      {grades.map((g) => (
        <div key={g.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{g.assessmentName}</p>
            <p className="text-gray-400 text-xs">
              {g.subject} · {g.assessmentType} · {g.term} {g.academicYear}
            </p>
            {g.comments && <p className="text-gray-500 text-xs mt-1 italic">"{g.comments}"</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-white font-bold text-lg">{g.score}/{g.maxScore}</p>
            <div className="flex items-center gap-1 justify-end text-xs text-gray-400">
              {g.classAverage != null && (
                <>
                  {Number(g.percentage) > Number(g.classAverage) ? (
                    <TrendingUp className="w-3 h-3 text-emerald-400" />
                  ) : Number(g.percentage) < Number(g.classAverage) ? (
                    <TrendingDown className="w-3 h-3 text-red-400" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  <span>class avg {g.classAverage}%</span>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTab({ attendance }) {
  if (attendance.totalMarked === 0) {
    return <EmptyState text="No attendance has been recorded yet." />;
  }
  const statusColors = {
    present: 'bg-emerald-500/20 text-emerald-300',
    late: 'bg-yellow-500/20 text-yellow-300',
    absent: 'bg-red-500/20 text-red-300',
    excused: 'bg-blue-500/20 text-blue-300',
    partial: 'bg-purple-500/20 text-purple-300',
  };
  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-6">
        {Object.entries(attendance.counts).map(([status, count]) => (
          <span key={status} className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || 'bg-white/10 text-gray-300'}`}>
            {status}: {count}
          </span>
        ))}
      </div>
      <div className="space-y-2">
        {attendance.recent.map((r, i) => (
          <div key={i} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <span className="text-gray-300 text-sm">
              {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              {r.period ? ` · ${r.period}` : ''}
            </span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[r.status] || 'bg-white/10 text-gray-300'}`}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubmissionsTab({ items, emptyLabel }) {
  if (items.length === 0) {
    return <EmptyState text={emptyLabel} />;
  }
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{item.title}</p>
            <p className="text-gray-400 text-xs capitalize">
              {item.subject} · {item.type} · submitted {new Date(item.submittedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
              {item.isLate && <span className="text-yellow-400"> (late)</span>}
            </p>
            {item.feedback && <p className="text-gray-500 text-xs mt-1 italic">"{item.feedback}"</p>}
          </div>
          <div className="text-right flex-shrink-0">
            {item.score != null ? (
              <p className="text-white font-bold text-lg">{item.score}/{item.maxScore}</p>
            ) : (
              <p className="text-gray-400 text-xs capitalize">{item.status}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="text-center py-16 text-gray-400">
      {text}
    </div>
  );
}
