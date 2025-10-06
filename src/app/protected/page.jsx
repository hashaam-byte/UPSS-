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
  Loader2,
  CheckCircle,
  X,
  Phone,
  MessageCircle,
  ExternalLink
} from 'lucide-react';

// Contact Support Modal Component
const ContactSupportModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const contactOptions = [
    {
      id: 'email',
      title: 'Email Support',
      subtitle: 'Send us an email',
      icon: Mail,
      value: 'hashcody63@gmail.com',
      gradient: 'from-blue-500 to-blue-600',
      action: () => {
        window.location.href = 'mailto:hashcody63@gmail.com?subject=Support Request';
      }
    },
    {
      id: 'phone',
      title: 'Phone Call',
      subtitle: 'Call us directly',
      icon: Phone,
      value: '08077291745',
      gradient: 'from-green-500 to-green-600',
      action: () => {
        window.location.href = 'tel:08077291745';
      }
    },
    {
      id: 'whatsapp',
      title: 'WhatsApp',
      subtitle: 'Chat on WhatsApp',
      icon: MessageCircle,
      value: '08077291745',
      gradient: 'from-emerald-500 to-emerald-600',
      action: () => {
        const phone = '2348077291745'; // Add country code
        window.open(`https://wa.me/${phone}`, '_blank');
      }
    },
    {
      id: 'nexttalk',
      title: 'NextTalk',
      subtitle: 'Connect via NextTalk',
      icon: MessageCircle,
      value: 'hashaamustafa@gmail.com',
      gradient: 'from-purple-500 to-purple-600',
      action: () => {
        window.open('https://nexttalk-web.vercel.app', '_blank');
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Contact Support</h2>
            <p className="text-gray-400 text-sm mt-1">Choose your preferred method to reach us</p>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 flex items-center justify-center group"
          >
            <X className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Contact Options */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {contactOptions.map((option) => (
            <button
              key={option.id}
              onClick={option.action}
              className="p-6 bg-gradient-to-br from-white/5 to-white/0 border border-white/20 rounded-xl hover:border-white/40 hover:bg-white/10 transition-all duration-300 text-left group"
            >
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${option.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <option.icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">{option.title}</h3>
                    <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <p className="text-gray-400 text-sm mb-2">{option.subtitle}</p>
                  <p className="text-emerald-400 text-sm font-mono">{option.value}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-t border-white/10">
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Shield className="h-4 w-4" />
            <span className="font-medium">We typically respond within 24 hours</span>
          </div>
          <p className="text-gray-400 text-xs mt-2">
            Our support team is available Monday - Friday, 9:00 AM - 5:00 PM WAT
          </p>
        </div>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    schoolSlug: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

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
      route: '/protected/students'
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
      route: '/protected/Teachers'
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
      route: '/protected/Admin'
    },
    {
      id: 'headadmin',
      title: 'Head Admin',
      subtitle: 'Full system access & premium management',
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-orange-100',
      glowColor: 'orange-500',
      emoji: '👑',
      route: '/protected/Headadmin'
    }
  ];

  const currentRole = roles.find(role => role.id === selectedRole) || roles[0];

  // Security: Check if user is already authenticated
  useEffect(() => {
    checkAuthStatus();
    
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get('role');
    if (role && roles.find(r => r.id === role)) {
      setSelectedRole(role);
    }
    
    if (selectedRole !== 'headadmin') {
      fetchSchools();
    }
  }, [selectedRole]);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        // User is already authenticated, redirect to their dashboard
        window.location.href = data.redirectTo;
      }
    } catch (error) {
      // User not authenticated, continue with login
    }
  };

  const fetchSchools = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/school/list');
      const data = await response.json();
      
      if (response.ok) {
        setSchools(data.schools || []);
      } else {
        setError('Failed to load schools. Please refresh the page.');
      }
    } catch (error) {
      console.error('Failed to fetch schools:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
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

  const validateForm = () => {
    if (!formData.identifier.trim()) {
      return 'Please enter your username or email';
    }
    
    if (!formData.password) {
      return 'Please enter your password';
    }
    
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters long';
    }
    
    if (selectedRole !== 'headadmin' && !formData.schoolSlug) {
      return 'Please select your school';
    }
    
    // Email validation for head admin
    if (selectedRole === 'headadmin') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.identifier)) {
        return 'Please enter a valid email address';
      }
    }
    
    return null;
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setIsLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      let apiUrl = '';
      let payload = {};

      if (selectedRole === 'headadmin') {
        apiUrl = '/api/auth/headadmin/login';
        payload = {
          email: formData.identifier.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe
        };
      } else {
        apiUrl = '/api/auth/school/login';
        payload = {
          identifier: formData.identifier.trim(),
          password: formData.password,
          role: selectedRole,
          schoolSlug: formData.schoolSlug,
          rememberMe: formData.rememberMe
        };
      }

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError('Too many login attempts. Please wait and try again.');
        } else if (res.status === 404) {
          setError('User not found. Please check your credentials.');
        } else if (res.status === 401) {
          setError('Invalid credentials. Please try again.');
        } else {
          setError(data.error || data.message || 'Login failed. Please try again.');
        }
        return;
      }

      // Success
      setSuccessMessage('Login successful! Redirecting...');
      
      // Small delay to show success message
      setTimeout(() => {
        window.location.href = data.redirectTo || (currentRole ? currentRole.route : '/') || '/';
      }, 1500);

    } catch (error) {
      console.error('Login error:', error);
      setError('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !isLoading) {
      handleLogin(e);
    }
  };

  const handleForgotPassword = () => {
    const resetType = selectedRole === 'headadmin' ? 'headadmin' : 'school';
    const schoolParam = selectedRole !== 'headadmin' && formData.schoolSlug 
      ? `&school=${formData.schoolSlug}` 
      : '';
    window.location.href = `/auth/reset-password?type=${resetType}${schoolParam}`;
  };

  const handleBackToHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Contact Support Modal */}
      <ContactSupportModal 
        isOpen={showSupportModal} 
        onClose={() => setShowSupportModal(false)} 
      />

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
                      U PLUS
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

                {/* Security Notice */}
                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-400 text-sm">
                    <Shield className="h-4 w-4" />
                    <span className="font-medium">Secure Access</span>
                  </div>
                  <p className="text-emerald-300/80 text-xs mt-1">
                    Your session is encrypted and protected
                  </p>
                </div>

                {/* Support Contact */}
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-gray-400 text-sm mb-4">Need help?</p>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="text-emerald-400 hover:text-emerald-300 text-sm transition-colors flex items-center gap-2 group"
                  >
                    <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    Contact Support
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="lg:w-3/5 p-8 lg:p-12 bg-gradient-to-br from-white/5 to-transparent">
              <form onSubmit={handleLogin} onKeyPress={handleKeyPress}>
                {/* Role Header */}
                {currentRole && (
                  <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full mb-8 bg-gradient-to-r ${currentRole.gradient}/20 border border-white/20 shadow-lg`}>
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentRole.gradient} flex items-center justify-center shadow-lg`}>
                      <currentRole.icon className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-semibold text-white">
                      {currentRole.title} Login {currentRole.emoji}
                    </span>
                  </div>
                )}

                <h3 className="text-3xl font-bold text-white mb-2">
                  Sign in to your account
                </h3>
                <p className="text-gray-400 mb-8">
                  Enter your credentials to access your {currentRole ? currentRole.title.toLowerCase() : ''} dashboard
                </p>

                {/* Success Message */}
                {successMessage && (
                  <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center text-emerald-400">
                    <CheckCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{successMessage}</span>
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center text-red-400">
                    <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {/* Login Form Fields */}
                <div className="space-y-6">
                  {/* School Selection for non-head-admin */}
                  {selectedRole !== 'headadmin' && (
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
                          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 backdrop-blur-sm appearance-none cursor-pointer"
                          disabled={isLoading}
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
                      {selectedRole === 'headadmin' ? 'Email' : 'Username or Email'} <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all duration-200 placeholder-gray-400 backdrop-blur-sm"
                        placeholder={selectedRole === 'headadmin' ? "admin@upss.edu" : selectedRole === 'student' ? "student123 or john@student.upss.edu" : `${currentRole ? currentRole.title.toLowerCase() : ''}@upss.edu`}
                        required
                        disabled={isLoading}
                        autoComplete="username"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Password <span className="text-red-400">*</span>
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
                        disabled={isLoading}
                        autoComplete="current-password"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                        disabled={isLoading}
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
                        disabled={isLoading}
                      />
                      <span className="text-sm text-gray-400">Remember me for 30 days</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-emerald-400 hover:text-emerald-300 font-medium transition-colors disabled:opacity-50"
                      disabled={isLoading}
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                      isLoading 
                        ? 'bg-gray-600 cursor-not-allowed opacity-70' 
                        : `bg-gradient-to-r ${currentRole ? currentRole.gradient : ''} hover:shadow-lg hover:shadow-${currentRole ? currentRole.glowColor : ''}/25 transform hover:scale-[1.02] active:scale-[0.98]`
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in as {currentRole ? currentRole.title : ''}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* Create Head Admin Account Button */}
                  {selectedRole === 'headadmin' && (
                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={() => window.location.href = '/auth/create-headadmin'}
                        className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/25 transform hover:scale-105 disabled:opacity-70"
                        disabled={isLoading}
                      >
                        Create Head Admin Account
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;