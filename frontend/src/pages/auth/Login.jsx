import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sprout, LogIn, Key, Mail, AlertCircle, Sparkles } from 'lucide-react';

const Login = () => {
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Invalid email or password');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemo = async (demoEmail) => {
    setError('');
    setSubmitting(true);
    try {
      await switchDemoRole(demoEmail);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Real Farming Land Backdrop */}
      <img
        src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1920&q=80"
        alt="Real Farming Land Backdrop"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90"></div>

      <div className="max-w-md w-full space-y-6 bg-white/95 backdrop-blur-xl p-8 rounded-3xl border border-slate-700/80 shadow-2xl relative z-10">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-agri-700 to-emerald-500 text-white mx-auto flex items-center justify-center shadow-lg shadow-agri-600/30">
            <Sprout className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">Sign in to AgriConnect</h2>
          <p className="text-xs text-slate-500">Access your agricultural supply chain portal</p>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="farmer@agriconnect.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-gradient-to-r from-agri-700 to-emerald-700 hover:from-agri-800 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Sign-in Shortcuts */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>One-Click Demo Account Sign In</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleQuickDemo('farmer@agriconnect.com')}
              className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-xl border border-emerald-200 text-[11px] text-left transition-all active:scale-95"
            >
              🌾 Farmer Demo
            </button>
            <button
              onClick={() => handleQuickDemo('fpo@agriconnect.com')}
              className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-xl border border-amber-200 text-[11px] text-left transition-all active:scale-95"
            >
              🏢 FPO Demo
            </button>
            <button
              onClick={() => handleQuickDemo('buyer@agriconnect.com')}
              className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold rounded-xl border border-blue-200 text-[11px] text-left transition-all active:scale-95"
            >
              🛒 Buyer Demo
            </button>
            <button
              onClick={() => handleQuickDemo('logistics@agriconnect.com')}
              className="p-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold rounded-xl border border-purple-200 text-[11px] text-left transition-all active:scale-95"
            >
              🚚 Logistics Demo
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-agri-700 hover:underline">
            Register new account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
