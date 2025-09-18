'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  BookOpen, 
  BarChart3, 
  MessageSquare, 
  Settings, 
  CreditCard, 
  Upload, 
  Shield, 
  Menu, 
  X,
  Home,
  Bell,
  Search,
  LogOut,
  User,
  School,
  ChevronDown,
  Loader2,
  Activity,
  Zap,
  Globe,
  BrainCircuit
} from 'lucide-react';

const AdminLayout = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [error, setError] = useState('');

  const sidebarItems = [
    {
      title: 'Dashboard',
      href: '/protected/admin',
      icon: Home,
      description: 'Neural command center',
      gradient: 'from-cyan-400 to-blue-500'
    },
    {
      title: 'Users Management',
      href: '/protected/admin/users',
      icon: Users,
      description: 'Digital workforce control',
      gradient: 'from-purple-400 to-pink-500'
    },
    {
      title: 'Analytics',
      href: '/protected/admin/analytics',
      icon: BarChart3,
      description: 'Quantum insights engine',
      gradient: 'from-emerald-400 to-teal-500'
    },
    {
      title: 'Subscription',
      href: '/protected/admin/subscription',
      icon: CreditCard,
      description: 'Financial matrix',
      gradient: 'from-yellow-400 to-orange-500'
    },
    {
      title: 'Messages',
      href: '/protected/admin/messages',
      icon: MessageSquare,
      description: 'Hyperlink communications',
      gradient: 'from-indigo-400 to-purple-500'
    },
    {
      title: 'Resources',
      href: '/protected/admin/resources',
      icon: Upload,
      description: 'Data nexus vault',
      gradient: 'from-pink-400 to-rose-500'
    },
    {
      title: 'Settings',
      href: '/protected/admin/settings',
      icon: Settings,
      description: 'System configuration',
      gradient: 'from-gray-400 to-slate-500'
    }
  ];

  useEffect(() => {
    verifyAuth();
    fetchNotifications();
    
    // Auto-refresh notifications every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(notificationInterval);
  }, []);

  const verifyAuth = async () => {
    try {
      const response = await fetch('/api/auth/verify', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (!response.ok) {
        router.push('/protected');
        return;
      }

      const data = await response.json();
      
      if (data.user.role !== 'admin') {
        router.push('/auth/unauthorized');
        return;
      }

      setUser(data.user);
      setSchool(data.school);
    } catch (error) {
      console.error('Auth verification failed:', error);
      setError('Authentication matrix failure');
      router.push('/protected');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/protected/admin/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      if (response.ok) {
        router.push('/');
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read and navigate if needed
    if (notification.action) {
      router.push(notification.action);
    }
    setShowNotifications(false);
  };

  const isActivePath = (href) => {
    if (href === '/protected/admin') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 flex items-center justify-center">
        <div className="relative">
          {/* Animated background circles */}
          <div className="absolute inset-0 -m-20">
            <div className="absolute top-0 left-0 w-40 h-40 bg-cyan-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute top-10 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse delay-300"></div>
            <div className="absolute bottom-0 left-10 w-36 h-36 bg-emerald-500/20 rounded-full blur-xl animate-pulse delay-700"></div>
          </div>
          
          {/* Loading content */}
          <div className="relative z-10 text-center">
            <div className="relative mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 rounded-2xl animate-spin mx-auto"></div>
              <div className="absolute inset-0 w-20 h-20 bg-gradient-to-r from-purple-400 via-emerald-500 to-cyan-400 rounded-2xl animate-ping mx-auto"></div>
            </div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4">
              Initializing Neural Interface
            </h2>
            <div className="flex items-center justify-center gap-2 text-gray-400">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
              <span className="text-lg">Accessing quantum matrix...</span>
            </div>
            <div className="mt-6 w-64 bg-slate-800 rounded-full h-2 overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-pink-950 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 relative">
          {/* Error animation */}
          <div className="absolute inset-0 -m-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-red-500/20 rounded-full blur-xl animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 bg-pink-500/20 rounded-full blur-xl animate-pulse delay-500"></div>
          </div>
          
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl animate-bounce">
              <Zap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-pink-400 bg-clip-text text-transparent mb-4">
              System Malfunction
            </h2>
            <p className="text-gray-300 mb-8 text-lg">{error}</p>
            <button
              onClick={() => router.push('/protected')}
              className="bg-gradient-to-r from-red-500 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-pink-600 hover:to-red-600 transition-all duration-300 hover:scale-105 hover:shadow-2xl font-semibold text-lg"
            >
              Return to Base
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Enhanced Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-slate-900/90 to-slate-800/90 backdrop-blur-2xl border-r border-cyan-500/20 shadow-2xl transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0 transition-all duration-500 ease-out`}>
        
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-6 border-b border-cyan-500/20 bg-gradient-to-r from-slate-900/50 to-slate-800/50">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-2xl">
              <Shield className="w-7 h-7 text-white" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-2xl blur animate-pulse"></div>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                School Admin
              </h1>
              <p className="text-sm text-gray-400 font-medium">{school?.name}</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors hover:bg-white/10 rounded-lg"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Enhanced Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActivePath(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`relative flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/50 shadow-lg'
                    : 'text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-white/5 hover:to-white/10'
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Animated background for active state */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-2xl blur-sm animate-pulse"></div>
                )}
                
                <div className={`relative z-10 p-2 rounded-lg ${isActive ? `bg-gradient-to-r ${item.gradient}` : 'bg-slate-700/50 group-hover:bg-slate-600/50'} transition-all duration-300`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 relative z-10">
                  <div className="font-semibold text-lg">{item.title}</div>
                  <div className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                    {item.description}
                  </div>
                </div>
                
                {isActive && (
                  <div className="relative z-10">
                    <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full animate-pulse shadow-lg"></div>
                    <div className="absolute inset-0 w-3 h-3 bg-gradient-to-r from-cyan-400/50 to-purple-500/50 rounded-full animate-ping"></div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Enhanced School Info */}
        <div className="p-4 border-t border-cyan-500/20">
          <div className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10 p-5 rounded-2xl border border-purple-500/30 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                <School className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-lg font-bold text-white">{school?.name}</p>
                <p className="text-sm text-purple-300 font-medium">School Network Node</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">Quantum Link Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-80">
        {/* Enhanced Top Header */}
        <header className="bg-slate-900/40 backdrop-blur-2xl border-b border-cyan-500/20 sticky top-0 z-30 shadow-xl">
          <div className="flex items-center justify-between px-8 py-5">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-3 text-gray-400 hover:text-white transition-all hover:bg-white/10 rounded-xl"
              >
                <Menu className="w-6 h-6" />
              </button>
              
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  {sidebarItems.find(item => isActivePath(item.href))?.title || 'Dashboard'}
                </h1>
                <p className="text-sm text-gray-400 font-medium">
                  {sidebarItems.find(item => isActivePath(item.href))?.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {/* Enhanced Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Neural search..."
                  className="pl-12 pr-5 py-3 bg-slate-800/50 border border-cyan-500/30 rounded-xl text-white placeholder-gray-400 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all backdrop-blur-xl w-80"
                />
              </div>

              {/* Enhanced Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-3 text-gray-400 hover:text-white transition-all hover:bg-white/10 rounded-xl group"
                >
                  <Bell className="w-6 h-6" />
                  {unreadNotifications > 0 && (
                    <>
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs font-bold text-white flex items-center justify-center animate-pulse">
                        {unreadNotifications > 9 ? '9+' : unreadNotifications}
                      </span>
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-400/50 rounded-full animate-ping"></div>
                    </>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-3 w-96 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl max-h-96 overflow-y-auto">
                    <div className="p-4 border-b border-cyan-500/20">
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        Quantum Alerts
                      </h3>
                      <p className="text-sm text-gray-400">{notifications.length} total notifications</p>
                    </div>
                    
                    {notifications.length > 0 ? (
                      <div className="divide-y divide-cyan-500/10">
                        {notifications.map((notification, index) => (
                          <div
                            key={index}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 hover:bg-white/5 cursor-pointer transition-all ${
                              !notification.read ? 'bg-cyan-500/5 border-l-4 border-cyan-400' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`p-2 rounded-lg ${notification.type === 'error' ? 'bg-red-500/20 text-red-400' : 
                                notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                                'bg-cyan-500/20 text-cyan-400'}`}>
                                {notification.type === 'error' ? <Zap className="w-4 h-4" /> : 
                                 notification.type === 'warning' ? <Activity className="w-4 h-4" /> : 
                                 <Globe className="w-4 h-4" />}
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-white text-sm">{notification.title}</p>
                                <p className="text-xs text-gray-400 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-2">{notification.timestamp}</p>
                              </div>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <div className="w-16 h-16 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Bell className="w-8 h-8 text-gray-500" />
                        </div>
                        <p className="text-gray-400 font-medium">Neural network is quiet</p>
                        <p className="text-xs text-gray-500 mt-2">No quantum alerts detected</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Enhanced User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/10 transition-all group"
                >
                  <div className="relative w-10 h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg">
                    <User className="w-5 h-5 text-white" />
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 to-purple-500/20 rounded-xl blur animate-pulse"></div>
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-sm text-cyan-400 font-medium">School Administrator</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
                </button>

                {/* Enhanced Dropdown Menu */}
                {showUserDropdown && (
                  <div className="absolute right-0 mt-3 w-56 bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-cyan-500/30 shadow-2xl">
                    <div className="p-2">
                      <Link
                        href="/protected/admin/profile"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10 rounded-xl transition-all"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <User className="w-4 h-4" />
                        Neural Profile
                      </Link>
                      <Link
                        href="/protected/admin/settings"
                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gradient-to-r hover:from-cyan-500/10 hover:to-purple-500/10 rounded-xl transition-all"
                        onClick={() => setShowUserDropdown(false)}
                      >
                        <Settings className="w-4 h-4" />
                        System Config
                      </Link>
                      <hr className="my-2 border-cyan-500/20" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content with animations */}
        <main className="p-8 relative">
          <div className="page-transition">
            {children}
          </div>
        </main>

        {/* Enhanced Footer */}
        <footer className="bg-slate-900/40 backdrop-blur-xl border-t border-cyan-500/20 py-6">
          <div className="px-8">
            <div className="flex flex-col lg:flex-row justify-between items-center text-sm text-gray-400">
              <div className="flex items-center gap-6 mb-4 lg:mb-0">
                <p className="font-medium text-white">© 2025 Neural School Matrix. Quantum rights reserved.</p>
                <div className="hidden lg:flex items-center gap-4 text-xs">
                  <span className="px-3 py-1 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-cyan-400 rounded-full border border-cyan-500/30 font-medium">
                    v2.0.1 Neural
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 rounded-full border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="font-medium text-sm">Quantum Link Active</span>
                </span>
                <span className="text-xs text-gray-500 hidden lg:inline">
                  Last sync: {new Date().toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </footer>
      </div>

      {/* Global Styles */}
      <style jsx global>{`
        html {
          scroll-behavior: smooth;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(34, 211, 238, 0.5) transparent;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: transparent;
        }
        
        *::-webkit-scrollbar-thumb {
          background: rgba(34, 211, 238, 0.5);
          border-radius: 3px;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background: rgba(34, 211, 238, 0.7);
        }
        
        .page-transition {
          animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        *:focus {
          outline: 2px solid rgba(34, 211, 238, 0.5);
          outline-offset: 2px;
        }
        
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        
        /* Backdrop blur support */
        .backdrop-blur-2xl {
          backdrop-filter: blur(40px);
        }
        
        /* Custom gradient animations */
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient-shift 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;