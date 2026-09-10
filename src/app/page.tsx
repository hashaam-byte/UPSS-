'use client'
import React, { useState, useEffect } from 'react';
import { Manrope, Fraunces } from 'next/font/google';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  UserCheck,
  Shield,
  Crown,
  Users,
  Menu,
  X,
  ArrowRight,
  CalendarCheck,
  BookOpen,
  MessageCircle,
} from 'lucide-react';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', weight: ['400', '500', '600', '700', '800'] });
const fraunces = Fraunces({ subsets: ['latin'], variable: '--font-fraunces', weight: ['400', '500', '600'], style: ['italic', 'normal'] });

const ROLES = [
  { id: 'STUDENT', title: 'Students', icon: GraduationCap, desc: 'Timetables, results, and resources in one place' },
  { id: 'TEACHER', title: 'Teachers', icon: UserCheck, desc: 'Attendance, grading, and assignments, without the paperwork' },
  { id: 'ADMIN', title: 'School Admins', icon: Shield, desc: 'Run the whole school from a single dashboard' },
  { id: 'PARENT', title: 'Parents', icon: Users, desc: "See your child's grades, attendance, and fees" },
  { id: 'HEADADMIN', title: 'Head Admin', icon: Crown, desc: 'Manage every school on the platform' },
];

