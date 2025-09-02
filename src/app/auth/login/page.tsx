'use client'
import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  UserCheck, 
  Shield, 
  Crown,
  Eye, 
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    schoolSlug: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    {
      id: 'student',
      title: 'Student',
      subtitle: 'Access your timetable, assignments & results',
      icon: GraduationCap,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      glowColor: 'blue-500',
      emoji: '🎓',
      route: '/dashboard/students'
    },
    {
      id: 'teacher',
      title: 'Teacher', 
      subtitle: 'Manage classes, assignments & student progress',
      icon: UserCheck,
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100',
      glowColor: 'emerald-500',
      emoji: '👩‍🏫',
      route: '/dashboard/teachers'
    },
    {
      id: 'admin',
      title: 'Admin',
      subtitle: 'Oversee school operations & manage users',
      icon: Shield,
      gradient: 'from-purple-500 to-purple-600', 
      bgGradient: 'from-purple-50 to-purple-100',
      glowColor: 'purple-500',
      emoji: '🏫',
      route: '/dashboard/admin'
    },
    {
      id: 'head-admin',
      title: 'Head Admin',
      subtitle: 'Full system access & premium management',
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-100',
      glowColor: 'orange-500',
      emoji: '👑',
      route: '/dashboard/headAdmin'
    }
  ];

  const currentRole = roles.find(role => role.id === selectedRole);

  // Get role from URL params and fetch schools
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role && roles.find(r => r.id === role)) {
      setSelectedRole(role);
    }
    
    if (selectedRole !== 'head-admin') {
      fetchSchools();
    }
  }, [selectedRole]);

  const fetchSchools = async () => {
    try {
      const response = await fetch('/api/public/schools');
      const data = await response.json();
      setSchools(data.schools || []);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (error) setError('');
  };

  const handleLogin = (e) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Validation
      if (!formData.identifier || !formData.password) {
        setError('Please enter both username/email and password');
        setIsLoading(false);
        return;
      }

      if (selectedRole !== 'head-admin' && !formData.schoolSlug) {
        setError('Please select your school');
        setIsLoading(false);
        return;
      }

      let apiUrl = '';
      let payload = {};

      if (selectedRole === 'head-admin') {
        apiUrl = '/api/auth/head/login';
        payload = {
          email: formData.identifier,
          password: formData.password
        };
      } else {
        apiUrl = '/api/auth/school/login';
        payload = {
          identifier: formData.identifier,
          password: formData.password,
          role: selectedRole,
          schoolSlug: formData.schoolSlug
        };
      }

      console.log('Login attempt:', { role: selectedRole, apiUrl });

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Invalid credentials');
        setIsLoading(false);
        return;
      }

      // Success - redirect to appropriate dashboard
      console.log(`✅ Login successful for ${selectedRole}`);
      setTimeout(() => {
        window.location.href = data.redirectTo || currentRole.route;
      }, 100);

    } catch (error) {
      console.error('❌ Login error:', error);
      setError('An error occurred during login. Please try again.');
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    window.location.href = `/auth/forgot?type=${selectedRole === 'head-admin' ? 'head' : 'school'}`;
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-r from-yellow-400/15 to-orange-500/15 rounded-full blur-2xl animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto">
        {/* Back to home button */}
        <button
          onClick={handleBackToHome}
          className="mb-8 flex items-center text-gray-400 hover:text-white transition-all duration-300 group"
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>

        {/* Main login container */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row min-h-[700px]">
            
            {/* Left Side - Role Selection */}
            <div className="lg:w-2/5 p-8 lg:p-12 bg-gradient-to-br from-white/5 to-white/0 border-r border-white/10">
              <div>
                {/* Logo */}
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                    <GraduationCap className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                      UPSS Plus
                    </h1>
                    <p className="text-sm text-gray-400">Your School. Connected.</p>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Welcome Back!</h2>
                <p className="text-gray-400 mb-8">Choose your role to continue</p>

                {/* Role Selection */}
                <div className="space-y-3">
                  {roles.map((role) => (
                    <button
                      key={role.id}
                      onClick={() => setSelectedRole(role.id)}
                      className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border-2 group ${
                        selectedRole === role.id
                          ? `bg-gradient-to-r ${role.bgGradient} border-${role.glowColor}/50 shadow-lg shadow-${role.glowColor}/25 scale-105`
                          : 'bg-white/5 border-white/20 hover:border-white/40 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          selectedRole === role.id 
                            ? `bg-gradient-to-r ${role.gradient} shadow-lg shadow-${role.glowColor}/25` 
                            : 'bg-white/10 group-hover:bg-white/20'
                        }`}>
                          <role.icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${selectedRole === role.id ? 'text-gray-800' : 'text-white'}`}>
                              {role.title}
                            </h3>
                            <span className="text-lg">{role.emoji}</span>
                          </div>
                          <p className={`text-sm ${selectedRole === role.id ? 'text-gray-600' : 'text-gray-400'}`}>
                            {role.subtitle}
                          </p>
                        </div>
                        {selectedRole === role.id && (
                          <div className="w-6 h-6 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full flex items-center justify-center shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick Access Links */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-4">Need help?</p>
                  <div className="space-y-2">
                    <button
                      onClick={() => window.open('mailto:support@upss.edu?subject=Login Support Request', '_blank')}
                      className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors"
                    >
                      📧 Contact Support
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-3/5 p-8 lg:p-12 bg-gradient-to-br from-white/5 to-transparent">
              <div>
                {/* Role Header */}
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 bg-gradient-to-r ${currentRole.gradient}/20 border border-white/20 shadow-lg`}>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentRole.gradient} flex items-center justify-center shadow-lg`}>
                    <currentRole.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-white">
                    {currentRole.title} Login {currentRole.emoji}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-white mb-2">
                  Sign in to your account
                </h3>
                <p className="text-gray-400 mb-8">
                  Enter your credentials to access your {currentRole.title.toLowerCase()} dashboard
                </p>

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Login Form */}
                <div className="space-y-6">
                  {/* School Selection for non-head-admin */}
                  {selectedRole !== 'head-admin' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Select School <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <select
                          name="schoolSlug"
                          value={formData.schoolSlug}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm"
                        >
                          <option value="" className="bg-slate-800 text-gray-400">Choose your school...</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.slug} className="bg-slate-800 text-white">
                              {school.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Username/Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      {selectedRole === 'head-admin' ? 'Email' : 'Username or Email'}
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
                        placeholder={selectedRole === 'head-admin' ? "headadmin@upss.edu" : selectedRole === 'student' ? "student123 or john@student.upss.edu" : `${currentRole.title.toLowerCase()}@upss.edu`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        name="rememberMe"
                        checked={formData.rememberMe}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-emerald-500 bg-white/10 border-white/20 rounded focus:ring-emerald-500/50"
                      />
                      <span className="text-sm text-gray-400">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="button"
                    onClick={handleLogin}
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                      isLoading 
                        ? 'bg-gray-600 cursor-not-allowed' 
                        : `bg-gradient-to-r ${currentRole.gradient} hover:shadow-lg hover:shadow-${currentRole.glowColor}/25 transform hover:scale-[1.02]`
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in as {currentRole.title}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>

                {/* Create Head Admin Account Button */}
                {selectedRole === 'head-admin' && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={() => window.location.href = '/create-head-admin'}
                      className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105"
                    >
                      Create Head Admin Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;