"use client";

import axios from 'axios';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, ArrowRight,
  ChevronLeft, Eye, EyeOff, Key, Loader2,
  Lock, Mail,
  RefreshCw,
  ShieldCheck, Smartphone, User
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast, Toaster } from 'react-hot-toast';
import { apiUrl } from '@/lib/api';

// UI Components
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';

const StyledInput = ({ label, icon: Icon, isPassword, ...props }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">
        {label}
      </label>
      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">
          <Icon size={18} />
        </div>
        <input
          {...props}
          type={isPassword ? (show ? 'text' : 'password') : props.type}
          className="w-full pl-11 h-12 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 transition-all shadow-sm text-sm outline-none disabled:opacity-70 disabled:cursor-not-allowed"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
    </div>
  );
};

export function LoginPage({ onLogin }) {
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [role, setRole] = useState('employee');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const isAdmin = role === 'admin';
  const isEmail = identifier.includes('@');
  const dynamicIcon = isEmail ? Mail : Smartphone;

  const resetForm = (targetView) => {
    setError('');
    setPassword('');
    setOtp('');
    setNewPassword('');
    setView(targetView);
  };

  const formatIdentifier = (val) => {
    const trimmed = val.trim();
    if (trimmed.includes('@') || trimmed.startsWith('+')) return trimmed;
    if (/^[9][0-9]{9}$/.test(trimmed)) return `+977${trimmed}`;
    return trimmed;
  };

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  // FIXED: handleAction now properly prevents page refresh
  const handleAction = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Safety check: Don't run if already loading
    if (isLoading) return;

    setError('');
    const toastId = toast.loading('Processing...');
    setIsLoading(true);

    const finalId = formatIdentifier(identifier);

    try {
      if (view === 'login') {
        // Attempt login via the prop function
        const data = await onLogin(finalId, password, role);
        // Only show success if we actually got data back
        if (data) {
          toast.success(`Welcome back, ${data.user.fullName}!`, { id: toastId, icon: '👋' });
        }
      } else if (view === 'forgot') {
  await axios.post(apiUrl('/api/auth/forgot-password'), { identifier: finalId });
        toast.success('Verification code sent!', { id: toastId });
        resetForm('reset');
        setResendTimer(60);
      } else if (view === 'reset') {
        await axios.post(apiUrl('/api/auth/reset-password'), {
          identifier: finalId,
          otp,
          newPassword
        });
        toast.success('Password updated! Please login.', { id: toastId });
        resetForm('login');
      }
    } catch (err) {
      // FIXED: Catching error here prevents the "bubble-up" crash that causes refresh
      const msg = err.response?.data?.msg || err.message || 'Something went wrong';
      setError(msg);
      toast.error(msg, { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async (e) => {
    if (e) e.preventDefault();
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    const finalId = formatIdentifier(identifier);
    const tid = toast.loading('Resending OTP...');

    try {
      const response = await axios.post(apiUrl('/api/auth/resend-otp'), {
        identifier: finalId
      });
      if (response.data.success) {
        toast.success('New OTP sent!', { id: tid });
        setResendTimer(60);
        setError('');
      }
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to resend';
      toast.error(msg, { id: tid });
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-all duration-700 ${isAdmin ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <Toaster position="top-center" reverseOrder={false} />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-24 -left-24 w-96 h-96 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 ${isAdmin ? 'bg-indigo-600' : 'bg-blue-300'}`} />
        <div className={`absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-[100px] opacity-20 transition-colors duration-1000 ${isAdmin ? 'bg-purple-600' : 'bg-indigo-200'}`} />
      </div>

      <motion.div 
        layout 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="w-full max-w-[420px] relative z-10"
      >
        <Card className="border-0 shadow-2xl rounded-[2.5rem] overflow-hidden bg-white/95 backdrop-blur-md">
          <CardHeader className="pt-10 pb-4 text-center relative">
            <AnimatePresence>
              {view !== 'login' && (
                <motion.button 
                  type="button"
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }} 
                  onClick={() => resetForm('login')} 
                  className="absolute left-8 top-10 p-2 text-slate-400 hover:text-slate-800 transition-colors"
                >
                  <ChevronLeft size={20} />
                </motion.button>
              )}
            </AnimatePresence>
            <motion.div 
              layout
              className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-inner transition-colors duration-500 ${isAdmin ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'}`}
            >
              {view === 'login' ? (isAdmin ? <ShieldCheck size={30} /> : <User size={30} />) : <Key size={30} />}
            </motion.div>
            <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
              {view === 'login' ? (isAdmin ? 'Admin Portal' : 'Employee Login') : view === 'forgot' ? 'Find Account' : 'New Password'}
            </CardTitle>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  exit={{ opacity: 0, scale: 0.95 }} 
                  className="mb-6 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2 border border-red-100"
                >
                  <AlertCircle size={14} /> {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleAction} className="space-y-4">
              <AnimatePresence mode="wait">
                <motion.div
                  key={view}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-4"
                >
                  {view === 'login' && (
                    <>
                      <StyledInput label="Email or Phone" placeholder="98XXXXXXXX / name@agency.com" icon={dynamicIcon} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required disabled={isLoading} />
                      <div className="space-y-1">
                        <StyledInput label="Password" isPassword placeholder="••••••••" icon={Lock} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={isLoading} />
                        <button type="button" onClick={() => resetForm('forgot')} className="text-[11px] font-bold text-blue-600 uppercase tracking-tighter hover:text-blue-800 ml-auto block">Forgot Password?</button>
                      </div>
                    </>
                  )}

                  {view === 'forgot' && (
                    <>
                      <StyledInput label="Email or Phone" placeholder="Enter registered email or phone" icon={dynamicIcon} value={identifier} onChange={(e) => setIdentifier(e.target.value)} required disabled={isLoading} />
                      <p className="text-[11px] text-slate-400 px-1 italic">A verification code will be sent to your registered contact.</p>
                    </>
                  )}

                  {view === 'reset' && (
                    <>
                      <div className="space-y-1">
                        <StyledInput label="Enter OTP" placeholder="6-digit code" icon={Smartphone} value={otp} onChange={(e) => setOtp(e.target.value)} required disabled={isLoading} />
                        <button
                          type="button"
                          disabled={resendTimer > 0 || isResending}
                          onClick={handleResendOTP}
                          className={`text-[11px] font-bold uppercase tracking-tighter ml-auto flex items-center gap-1 transition-colors ${resendTimer > 0 || isResending ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-800'}`}
                        >
                          <RefreshCw size={10} className={resendTimer > 0 || isResending ? '' : 'animate-spin-slow'} />
                          {resendTimer > 0 ? `Resend in ${resendTimer}s` : isResending ? 'Sending...' : 'Resend OTP'}
                        </button>
                      </div>
                      <StyledInput label="New Password" isPassword placeholder="••••••••" icon={Key} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required disabled={isLoading} />
                    </>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* Using type="submit" but handled by e.preventDefault() in handleAction */}
              <Button 
                type="submit" 
                disabled={isLoading} 
                className={`w-full h-12 rounded-xl text-white font-bold transition-all shadow-lg ${isAdmin ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
              >
                {isLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (
                  <span className="flex items-center justify-center gap-2">
                    {view === 'login' ? 'Sign In' : view === 'forgot' ? 'Send Code' : 'Update Password'}
                    {view === 'login' && <ArrowRight size={18} />}
                  </span>
                )}
              </Button>
            </form>

            {view === 'login' && (
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-3">
                <p className="text-center text-[10px] text-slate-400 uppercase font-bold tracking-[0.2em]">Select Portal</p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRole('employee')} disabled={isLoading} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${!isAdmin ? 'bg-blue-50 text-blue-700 ring-2 ring-blue-100' : 'bg-slate-50 text-slate-500 grayscale disabled:opacity-50'}`}>
                    <User size={14} /> Employee
                  </button>
                  <button type="button" onClick={() => setRole('admin')} disabled={isLoading} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isAdmin ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100' : 'bg-slate-50 text-slate-500 grayscale disabled:opacity-50'}`}>
                    <ShieldCheck size={14} /> Admin
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <p className="text-center mt-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">&copy; 2026 Manpower MS. All rights reserved.</p>
      </motion.div>
    </div>
  );
}