const FEATURES = [
  {
    title: 'Attendance that takes seconds, not minutes',
    body: 'A class teacher marks a full register in the time it used to take to find the paper one. Parents see it the same day.',
    icon: CalendarCheck,
  },
  {
    title: 'Grades your students can actually trust',
    body: 'Every score, term average, and class position lives in one record — no more results lost between a teacher\'s notebook and the office file.',
    icon: BookOpen,
  },
  {
    title: 'One conversation, not five apps',
    body: 'Messages, announcements, and a parent portal that finally answers "how is my child doing at school?" without a phone call.',
    icon: MessageCircle,
  },
];

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [monthlyPrice, setMonthlyPrice] = useState(300);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    fetch('/api/public/pricing')
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.landingMonthly) setMonthlyPrice(data.data.landingMonthly);
      })
      .catch(() => {});
  }, []);

  const goToLogin = (role?: string) => {
    window.location.href = role ? `/protected?role=${role}` : '/protected';
  };

  return (
    <div className={`${manrope.variable} ${fraunces.variable} font-[family-name:var(--font-manrope)] bg-[#F7F4ED] text-[#14181F]`}>
      {/* ---------- Header ---------- */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrollY > 40 ? 'bg-[#0B0F17]/90 backdrop-blur-xl' : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <span className="text-white font-bold text-lg tracking-tight">U-Plus</span>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/70 hover:text-white text-sm transition-colors">Features</a>
            <a href="#roles" className="text-white/70 hover:text-white text-sm transition-colors">Who it's for</a>
            <a href="#pricing" className="text-white/70 hover:text-white text-sm transition-colors">Pricing</a>
            <button
              onClick={() => goToLogin()}
              className="px-5 py-2 bg-white text-[#0B0F17] rounded-full text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Log in
            </button>
          </nav>

          <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-[#0B0F17] px-6 pb-6 flex flex-col gap-4">
            <a href="#features" className="text-white/70 text-sm" onClick={() => setIsMenuOpen(false)}>Features</a>
            <a href="#roles" className="text-white/70 text-sm" onClick={() => setIsMenuOpen(false)}>Who it's for</a>
            <a href="#pricing" className="text-white/70 text-sm" onClick={() => setIsMenuOpen(false)}>Pricing</a>
            <button onClick={() => goToLogin()} className="px-5 py-2 bg-white text-[#0B0F17] rounded-full text-sm font-semibold w-fit">
              Log in
            </button>
          </div>
        )}
      </header>

      {/* ---------- Hero ---------- */}
      <section className="relative bg-[#0B0F17] pt-40 pb-28 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          >
            <h1 className="text-white font-bold text-5xl md:text-6xl leading-[1.05] tracking-tight">
              Every school record,
              <br />
              open at once.
            </h1>
            <p className="mt-6 text-white/60 text-lg leading-relaxed max-w-md">
              U-Plus brings attendance, grades, timetables, and parent communication
              into one place — built for how Nigerian secondary schools actually run.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <button
                onClick={() => goToLogin()}
                className="flex items-center gap-2 px-7 py-3.5 bg-[#0E9F6E] hover:bg-[#0c8a5f] text-white rounded-full font-semibold transition-colors"
              >
                Get started <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#features"
                className="flex items-center gap-2 px-7 py-3.5 text-white/80 hover:text-white border border-white/15 rounded-full font-semibold transition-colors"
              >
                See how it works
              </a>
            </div>
          </motion.div>

          {/* 3D opening book — the single orchestrated hero moment */}
          <div className="flex justify-center">
            <BookHero />
          </div>
        </div>
      </section>

      {/* ---------- Features ---------- */}
      <section id="features" className="bg-[#F7F4ED] py-28">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-[family-name:var(--font-fraunces)] italic text-3xl md:text-4xl text-[#14181F] max-w-xl mb-20 leading-snug">
            Built from what a school actually does every day.
          </h2>

          <div className="space-y-20">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              const reverse = i % 2 === 1;
              return (
                <div key={feature.title} className={`grid md:grid-cols-2 gap-10 items-center ${reverse ? 'md:[direction:rtl]' : ''}`}>
                  <div className={reverse ? '[direction:ltr]' : ''}>
                    <div className="w-12 h-12 rounded-2xl bg-[#0E9F6E]/10 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-[#0E9F6E]" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold tracking-tight mb-4 max-w-sm">{feature.title}</h3>
                    <p className="text-[#14181F]/60 leading-relaxed max-w-sm">{feature.body}</p>
                  </div>
                  <div className={`bg-[#EAE7DD] rounded-3xl aspect-[4/3] flex items-center justify-center ${reverse ? '[direction:ltr]' : ''}`}>
                    <Icon className="w-16 h-16 text-[#14181F]/15" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Roles ---------- */}
      <section id="roles" className="bg-[#0B0F17] py-28">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-white font-bold text-3xl md:text-4xl tracking-tight mb-3">Who logs in, and to what</h2>
          <p className="text-white/50 mb-14 max-w-md">Every account sees exactly what's relevant to them, nothing more.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {ROLES.map((role) => {
              const Icon = role.icon;
              return (
                <button
                  key={role.id}
                  onClick={() => goToLogin(role.id)}
                  className="text-left p-6 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors group"
                >
                  <Icon className="w-6 h-6 text-[#0E9F6E] mb-5" />
                  <p className="text-white font-semibold mb-1.5">{role.title}</p>
                  <p className="text-white/45 text-sm leading-relaxed">{role.desc}</p>
                  <span className="mt-4 flex items-center gap-1 text-[#0E9F6E] text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Log in <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------- Pricing ---------- */}
      <section id="pricing" className="bg-[#F7F4ED] py-28">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-bold text-3xl md:text-4xl tracking-tight mb-4">Simple pricing, per school</h2>
          <p className="text-[#14181F]/55 mb-12 max-w-md mx-auto">
            One plan for schools getting started, and a custom rate for larger ones.
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="p-8 rounded-3xl bg-white border border-[#14181F]/8">
              <p className="text-sm font-semibold text-[#0E9F6E] mb-2">Standard</p>
              <p className="text-5xl font-bold tracking-tight mb-1">
                ₦{monthlyPrice}
                <span className="text-lg font-medium text-[#14181F]/40">/month</span>
              </p>
              <p className="text-[#14181F]/55 text-sm mb-8">Per active user. Cancel anytime.</p>
              <ul className="space-y-3 text-sm text-[#14181F]/70 mb-8">
                <li>Attendance, grading, and timetables</li>
                <li>Parent portal with SMS verification</li>
                <li>Unlimited messaging and announcements</li>
              </ul>
              <button
                onClick={() => goToLogin('ADMIN')}
                className="w-full py-3 bg-[#0E9F6E] hover:bg-[#0c8a5f] text-white rounded-full font-semibold transition-colors"
              >
                Start your school
              </button>
            </div>

            <div className="p-8 rounded-3xl bg-[#14181F] text-white">
              <p className="text-sm font-semibold text-[#C9A24A] mb-2">Custom</p>
              <p className="text-5xl font-bold tracking-tight mb-1">Let's talk</p>
              <p className="text-white/50 text-sm mb-8">For schools with 600+ students.</p>
              <ul className="space-y-3 text-sm text-white/70 mb-8">
                <li>Everything in Standard</li>
                <li>Flat monthly rate, not per user</li>
                <li>Direct line to the U-Plus team</li>
              </ul>
              <button
                onClick={() => goToLogin('ADMIN')}
                className="w-full py-3 bg-white text-[#14181F] rounded-full font-semibold hover:bg-white/90 transition-colors"
              >
                Get in touch
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="bg-[#0B0F17] py-14 border-t border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <span className="text-white font-bold">U-Plus</span>
          <div className="flex flex-wrap gap-6 text-white/45 text-sm">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/refund-policy" className="hover:text-white transition-colors">Refunds</a>
          </div>
          <span className="text-white/30 text-sm">© {new Date().getFullYear()} U-Plus</span>
        </div>
      </footer>
    </div>
  );
}

// The single orchestrated hero moment: a book opening in 3D, revealing
// fragments of the product (attendance, a grade, a message) as its pages.
function BookHero() {
  return (
    <div className="relative" style={{ perspective: '1600px' }}>
      <div className="relative w-[280px] h-[360px] sm:w-[340px] sm:h-[430px]">
        {/* Back cover */}
        <div className="absolute inset-0 rounded-r-xl rounded-l-sm bg-[#0E9F6E] shadow-2xl" />

        {/* Pages, revealed as the cover opens */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.9 + i * 0.15, duration: 0.5 }}
            className="absolute rounded-r-lg bg-[#FAF8F2] shadow-lg flex items-center justify-center px-6"
            style={{
              inset: `${6 + i * 8}px ${-4 - i * 4}px ${6 + i * 8}px ${6 + i * 4}px`,
              zIndex: 3 - i,
            }}
          >
            {i === 0 && <PageContent icon={CalendarCheck} label="Present" sub="Today, 8:02am" />}
            {i === 1 && <PageContent icon={BookOpen} label="A — 91%" sub="Mathematics" />}
            {i === 2 && <PageContent icon={MessageCircle} label="Sent" sub="Term report ready" />}
          </motion.div>
        ))}

        {/* Front cover, animates open on load */}
        <motion.div
          initial={{ rotateY: 0 }}
          animate={{ rotateY: -155 }}
          transition={{ delay: 0.35, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0 rounded-r-xl rounded-l-sm bg-gradient-to-br from-[#12B37F] to-[#0A7A54] shadow-2xl flex flex-col items-center justify-center gap-3"
          style={{ transformOrigin: 'left center', transformStyle: 'preserve-3d', backfaceVisibility: 'hidden' }}
        >
          <span className="font-[family-name:var(--font-fraunces)] italic text-white text-3xl">U-Plus</span>
          <span className="text-white/70 text-xs tracking-wide">Your school, connected</span>
        </motion.div>

        {/* Spine shadow for depth */}
        <div className="absolute inset-y-0 left-0 w-3 bg-black/20 rounded-l-sm" />
      </div>
    </div>
  );
}

function PageContent({ icon: Icon, label, sub }: { icon: React.ElementType; label: string; sub: string }) {
  return (
    <div className="text-center">
      <Icon className="w-6 h-6 text-[#0E9F6E] mx-auto mb-2" />
      <p className="font-[family-name:var(--font-fraunces)] text-lg text-[#14181F]">{label}</p>
      <p className="text-[#14181F]/45 text-xs mt-0.5">{sub}</p>
    </div>
  );
}
