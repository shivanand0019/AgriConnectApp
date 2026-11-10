import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Sprout, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

const Register = () => {
  const { register, sendOtp } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('FARMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [city, setCity] = useState('Mysuru');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setError('');
    setOtpMessage('');
    setOtpLoading(true);
    try {
      const res = await sendOtp(email.trim());
      setOtpSent(true);
      if (res?.devOtp) {
        setOtp(res.devOtp);
      }
      setOtpMessage(res?.message || 'Verification OTP sent to your email. Please check your inbox or spam folder.');
    } catch (err) {
      setOtpSent(false);
      setError(err.response?.data?.message || err.message || 'Failed to send OTP.');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otpSent) {
      return handleSendOtp(e);
    }
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await register({
        name: name.trim() || 'New Agri Partner',
        email: email.trim(),
        phone,
        password,
        role,
        organizationName,
        location: { city, district: city, state: 'Karnataka' },
        otp: otp.trim(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please check details or try another email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-8 px-4 sm:px-6 lg:px-8 bg-slate-900 relative overflow-hidden">
      {/* Real Farming Land Background Image */}
      <img
        src="https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1920&q=80"
        alt="Real Farming Land Backdrop"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-950/90"></div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl relative z-10 bg-white/95 backdrop-blur-xl">
        {/* Left Side: Real Farming Land Showcase */}
        <div className="relative hidden md:flex flex-col justify-between p-8 text-white bg-gradient-to-br from-agri-900/90 to-slate-950/90 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=800&q=80"
            alt="Real Farming Land"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
          />
          <div className="relative z-10 space-y-4">
            <div className="w-10 h-10 rounded-xl bg-agri-500 text-slate-950 flex items-center justify-center font-extrabold shadow-lg">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black leading-tight">
              Join 250+ Farmers & FPOs on AgriConnect
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Sell crops directly, eliminate middlemen, and access aggregated bulk contracts across Karnataka.
            </p>
          </div>

          <div className="relative z-10 p-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-xs space-y-1">
            <span className="text-[10px] font-extrabold text-agri-300 uppercase tracking-widest block">Direct Advantage</span>
            <p className="font-bold">Transparent Prices | 0% Commission | GPS Logistics Dispatch</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="p-8 space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-black text-slate-900">Create Account</h2>
            <p className="text-xs text-slate-500">Register as Farmer, FPO, Buyer or Logistics Partner</p>
          </div>

          {/* Role Selector Tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
            {['FARMER', 'FPO', 'BUYER', 'LOGISTICS'].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-2 rounded-xl transition-all ${
                  role === r ? 'bg-agri-700 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {otpMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{otpMessage}</span>
            </div>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Basavaraj Gowda"
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
              />
            </div>

            {(role === 'FPO' || role === 'BUYER' || role === 'LOGISTICS') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Organization / Company Name</label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder={role === 'FPO' ? 'e.g. Mysuru Farmers Producer Co.' : 'e.g. FreshToHome Foods'}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number (e.g. 9845012345)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password (min 6 chars)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City / Region</label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                >
                  <option value="Mysuru">Mysuru</option>
                  <option value="Mandya">Mandya</option>
                  <option value="Hassan">Hassan</option>
                  <option value="Kodagu">Kodagu</option>
                  <option value="Bengaluru">Bengaluru</option>
                  <option value="Chamarajanagar">Chamarajanagar</option>
                </select>
              </div>
            </div>

            {otpSent && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">Enter Verification OTP</label>
                  <button
                    type="button"
                    disabled={otpLoading}
                    onClick={handleSendOtp}
                    className="text-[11px] font-bold text-agri-700 hover:text-agri-800 hover:underline disabled:opacity-50"
                  >
                    {otpLoading ? 'Resending...' : 'Resend Code'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit code from email"
                  className="w-full px-3.5 py-2.5 bg-emerald-50/50 border border-emerald-300 rounded-xl text-center text-sm font-bold tracking-widest text-emerald-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-agri-600"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || otpLoading}
              className="w-full py-3 bg-gradient-to-r from-agri-700 to-emerald-700 hover:from-agri-800 hover:to-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <UserCheck className="w-4 h-4" />
              {otpLoading ? 'Sending OTP...' : submitting ? 'Creating Account...' : otpSent ? `Register & Login as ${role}` : 'Send OTP'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already registered?{' '}
            <Link to="/login" className="font-bold text-agri-700 hover:underline">
              Log in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
