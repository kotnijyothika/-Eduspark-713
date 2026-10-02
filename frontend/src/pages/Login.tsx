import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types/auth';
import { RoleSelector } from '../components/RoleSelector';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('student@eduspark.ai');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState<UserRole>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const demoEmails: Record<UserRole, string> = {
    student: 'student@eduspark.ai',
    teacher: 'teacher@eduspark.ai',
    parent: 'parent@eduspark.ai',
    admin: 'admin@eduspark.ai',
  };

  const handleRoleChange = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setError('');
    // Only autofill if the email is empty or currently holds one of the default demo emails
    const isDemoEmail = !email || Object.values(demoEmails).includes(email.trim());
    if (isDemoEmail) {
      setEmail(demoEmails[selectedRole]);
      setPassword('password123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in both email and password.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('[Login Page] Submitting login form:', { email, role });
      const userRole = await login(email, password, role);
      console.log('[Login Page] Login successful, received userRole:', userRole);
      const redirectPath = getRoleDashboardPath(userRole);
      console.log('[Login Page] Navigating to dashboard:', redirectPath);
      navigate(redirectPath);
    } catch (err: any) {
      console.error('[Login Page] Login error:', err.message || err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[580px]">
        {/* Left Panel: Branding & Illustration */}
        <div className="md:col-span-5 bg-gradient-to-b from-blue-50/70 via-indigo-50/40 to-white p-8 sm:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center text-white shadow-xs">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <span className="text-xl font-black text-slate-900 tracking-tight">EduSpark AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium ml-1">Personalized Learning for Every Child</p>
          </div>

          {/* Child Learning Illustration */}
          <div className="my-8 flex flex-col items-center justify-center">
            <div className="relative w-48 h-48 flex items-center justify-center">
              {/* Decorative background glow */}
              <div className="absolute inset-0 bg-blue-100/60 rounded-full blur-2xl"></div>
              
              {/* Graphic Character / Books Stack */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-white shadow-md flex items-center justify-center text-5xl mb-2">
                  👦
                </div>
                <div className="flex gap-1 -mt-3">
                  <span className="text-2xl animate-bounce">💡</span>
                </div>
                {/* Books Stack Graphic */}
                <div className="w-32 bg-blue-600 h-5 rounded-md shadow-xs flex items-center justify-center text-white text-[10px] font-bold">
                  Mathematics
                </div>
                <div className="w-36 bg-emerald-500 h-5 rounded-md shadow-xs -mt-1 flex items-center justify-center text-white text-[10px] font-bold">
                  Science
                </div>
                <div className="w-40 bg-purple-600 h-5 rounded-md shadow-xs -mt-1 flex items-center justify-center text-white text-[10px] font-bold">
                  English Arts
                </div>
              </div>
            </div>
          </div>

          <div className="text-center md:text-left">
            <p className="text-xs text-slate-400 font-medium">Better learning • Brighter future</p>
          </div>
        </div>

        {/* Right Panel: Welcome & Role Selection & Credentials */}
        <div className="md:col-span-7 p-8 sm:p-10 flex flex-col justify-center">
          <div className="mb-5">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back!</h1>
            <p className="text-xs text-slate-500 mt-1">Choose your role to get started</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 2x2 Role Selector */}
          <RoleSelector selectedRole={role} onSelectRole={handleRoleChange} />

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@eduspark.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-4"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Create Account link */}
          <div className="mt-4 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
              Create Account
            </Link>
          </div>

          {/* Quick autofill helper */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Selected Role: <b className="capitalize text-slate-700">{role}</b></span>
            <span>Default Password: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-600 font-mono">password123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};
