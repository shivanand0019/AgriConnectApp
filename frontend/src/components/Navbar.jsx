import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Sprout, LogOut, User, LayoutDashboard, ShoppingBag, ChevronDown, Layers, Sparkles, Mic } from 'lucide-react';

const Navbar = ({ onOpenVoiceAssistant }) => {
  const { user, logout, switchDemoRole, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const demoAccounts = [
    { label: 'Farmer (Ramesh)', email: 'farmer@agriconnect.com', role: 'FARMER', icon: '🌾' },
    { label: 'FPO (Mysuru FPO)', email: 'fpo@agriconnect.com', role: 'FPO', icon: '🏢' },
    { label: 'Buyer (FreshToHome)', email: 'buyer@agriconnect.com', role: 'BUYER', icon: '🛒' },
    { label: 'Logistics (GreenExpress)', email: 'logistics@agriconnect.com', role: 'LOGISTICS', icon: '🚚' },
    { label: 'System Admin', email: 'admin@agriconnect.com', role: 'ADMIN', icon: '🛡️' },
  ];

  const handleRoleSwitch = async (email) => {
    try {
      await switchDemoRole(email);
      setShowRoleMenu(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Role switch failed:', err.message);
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'FARMER': return '/farmer/dashboard';
      case 'FPO': return '/fpo/dashboard';
      case 'BUYER': return '/buyer/dashboard';
      case 'LOGISTICS': return '/logistics/dashboard';
      case 'ADMIN': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-lg shadow-slate-900/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with 3D sprout container */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-agri-700 via-agri-600 to-emerald-400 flex items-center justify-center text-white shadow-lg shadow-agri-600/30 group-hover:rotate-6 group-hover:scale-110 transition-all duration-300">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 group-hover:text-agri-700 transition-colors">
                Agri<span className="text-agri-600">Connect</span>
              </span>
              <span className="block text-[9px] font-extrabold text-slate-400 uppercase tracking-widest -mt-1">
                Direct Farm to Market Network
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-6 text-xs font-extrabold text-slate-600">
            <Link to="/" className="px-3 py-1.5 hover:text-agri-700 hover:bg-slate-100/70 rounded-xl transition-all">
              Home
            </Link>
            <Link to="/marketplace" className="px-3 py-1.5 hover:text-agri-700 hover:bg-slate-100/70 rounded-xl transition-all flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-agri-600" />
              Marketplace
            </Link>
            <button
              onClick={onOpenVoiceAssistant}
              className="px-3 py-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 rounded-xl transition-all flex items-center gap-1.5 font-bold shadow-xs active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Voice AI</span>
              <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full uppercase">Gnani</span>
            </button>
            {isAuthenticated && (
              <Link to={getDashboardPath()} className="px-3.5 py-1.5 bg-agri-50 text-agri-900 border border-agri-200 rounded-xl hover:bg-agri-100 flex items-center gap-1.5 shadow-sm transition-all">
                <LayoutDashboard className="w-4 h-4 text-agri-600" />
                Dashboard
              </Link>
            )}
          </div>

          {/* Right Action Items & Demo Role Switcher */}
          <div className="flex items-center gap-3">
            {/* Demo Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-md shadow-amber-500/20 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse" />
                <span>Switch Role Demo</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showRoleMenu ? 'rotate-180' : ''}`} />
              </button>

              {showRoleMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200/90 py-2 z-50 animate-fade-in divide-y divide-slate-100">
                  <div className="px-4 py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                    Instant Demo Login Switcher
                  </div>
                  <div className="py-1">
                    {demoAccounts.map((acc) => (
                      <button
                        key={acc.email}
                        onClick={() => handleRoleSwitch(acc.email)}
                        className={`w-full text-left px-4 py-2.5 text-xs font-bold hover:bg-agri-50 transition-colors flex items-center justify-between ${
                          user?.email === acc.email ? 'bg-agri-100/70 text-agri-900 border-l-4 border-agri-600' : 'text-slate-700'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-base">{acc.icon}</span>
                          <span>{acc.label}</span>
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 font-extrabold text-slate-600">{acc.role}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auth Buttons / User Profile */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="px-3 py-1 bg-gradient-to-r from-agri-700 to-emerald-800 text-white rounded-full text-xs font-black shadow-sm">
                  {user.role}
                </span>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-agri-800 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-agri-700 hover:bg-agri-800 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
