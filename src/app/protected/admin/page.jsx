'use client'
import React, { useState, useEffect } from 'react';
import {
  Users, GraduationCap, UserCheck, Wallet, Megaphone,
  FileText, TrendingUp, Activity, ArrowRight, AlertCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';

const JADE = '#0E9F6E';
const COMPOSITION_COLORS = ['#0E9F6E', '#3B82F6', '#C9A24A', '#94A3B8'];

const AdminDashboard = () => {
  const [overview, setOverview] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const [overviewRes, subscriptionRes, activityRes] = await Promise.all([
        fetch('/api/protected/admin/stats/overview'),
        fetch('/api/protected/admin/subscription/status'),
        fetch('/api/protected/admin/stats/activity'),
      ]);
      if (overviewRes.ok) setOverview((await overviewRes.json()).data);
      if (subscriptionRes.ok) setSubscription((await subscriptionRes.json()).subscription);
      if (activityRes.ok) setActivity((await activityRes.json()).activities || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8F7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#0E9F6E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totals = overview?.totals || {};
  const composition = (overview?.composition || []).filter(c => c.value > 0);

  return (
    <div className="min-h-screen bg-[#F7F8F7]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">A quick look at how your school is doing right now.</p>
        </div>

        {/* Stat row — honest numbers, no fabricated trend percentages */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard icon={GraduationCap} label="Students" value={totals.students || 0} href="/protected/admin/users?tab=students" />
          <StatCard icon={UserCheck} label="Teachers" value={totals.teachers || 0} href="/protected/admin/users?tab=teachers" />
          <StatCard icon={Users} label="Admins" value={totals.admins || 0} href="/protected/admin/users?tab=admins" />
          <StatCard
            icon={Activity}
            label="Active, last 30 days"
            value={totals.activeUsers || 0}
            sublabel={totals.totalUsers ? `of ${totals.totalUsers} total` : undefined}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Composition chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Who's on U-Plus</h3>
            <p className="text-gray-400 text-xs mb-4">Active accounts by role</p>
            {composition.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={composition} dataKey="value" nameKey="name" innerRadius={38} outerRadius={58} paddingAngle={2}>
                        {composition.map((entry, i) => (
                          <Cell key={entry.name} fill={COMPOSITION_COLORS[i % COMPOSITION_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {composition.map((entry, i) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: COMPOSITION_COLORS[i % COMPOSITION_COLORS.length] }} />
                      <span className="text-gray-600">{entry.name}</span>
                      <span className="text-gray-900 font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyChart label="No users yet" />
            )}
          </div>

          {/* Weekly signups chart — real data, not a fabricated trend badge */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 lg:col-span-2">
            <h3 className="font-semibold text-gray-900 mb-1">New accounts this week</h3>
            <p className="text-gray-400 text-xs mb-4">Students, teachers, and staff added, by day</p>
            {overview?.weeklySignups?.some(d => d.signups > 0) ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={overview.weeklySignups}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94A3B8' }} />
                  <Tooltip cursor={{ fill: '#F7F8F7' }} contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                  <Bar dataKey="signups" fill={JADE} radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="No new accounts this week" height={180} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick actions */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-5">Quick actions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Add a student', icon: GraduationCap, href: '/protected/admin/users?tab=students&action=create' },
                { title: 'Add a teacher', icon: UserCheck, href: '/protected/admin/users?tab=teachers&action=create' },
                { title: 'Post an announcement', icon: Megaphone, href: '/protected/admin/announcements' },
                { title: 'Import users (CSV)', icon: FileText, href: '/protected/admin/users/import' },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <a
                    key={action.title}
                    href={action.href}
                    className="flex items-center gap-3 p-4 rounded-xl border border-gray-100 hover:border-[#0E9F6E]/30 hover:bg-[#0E9F6E]/[0.03] transition-colors group"
                  >
                    <div className="w-10 h-10 rounded-lg bg-[#0E9F6E]/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-[#0E9F6E]" />
                    </div>
                    <span className="font-medium text-gray-800 text-sm">{action.title}</span>
                    <ArrowRight className="w-4 h-4 text-gray-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Right column: fees + billing + activity */}
          <div className="space-y-6">
            <a
              href="/protected/admin/fees"
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0E9F6E]/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-[#0E9F6E]" />
                <span className="text-sm font-medium text-gray-500">Outstanding fees</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(overview?.fees?.outstandingAmount)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {overview?.fees?.outstandingCount || 0} unpaid
                {overview?.fees?.overdueCount > 0 && (
                  <span className="text-amber-600"> · {overview.fees.overdueCount} overdue</span>
                )}
              </p>
            </a>

            <a
              href="/protected/admin/subscription"
              className="block bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0E9F6E]/30 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-[#0E9F6E]" />
                <span className="text-sm font-medium text-gray-500">Estimated monthly cost</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(subscription?.pricing?.individual?.totalCost)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Based on {totals.totalUsers || 0} active users</p>
            </a>

            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-[#0E9F6E]" />
                <span className="text-sm font-medium text-gray-500">Recent activity</span>
              </div>
              {activity.length > 0 ? (
                <div className="space-y-3">
                  {activity.slice(0, 5).map((item, i) => (
                    <div key={i} className="text-sm">
                      <p className="text-gray-700">{item.description}</p>
                      <p className="text-gray-400 text-xs">{new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <AlertCircle className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Nothing new this week</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function StatCard({ icon: Icon, label, value, sublabel, href }) {
  const content = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:border-[#0E9F6E]/30 transition-colors h-full">
      <div className="w-9 h-9 rounded-lg bg-[#0E9F6E]/10 flex items-center justify-center mb-4">
        <Icon className="w-4.5 h-4.5 text-[#0E9F6E]" />
      </div>
      <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
  return href ? <a href={href}>{content}</a> : content;
}

function EmptyChart({ label, height = 130 }) {
  return (
    <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
      {label}
    </div>
  );
}

export default AdminDashboard;
