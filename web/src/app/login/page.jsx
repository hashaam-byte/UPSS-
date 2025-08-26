'use client'
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
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
  Sparkles
} from 'lucide-react';

const LoginPage = () => {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState('student');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: '', // username or email
    password: '',
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
      emoji: '👑',
      route: '/dashboard/headAdmin'
    }
  ];

  const currentRole = roles.find(role => role.id === selectedRole);

  // Demo credentials for testing
  const demoCredentials = {
    student: { username: 'student123', password: 'demo123' },
    teacher: { username: 'teacher@upss.edu', password: 'demo123' },
    admin: { username: 'admin@upss.edu', password: 'demo123' },
    'head-admin': { username: 'headAdmin@upss.edu', password: 'demo123' }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  const validateCredentials = (identifier, password, role) => {
    const demo = demoCredentials[role];
    return (identifier === demo.username || identifier === demo.username.toLowerCase()) && 
           password === demo.password;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Basic validation
      if (!formData.identifier || !formData.password) {
        setError('Please fill in all required fields');
        setIsLoading(false);
        return;
      }

      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Check credentials (in production, this would be an API call)
      if (validateCredentials(formData.identifier, formData.password, selectedRole)) {
        // Store user info in localStorage for the demo (in production, use proper auth)
        const userInfo = {
          role: selectedRole,
          identifier: formData.identifier,
          loginTime: new Date().toISOString(),
          rememberMe: formData.rememberMe
        };
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('upss_user', JSON.stringify(userInfo));
          localStorage.setItem('upss_auth_token', `demo_token_${selectedRole}_${Date.now()}`);
        }

        // Navigate to the appropriate dashboard
        router.push(currentRole.route);
      } else {
        setError('Invalid credentials. Please check your username and password.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // In production, this would navigate to a password reset page
    alert(`Password reset for ${currentRole.title} will be sent to your registered email.`);
  };

  const handleContactSupport = () => {
    // In production, this would open a support chat or navigate to support page
    window.open('mailto:support@upss.edu?subject=Login Support Request', '_blank');
  };

  const handleBackToHome = () => {
    // Navigate to home page or go back in history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/'); // fallback to home page
    }
  };

  const fillDemoCredentials = () => {
    const demo = demoCredentials[selectedRole];
    setFormData(prev => ({
      ...prev,
      identifier: demo.username,
      password: demo.password
    }));
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
    transition: { duration: 0.5, ease: "easeOut" }
  };

  const slideIn = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-emerald-400/20 to-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-500/20 rounded-full blur-3xl"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-5xl mx-auto bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Left Side - Role Selection */}
          <div className="lg:w-2/5 p-8 lg:p-12 bg-gradient-to-br from-white to-gray-50 border-r border-gray-200">
            <motion.div {...fadeInUp}>
              {/* Logo */}
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-purple-600 rounded-2xl flex items-center justify-center">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-purple-600 bg-clip-text text-transparent">
                    UPSS Plus
                  </h1>
                  <p className="text-sm text-gray-500">Your School. Connected.</p>
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
              <p className="text-gray-600 mb-8">Choose your role to continue</p>

              {/* Role Selection */}
              <div className="space-y-3">
                {roles.map((role) => (
                  <motion.button
                    key={role.id}
                    onClick={() => setSelectedRole(role.id)}
                    className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border-2 ${
                      selectedRole === role.id
                        ? `bg-gradient-to-r ${role.bgGradient} border-blue-300 shadow-lg scale-105`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                    }`}
                    whileHover={{ scale: selectedRole === role.id ? 1.05 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${role.gradient}`}>
                        <role.icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-800">{role.title}</h3>
                          <span className="text-lg">{role.emoji}</span>
                        </div>
                        <p className="text-sm text-gray-600">{role.subtitle}</p>
                      </div>
                      {selectedRole === role.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center"
                        >
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Demo Credentials Info */}
              <div className="mt-8 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Demo Credentials</h4>
                <div className="text-xs text-blue-600 space-y-1">
                  <p><strong>Username:</strong> {demoCredentials[selectedRole].username}</p>
                  <p><strong>Password:</strong> {demoCredentials[selectedRole].password}</p>
                </div>
                <button
                  onClick={fillDemoCredentials}
                  className="mt-2 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Fill Demo Credentials
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Side - Login Form */}
          <div className="lg:w-3/5 p-8 lg:p-12">
            <AnimatePresence mode="wait">
              <motion.div key={selectedRole} {...slideIn}>
                {/* Role Header */}
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${currentRole.bgGradient} mb-8`}>
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${currentRole.gradient} flex items-center justify-center`}>
                    <currentRole.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-700">
                    {currentRole.title} Login {currentRole.emoji}
                  </span>
                </div>

                <h3 className="text-3xl font-bold text-gray-800 mb-2">
                  Sign in to your account
                </h3>
                <p className="text-gray-600 mb-8">
                  Enter your credentials to access your {currentRole.title.toLowerCase()} dashboard
                </p>

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Username/Email Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Username or Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        name="identifier"
                        value={formData.identifier}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        placeholder={selectedRole === 'student' ? "student123 or john@student.upss.edu" : `${currentRole.title.toLowerCase()}@upss.edu`}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200 placeholder-gray-400"
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
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
                        className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  {/* Login Button */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-3 ${
                      isLoading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : `bg-gradient-to-r ${currentRole.gradient} hover:shadow-lg hover:shadow-emerald-500/25 transform hover:scale-[1.02]`
                    }`}
                    whileHover={!isLoading ? { scale: 1.02 } : {}}
                    whileTap={!isLoading ? { scale: 0.98 } : {}}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign in as {currentRole.title}
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Additional Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span>Need help?</span>
                    <button 
                      onClick={handleContactSupport}
                      className="text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      Contact Support
                    </button>
                    <span>•</span>
                    <button 
                      onClick={handleBackToHome}
                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back to Home
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;