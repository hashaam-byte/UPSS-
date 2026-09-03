'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Shield, Lock, Loader2, CheckCircle, ArrowLeft, Users } from 'lucide-react';

// Steps:
// 'phone'    - enter phone number (works for both first-time signup and forgot-password)
// 'choose'   - pick a school, if the phone matched children at more than one
// 'otp'      - enter the 6-digit code sent by SMS
// 'password' - set a new password (first-time signup or after a forgot-password reset)
// 'login'    - phone + password, for parents who already have an account
export default function ParentAuthPage() {
  const router = useRouter();
  const [step, setStep] = useState('phone');
  const [mode, setMode] = useState(null); // 'IDENTITY_VERIFICATION' | 'PASSWORD_RESET'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ticket, setTicket] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const resetMessages = () => setError('');

  const handleRequestOtp = async (chosenSchoolId = null) => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/parent/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, schoolId: chosenSchoolId })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setMode(data.mode);

      if (data.mode === 'CHOOSE_SCHOOL') {
        setMatches(data.matches);
        setStep('choose');
        return;
      }

      setMatches(data.matches || []);
      setStep('otp');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/parent/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code, purpose: mode })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Incorrect code');
        return;
      }

      setTicket(data.ticket);
      setStep('password');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async () => {
    resetMessages();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/parent/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setSuccessMessage(data.message || 'Success! You can now log in.');
      setStep('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/parent/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid phone number or password');
        return;
      }

      router.push(data.redirectTo || '/protected/parent/dashboard');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl border border-emerald-500/20 shadow-2xl p-8">
        <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          {step === 'password' ? <Lock className="w-8 h-8 text-white" /> :
           step === 'otp' ? <Shield className="w-8 h-8 text-white" /> :
           step === 'choose' ? <Users className="w-8 h-8 text-white" /> :
           <Phone className="w-8 h-8 text-white" />}
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-2">Parent Portal</h1>
        <p className="text-gray-300 text-center mb-8 text-sm">
          {step === 'phone' && 'Enter your phone number to get started'}
          {step === 'choose' && 'Select which school to continue with'}
          {step === 'otp' && `Enter the code sent to ${phone}`}
          {step === 'password' && (mode === 'IDENTITY_VERIFICATION' ? 'Set a password for your account' : 'Set a new password')}
          {step === 'login' && 'Log in to your parent account'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm">
            {error}
          </div>
        )}

        {successMessage && step === 'login' && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            {successMessage}
          </div>
        )}

        {step === 'phone' && (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="Phone number (e.g. 08012345678)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={() => handleRequestOtp()}
              disabled={loading || !phone}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
            </button>
            <button
              onClick={() => { setStep('login'); resetMessages(); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              Already have an account? Log in
            </button>
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-3">
            {matches.map((m) => (
              <button
                key={m.schoolId}
                onClick={() => handleRequestOtp(m.schoolId)}
                disabled={loading}
                className="w-full text-left p-4 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors"
              >
                <p className="text-white font-medium">{m.schoolName}</p>
                <p className="text-gray-400 text-xs mt-1">
                  {m.children.map(c => c.name).join(', ')}
                </p>
              </button>
            ))}
            <button
              onClick={() => { setStep('phone'); resetMessages(); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          </div>
        )}

        {step === 'otp' && (
          <div className="space-y-4">
            {matches.length > 0 && (
              <div className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-300 text-xs">
                Linked to: {matches.flatMap(m => m.children).map(c => c.name).join(', ')}
              </div>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleVerifyOtp}
              disabled={loading || code.length !== 6}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify Code'}
            </button>
            <button
              onClick={() => { setStep('phone'); resetMessages(); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Use a different number
            </button>
          </div>
        )}

        {step === 'password' && (
          <div className="space-y-4">
            <input
              type="password"
              placeholder="New password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-gray-400">
              Use at least 8 characters, with a mix of letters, numbers, and symbols.
            </p>
            <button
              onClick={handleSetPassword}
              disabled={loading || !password || !confirmPassword}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set Password'}
            </button>
          </div>
        )}

        {step === 'login' && (
          <div className="space-y-4">
            <input
              type="tel"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <button
              onClick={handleLogin}
              disabled={loading || !phone || !password}
              className="w-full py-3 px-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Log In'}
            </button>
            <button
              onClick={() => { setStep('phone'); setSuccessMessage(''); resetMessages(); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              First time here? Set up your account
            </button>
            <button
              onClick={() => { setStep('phone'); setSuccessMessage(''); resetMessages(); }}
              className="w-full text-center text-sm text-gray-400 hover:text-white transition-colors"
            >
              Forgot password?
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
