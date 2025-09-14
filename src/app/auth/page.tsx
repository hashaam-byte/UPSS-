
// /app/auth/unauthorized/page.js - Unauthorized access page
'use client';
import { useEffect } from 'react';
import { Shield, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  useEffect(() => {
    document.title = 'Access Denied - U PLUS';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-red-500/20 shadow-2xl p-8 text-center">
        <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <Shield className="w-10 h-10 text-white" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-300 mb-8">
          You don't have permission to access this area. Please contact your administrator if you believe this is an error.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => window.history.back()}
            className="w-full py-3 px-6 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
}

// Environment Variables (.env.local)
/*
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/uplus_db"

*/