'use client'
import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Calendar, 
  FileText, 
  Users, 
  Award, 
  Zap, 
  ChevronRight, 
  Menu, 
  X, 
  Star,
  Megaphone,
  BookOpen,
  PartyPopper,
  Download,
  Globe,
  Crown,
  GraduationCap,
  UserCheck,
  Shield
} from 'lucide-react';

const UnifiedLandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [activeRole, setActiveRole] = useState('student');

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: Megaphone, title: 'Digital Notice Board', desc: 'Never miss announcements with real-time updates' },
    { icon: Calendar, title: 'Smart Timetable', desc: 'Manage schedules with live class changes' },
    { icon: BookOpen, title: 'Assignments & Results', desc: 'Submit, track, and get instant feedback' },
    { icon: Users, title: 'Guild of Scholars', desc: 'Video calls, debates, and live classes' },
    { icon: FileText, title: 'Study Resources', desc: 'Notes, eBooks, and past questions' },
    { icon: PartyPopper, title: 'Events Hub', desc: 'Sports, debates, and school activities' }
  ];

  const steps = [
    { number: '01', title: 'Create School', desc: 'Set up your institution in minutes' },
    { number: '02', title: 'Add Users', desc: 'Invite teachers and students' },
    { number: '03', title: 'Run & Manage', desc: 'Experience seamless operations' }
  ];

  const roles = [
    {
      id: 'student',
      title: 'Students',
      emoji: '🎓',
      icon: GraduationCap,
      desc: 'Access timetables, results, and resources',
      color: 'from-blue-400 to-blue-500'
    },
    {
      id: 'teacher',
      title: 'Teachers',
      emoji: '👩‍🏫',
      icon: UserCheck,
      desc: 'Upload assignments, grades, and announcements',
      color: 'from-emerald-400 to-emerald-500'
    },
    {
      id: 'admin',
      title: 'Admins',
      emoji: '🏫',
      icon: Shield,
      desc: 'Manage dashboards, events, and school data',
      color: 'from-purple-400 to-purple-500'
    }
  ];

  interface Feature {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    desc: string;
  }

  interface Step {
    number: string;
    title: string;
    desc: string;
  }

  interface Role {
    id: string;
    title: string;
    emoji: string;
    icon: React.ComponentType<{ className?: string }>;
    desc: string;
    color: string;
  }

  const handleRoleLogin = (role: string) => {
    // Navigate to login with role parameter
    window.location.href = `/protected?role=${role}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <div className="relative font-bold text-white text-xl flex items-center">
                  U<span className="absolute -right-2.5 -top-1 text-sm">+</span>
                </div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                U PLUS
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#roles" className="text-gray-300 hover:text-white transition-colors">Access</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition-colors">Contact</a>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => window.location.href = '/protected'}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Login
              </button>
              <button 
                onClick={() => window.location.href = '/protected'}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
              >
                Get Started
              </button>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-slate-950/95 backdrop-blur-xl border-b border-white/10">
            <div className="px-4 py-4 space-y-4">
              <a href="#features" className="block text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#roles" className="block text-gray-300 hover:text-white transition-colors">Access</a>
              <a href="#pricing" className="block text-gray-300 hover:text-white transition-colors">Pricing</a>
              <a href="#contact" className="block text-gray-300 hover:text-white transition-colors">Contact</a>
              <div className="pt-4 border-t border-white/10 space-y-3">
                <button 
                  onClick={() => window.location.href = '/protected'}
                  className="block w-full text-left text-gray-300 hover:text-white transition-colors"
                >
                  Login
                </button>
                <button 
                  onClick={() => window.location.href = '/protected'}
                  className="w-full px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 shadow-lg shadow-emerald-500/25"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 rounded-full border border-emerald-500/30 mb-8 backdrop-blur-sm">
            <Star className="h-4 w-4 text-emerald-400 mr-2" />
            <span className="text-emerald-300 text-sm font-medium">Nigeria&apos;s #1 School Management Platform</span>
          </div>
          
          {/* 3D Logo placeholder */}
          <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/25 transform hover:scale-110 transition-transform duration-300">
            <div className="relative font-bold text-white text-3xl flex items-center">
              U<span className="absolute -right-3 -top-1.5 text-lg">+</span>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              U PLUS
            </span>
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Your School. Connected.
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            From timetables to assignments, announcements to live classes — everything your school needs in one powerful platform. 
            Experience the future of education management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => window.location.href = '/download'}
              className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center gap-3"
            >
              <Download className="h-5 w-5" />
              Get the App
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => window.location.href = '/protected'}
              className="group px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
            >
              <Globe className="h-5 w-5" />
              Web Portal
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Everything You Need
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              All school activities, simplified in one comprehensive platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-emerald-500/10"
              >
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/25">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-emerald-300 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                How It Works
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-2xl shadow-emerald-500/25">
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-emerald-500/50 to-cyan-500/50 transform translate-x-10"></div>
                  )}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white group-hover:text-emerald-300 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role-Based Access */}
      <section id="roles" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Made for Everyone
              </span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Different roles, tailored experiences
            </p>
          </div>
          
          {/* Role Cards */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {roles.map((role, index) => (
              <div 
                key={index}
                className={`group p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${
                  activeRole === role.id 
                    ? 'border-emerald-500/80 shadow-lg shadow-emerald-500/25' 
                    : 'border-white/10 hover:border-emerald-500/50'
                }`}
                onClick={() => setActiveRole(role.id)}
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${role.color} rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <role.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-center text-white group-hover:text-emerald-300 transition-colors mb-2">
                  {role.title} {role.emoji}
                </h3>
                <p className="text-gray-400 text-center leading-relaxed">
                  {role.desc}
                </p>
              </div>
            ))}
          </div>
          
          {/* Role Login CTA */}
          <div className="text-center">
            <div className="inline-flex bg-white/10 backdrop-blur-sm rounded-full p-2 shadow-lg mb-6 border border-white/20">
              {roles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`px-6 py-3 rounded-full font-semibold capitalize transition-all duration-300 ${
                    activeRole === role.id
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {role.title}
                </button>
              ))}
            </div>
            <div className="block">
              <button 
                onClick={() => handleRoleLogin(activeRole)}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25 flex items-center gap-3 mx-auto"
              >
                Login as {roles.find(r => r.id === activeRole)?.title}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Simple Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400 mb-4">
              Start with a free trial, then choose what works for your school
            </p>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Free Trial */}
            <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/20 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-yellow-500/25">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Free Trial</h3>
                <p className="text-gray-400 mb-6">Perfect for getting started</p>
                <div className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-yellow-400 to-yellow-500 bg-clip-text text-transparent">
                    3 Months
                  </span>
                  <span className="text-lg text-gray-400 font-normal"> FREE</span>
                </div>
                <p className="text-sm text-gray-500 mb-8">All features included, no credit card required</p>
                <button className="w-full px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-yellow-500/25">
                  Start Free Trial
                </button>
              </div>
            </div>

            {/* Standard Premium */}
            <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border-2 border-emerald-500/50 hover:border-emerald-500/80 transition-all duration-300 transform scale-105 shadow-2xl shadow-emerald-500/20">
              <div className="text-center">
                <div className="inline-flex items-center px-3 py-1 bg-emerald-500 rounded-full text-xs font-semibold text-white mb-4">
                  RECOMMENDED
                </div>
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/25">
                  <Award className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">Standard Premium</h3>
                <p className="text-gray-400 mb-6">For individual users</p>
                <div className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    ₦300
                  </span>
                  <span className="text-lg text-gray-400 font-normal">/month</span>
                </div>
                <p className="text-sm text-gray-500 mb-8">Very affordable pricing after trial</p>
                <button className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25">
                  Choose Standard
                </button>
              </div>
            </div>

            {/* School-Wide Premium */}
            <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/20 hover:border-purple-500/50 transition-all duration-300 hover:scale-105 relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Crown className="w-8 h-8 text-yellow-400" />
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-white">School-Wide Premium</h3>
                <p className="text-gray-400 mb-6">For school management</p>
                <div className="text-4xl font-bold mb-2">
                  <span className="bg-gradient-to-r from-purple-400 to-yellow-400 bg-clip-text text-transparent">
                    Custom
                  </span>
                  <span className="text-lg text-gray-400 font-normal"> pricing</span>
                </div>
                <p className="text-sm text-gray-500 mb-8">Head admin pays once for entire school</p>
                <button className="w-full px-8 py-4 bg-gradient-to-r from-purple-500 to-yellow-500 hover:from-purple-600 hover:to-yellow-600 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25">
                  Contact for Pricing 👑
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access for Different Roles */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Quick Access
              </span>
            </h2>
            <p className="text-gray-400">
              Choose your role to get started immediately
            </p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { role: 'Head Admin', path: '/protected/Headadmin/page.tsx?role=head', icon: Crown },
              { role: 'School Admin', path: '/protected/Admin/page.tsx?role=school', icon: Shield },
              { role: 'Teacher', path: '/protected/Teachers/page.tsx?role=teacher', icon: UserCheck },
              { role: 'Student', path: '/protected/students/page.tsx?role=student', icon: GraduationCap }
            ].map((item, index) => (
              <button
                key={index}
                onClick={() => window.location.href = item.path}
                className="group p-6 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-emerald-500/50 rounded-2xl font-medium transition-all duration-300 hover:scale-105 text-center"
              >
                <item.icon className="h-8 w-8 mx-auto mb-3 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                <span className="block text-sm text-gray-300 group-hover:text-white transition-colors">
                  {item.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                What Users Say
              </span>
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/10 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-lg text-gray-300 mb-4 italic">&apos;Now I never miss announcements.&apos;</p>
              <p className="text-emerald-400 font-semibold">— Student</p>
            </div>
            
            <div className="p-8 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm rounded-3xl border border-white/10 text-center">
              <div className="flex justify-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-lg text-gray-300 mb-4 italic">&apos;It is easier to track assignments and results.&apos;</p>
              <p className="text-cyan-400 font-semibold">— Teacher</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 bg-gradient-to-r from-emerald-600/20 to-purple-600/20 backdrop-blur-sm rounded-3xl border border-emerald-500/30">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Ready to Transform Your School?
              </span>
            </h2>
            <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
              Join thousands of schools already using U PLUS to revolutionize their educational experience
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <button 
                onClick={() => window.location.href = '/download'}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500 hover:from-emerald-600 hover:via-cyan-600 hover:to-blue-600 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 flex items-center gap-3"
              >
                <Download className="h-5 w-5" />
                Download Now
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                // onClick={() => window.location.href = '/auth/register'}
                className="group px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-2xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 flex items-center gap-3"
              >
                Start Free Trial
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-6">
              3 months free • No credit card required • Full access to all features
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <div className="relative font-bold text-white text-xl flex items-center">
                    U<span className="absolute -right-2.5 -top-1 text-sm">+</span>
                  </div>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  U PLUS
                </span>
              </div>
              <p className="text-gray-400 mb-4">
                Transforming education through innovative technology. 
                Connect, learn, and grow with Nigeria&apos;s leading school management platform.
              </p>
              <p className="text-emerald-400 font-semibold text-lg">Hard Work Pays</p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-gray-400">
                <p>hashcody63@gmail.com</p>
                <p>+234 (0) 8077291745</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <div className="space-y-2">
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors">Privacy Policy</a>
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors">Terms of Service</a>
                <a href="#" className="block text-gray-400 hover:text-emerald-400 transition-colors">Help Center</a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center text-gray-400">
            <p>&copy; 2025 U PLUS. All rights reserved. Version 1.0.0</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UnifiedLandingPage;