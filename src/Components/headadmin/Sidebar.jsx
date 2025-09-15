// components/headadmin/Sidebar.jsx
'use client'
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
  X
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';

const Sidebar = ({ isOpen, onClose, user, onLogout }) => {
  const router = useRouter();
  const pathname = usePathname();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/protected/headadmin',
      icon: LayoutDashboard,
      current: pathname === '/protected/headadmin'
    },
    {
      name: 'Schools Management',
      href: '/protected/headadmin/schools',
      icon: School,
      current: pathname.startsWith('/protected/headadmin/schools')
    },
    {
      name: 'Invoices & Billing',
      href: '/protected/headadmin/invoices',
      icon: CreditCard,
      current: pathname.startsWith('/protected/headadmin/invoices')
    },
    {
      name: 'Messages',
      href: '/protected/headadmin/messages',
      icon: MessageSquare,
      current: pathname.startsWith('/protected/headadmin/messages')
    },
    {
      name: 'Settings',
      href: '/protected/headadmin/settings',
      icon: Settings,
      current: pathname.startsWith('/protected/headadmin/settings')
    }
  ];

  const handleNavigation = (href) => {
    router.push(href);
    onClose(); // Close sidebar on mobile after navigation
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 bg-gradient-to-r from-yellow-500 to-orange-500">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">HEAD ADMIN</span>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-white hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          {user && (
            <div className="px-6 py-4 bg-gray-50 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  item.current
                    ? 'bg-yellow-50 text-yellow-700 border-r-4 border-yellow-500 shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${
                  item.current ? 'text-yellow-500' : 'text-gray-400'
                }`} />
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div className="px-4 py-4 border-t bg-gray-50">
            <button
              onClick={onLogout}
              className="w-full flex items-center px-3 py-3 text-sm font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-red-500" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;