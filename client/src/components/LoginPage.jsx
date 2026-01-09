"use client";

import {
  AlertCircle, ArrowRight, CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  User,
  UserCog
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

// --- Reusable Input Component ---
const LoginInput = React.memo(({
  type,
  placeholder,
  value,
  onChange,
  label,
  Icon,
  disabled,
  className = '',
  autoFocus = false,
  clearError,
  isPassword = false // Added flag
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const IconComponent = Icon;

  const togglePassword = () => setShowPassword(!showPassword);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">{label}</label>
      <div className="relative group">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none transition-colors group-focus-within:text-blue-500">
          {Icon && <IconComponent className="h-4 w-4 text-gray-400 group-focus-within:text-current" />}
        </div>
        <Input
          type={isPassword ? (showPassword ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={e => {
            onChange(e);
            clearError();
          }}
          autoComplete={type === 'email' ? 'email' : 'current-password'}
          disabled={disabled}
          autoFocus={autoFocus}
          className={`pl-10 ${isPassword ? 'pr-10' : 'pr-4'} h-12 text-base bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-offset-0 focus:ring-offset-transparent focus:border-transparent transition-all duration-200 ${className}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={togglePassword}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
            tabIndex="-1"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
});
LoginInput.displayName = 'LoginInput';

// --- Shared Message Component ---
const AuthMessage = ({ type, message }) => {
  const isError = type === 'error';
  return (
    <div className={`p-4 rounded-lg shadow-sm animate-in slide-in-from-top-2 duration-300 border-l-4 ${isError ? 'bg-red-50 border-red-400 text-red-700' : 'bg-green-50 border-green-400 text-green-700'
      }`}>
      <div className="flex items-center gap-3">
        {isError ? <AlertCircle className="h-5 w-5 flex-shrink-0" /> : <CheckCircle2 className="h-5 w-5 flex-shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};

// --- Main LoginPage Component ---
export function LoginPage({ onLogin }) {
  const searchParams = useSearchParams();
  const [role, setRole] = useState('employee');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Input States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMsg('Registration successful! Please sign in.');
      setRole('admin');
    }
  }, [searchParams]);

  const clearMessages = useCallback(() => {
    if (error) setError('');
    if (successMsg) setSuccessMsg('');
  }, [error, successMsg]);

  // --- Validation Logic ---
  const validateForm = () => {
    if (!email) return 'Email address is required.';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    // Run validation
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      await onLogin(email, password, role);
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, role, onLogin]);

  const handleRoleSwitch = (newRole) => {
    setRole(newRole);
    clearMessages();
  };

  const isAdmin = role === 'admin';

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-500 ${isAdmin ? 'bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900' : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100'
      }`}>
      <Card className={`w-full max-w-md relative z-10 border-0 shadow-2xl transition-all duration-300 ${isAdmin ? 'bg-white/95 backdrop-blur-2xl' : 'bg-white/90 backdrop-blur-sm'
        }`}>
        <CardHeader className="text-center pb-2">
          <div className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl transition-transform duration-500 hover:rotate-3 ${isAdmin ? 'bg-gradient-to-br from-purple-500 to-indigo-600' : 'bg-gradient-to-br from-blue-500 to-cyan-500'
            }`}>
            {isAdmin ? <ShieldCheck className="h-10 w-10 text-white" /> : <User className="h-10 w-10 text-white" />}
          </div>
          <CardTitle className={`text-3xl font-bold ${isAdmin ? 'bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent' : 'text-gray-900'
            }`}>
            {isAdmin ? 'Admin Portal' : 'Employee Portal'}
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2 flex items-center justify-center gap-2">
            <Lock className="h-4 w-4" />
            {isAdmin ? 'Secure Administrator Access' : 'Sign in to your workspace'}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && <AuthMessage type="error" message={error} />}
          {successMsg && <AuthMessage type="success" message={successMsg} />}

          <form onSubmit={handleSubmit} className="space-y-5">
            <LoginInput
              type="email"
              label={isAdmin ? "Admin Email" : "Work Email"}
              placeholder={isAdmin ? "admin@company.com" : "name@company.com"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              Icon={isAdmin ? UserCog : Mail}
              disabled={isLoading}
              clearError={clearMessages}
              className={isAdmin ? "focus:ring-purple-500" : "focus:ring-blue-500"}
              autoFocus
            />
            <LoginInput
              isPassword
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              Icon={Key}
              disabled={isLoading}
              clearError={clearMessages}
              className={isAdmin ? "focus:ring-purple-500" : "focus:ring-blue-500"}
            />

            <Button
              type="submit"
              disabled={isLoading}
              className={`w-full h-12 flex items-center justify-center gap-2 text-base font-semibold text-white shadow-lg transition-all rounded-lg ${isAdmin
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700'
                }`}
            >
              {isLoading ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> Authenticating...</>
              ) : (
                <>{isAdmin ? <ShieldCheck className="h-5 w-5" /> : <User className="h-5 w-5" />} Sign In</>
              )}
            </Button>
          </form>

          <div className="text-center pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => handleRoleSwitch(isAdmin ? 'employee' : 'admin')}
              disabled={isLoading}
              className={`inline-flex items-center gap-1 px-4 py-2 font-medium text-sm rounded-lg transition-all ${isAdmin
                ? 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
            >
              Switch to {isAdmin ? 'Employee' : 'Admin'} Portal
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}