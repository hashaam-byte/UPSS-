// Enhanced Sidebar Component with Linear Gradients
import React from 'react';
import { 
  Crown, 
  LayoutDashboard, 
  School, 
  CreditCard, 
  MessageSquare, 
  Settings, 
  LogOut, 
  User, 
  X,
  Building
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, user, onLogout, currentPath = '/protected/headadmin' }) => {
  const navigation = [
    {
      name: 'Dashboard',
      href: '/protected/headadmin',
      icon: LayoutDashboard,
      current: currentPath === '/protected/headadmin',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      name: 'Schools Management',
      href: '/protected/headadmin/schools',
      icon: School,
      current: currentPath.startsWith('/protected/headadmin/schools'),
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      name: 'School Management', // New navigation item
      href: '/protected/headadmin/schoolmanagement',
      icon: Building,
      current: currentPath.startsWith('/protected/headadmin/schoolmanagement'),
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      name: 'Invoices & Billing',
      href: '/protected/headadmin/invoices',
      icon: CreditCard,
      current: currentPath.startsWith('/protected/headadmin/invoices'),
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      name: 'Messages',
      href: '/protected/headadmin/messages',
      icon: MessageSquare,
      current: currentPath.startsWith('/protected/headadmin/messages'),
      gradient: 'from-orange-500 to-red-500'
    },
    {
      name: 'Settings',
      href: '/protected/headadmin/settings',
      icon: Settings,
      current: currentPath.startsWith('/protected/headadmin/settings'),
      gradient: 'from-gray-500 to-slate-500'
    }
  ];

  const handleNavigation = (href) => {
    // Use Next.js router if available, otherwise fallback to window.location
    if (typeof window !== 'undefined') {
      if (window.next && window.next.router) {
        window.next.router.push(href);
      } else {
        window.location.href = href;
      }
    }
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full bg-gradient-to-b from-white via-gray-50 to-blue-50 shadow-2xl border-r border-gray-200/50">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg tracking-wide">HEAD ADMIN</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:bg-white/20 p-1.5 rounded-lg transition-all duration-200 hover:scale-110"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-6 bg-gradient-to-r from-gray-50/80 to-blue-50/80 backdrop-blur-sm border-b border-gray-200/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform duration-200">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate text-lg">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-600 truncate">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-block px-3 py-1 bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 text-xs font-bold rounded-full border border-yellow-200">
                      ADMINISTRATOR
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center px-4 py-4 text-sm font-medium rounded-xl transition-all duration-200 group relative overflow-hidden ${
                  item.current
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 shadow-lg border border-blue-200/50'
                    : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-gray-900 hover:shadow-md'
                }`}
              >
                {/* Active indicator */}
                {item.current && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"></div>
                )}
                
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-all duration-200 group-hover:scale-110 ${
                  item.current 
                    ? `bg-gradient-to-br ${item.gradient} shadow-lg` 
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-blue-100 group-hover:to-purple-100'
                }`}>
                  <item.icon className={`h-5 w-5 ${
                    item.current ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'
                  }`} />
                </div>
                <span className="truncate font-semibold">{item.name}</span>
                
                {/* Hover effect */}
                {!item.current && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t border-gray-200/50 bg-gradient-to-r from-gray-50/80 to-red-50/80 backdrop-blur-sm">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-4 py-4 text-sm font-medium text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 group relative overflow-hidden hover:shadow-md"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform duration-200 group-hover:bg-gradient-to-br group-hover:from-red-500 group-hover:to-pink-500 group-hover:shadow-lg">
                <LogOut className="h-5 w-5 text-red-600 group-hover:text-white transition-colors duration-200" />
              </div>
              <span className="font-semibold">Sign Out</span>
              
              {/* Hover effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-pink-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;