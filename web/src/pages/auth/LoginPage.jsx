import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { DEMO_USERS } from '../../data/mockData';
import {
  Activity,
  Ambulance,
  Building2,
  ShieldAlert,
  LogIn,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Navigation,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Heart,
  ArrowRight,
  Radio,
  Clock,
  Gauge,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Selected role state (defaults to 'admin' for comprehensive evaluation)
  const [selectedRole, setSelectedRole] = useState('admin');
  const [email, setEmail] = useState(DEMO_USERS.admin.email);
  const [password, setPassword] = useState('demo-password-123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Role routing mapping
  const roleRoutes = {
    reporter: '/reporter/dashboard',
    driver: '/driver/dashboard',
    hospital: '/hospital/dashboard',
    dispatcher: '/dashboard',
    admin: '/admin/dashboard',
  };

  const roleCardConfigs = [
    {
      key: 'reporter',
      title: 'Emergency Reporter',
      persona: 'Priya Sharma',
      badge: 'Citizen SOS',
      icon: Activity,
      iconBg: 'bg-rose-50 text-[#EF233C]',
      selectedBorder: 'border-[#1769FF]',
      selectedBg: 'bg-[#F0F6FF]',
    },
    {
      key: 'driver',
      title: 'Ambulance Driver',
      persona: 'Rajesh Kumar',
      badge: 'Unit 1081',
      icon: Ambulance,
      iconBg: 'bg-amber-50 text-[#F59E0B]',
      selectedBorder: 'border-[#1769FF]',
      selectedBg: 'bg-[#F0F6FF]',
    },
    {
      key: 'hospital',
      title: 'Hospital Staff',
      persona: 'Dr. Ananya Iyer',
      badge: 'Apollo ER',
      icon: Building2,
      iconBg: 'bg-sky-50 text-[#0284C7]',
      selectedBorder: 'border-[#1769FF]',
      selectedBg: 'bg-[#F0F6FF]',
    },
    {
      key: 'dispatcher',
      title: 'Emergency Dispatcher',
      persona: 'Dispatch Lead',
      badge: 'Command Center',
      icon: Radio,
      iconBg: 'bg-indigo-50 text-[#6366F1]',
      selectedBorder: 'border-[#1769FF]',
      selectedBg: 'bg-[#F0F6FF]',
    },
    {
      key: 'admin',
      title: 'Admin / Control Room',
      persona: 'Vikramaditya Rao',
      badge: 'Dispatch HQ',
      icon: ShieldAlert,
      iconBg: 'bg-emerald-50 text-[#10B981]',
      selectedBorder: 'border-[#1769FF]',
      selectedBg: 'bg-[#F0F6FF]',
    },
  ];

  const handleSelectRole = (roleKey) => {
    setSelectedRole(roleKey);
    const targetUser = DEMO_USERS[roleKey];
    if (targetUser) {
      setEmail(targetUser.email);
      setPassword('demo-password-123');
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);

    try {
      // Attempt real credential login
      await login({ email: email.trim(), password });
    } catch (err) {
      // Fallback to selected role login in demo/development mode
      console.warn('Real credential login failed, falling back to demo role login:', err);
      try {
        await login(selectedRole);
      } catch (demoErr) {
        console.warn('Demo login fallback error:', demoErr);
      }
    } finally {
      setIsLoading(false);
      navigate(roleRoutes[selectedRole] || '/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#07152B] via-[#0B1F3A] to-[#07152B] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#1769FF]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-[#EF233C]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container: Two-column layout on Desktop */}
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10 my-4">
        
        {/* ========================================================= */}
        {/* LEFT SECTION — BRANDING & HERO                            */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 space-y-8 text-left">
          {/* Logo & Tagline */}
          <div className="space-y-3">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#EF233C] to-[#1769FF] p-0.5 shadow-xl shadow-[#1769FF]/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-[#07152B] rounded-[14px] flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-white tracking-tight">PulseRoute</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-[#EF233C] text-white tracking-wider uppercase">
                    AI
                  </span>
                </div>
                <p className="text-xs text-[#64748B] font-medium tracking-wide">
                  AI-Powered Emergency Response
                </p>
              </div>
            </Link>
          </div>

          {/* Hero Headlines */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              When Every Second <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-[#1769FF]">
                Matters.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#64748B] max-w-md leading-relaxed font-normal">
              Smarter routing. Faster response. Safer communities. An integrated telemetry ecosystem for citizens, ambulances, and trauma centers.
            </p>
          </div>

          {/* 4 Feature Indicators */}
          <div className="grid grid-cols-2 gap-3 max-w-md">
            <div className="p-3 rounded-2xl bg-[#0B1F3A]/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-[#1769FF]/15 border border-[#1769FF]/30 flex items-center justify-center text-[#1769FF]">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Live Tracking</div>
                <div className="text-[10px] text-[#64748B]">Real-time spatial GPS</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B1F3A]/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-[#EF233C]/15 border border-[#EF233C]/30 flex items-center justify-center text-[#EF233C]">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">AI Assistance</div>
                <div className="text-[10px] text-[#64748B]">Automated AVPU triage</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B1F3A]/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Optimized Routes</div>
                <div className="text-[10px] text-[#64748B]">Congestion avoidance</div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-[#0B1F3A]/70 border border-slate-800/80 flex items-center gap-3 backdrop-blur-sm">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Better Outcomes</div>
                <div className="text-[10px] text-[#64748B]">Trauma ER bed sync</div>
              </div>
            </div>
          </div>

          {/* Telemetry Visual Card Preview */}
          <div className="p-4 rounded-2xl bg-[#0B1F3A]/90 border border-slate-800 shadow-xl max-w-md space-y-3 hidden sm:block">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Telemetry Corridor
              </span>
              <span className="text-[10px] font-mono text-[#1769FF] bg-[#1769FF]/10 px-2 py-0.5 rounded border border-[#1769FF]/30 font-bold">
                ALS Unit 1081
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span className="text-slate-300">Transit Speed: <strong className="text-white">48 km/h</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#EF233C]" />
                <span className="text-slate-300">ER ETA: <strong className="text-white font-mono">~4.2 mins</strong></span>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="pt-2 flex items-center gap-2 text-xs text-[#64748B]">
            <Heart className="w-3.5 h-3.5 text-[#EF233C]" />
            <span>Together for a healthier tomorrow.</span>
            <span className="text-slate-600">•</span>
            <Link to="/" className="text-slate-400 hover:text-white transition-colors">
              Public Portal
            </Link>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT SECTION — WHITE LOGIN CARD                          */}
        {/* ========================================================= */}
        <div className="lg:col-span-6 w-full max-w-lg mx-auto">
          <div className="bg-[#FFFFFF] text-[#14213D] rounded-3xl p-6 sm:p-8 lg:p-9 shadow-2xl border border-[#DCE5F0] relative">
            
            {/* Card Header */}
            <div className="space-y-1 mb-6 text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F6FF] border border-[#DCE5F0] text-[#1769FF] text-[11px] font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[#1769FF]" />
                <span>Fast Demo Access</span>
              </div>
              <h2 className="text-2xl font-black text-[#14213D] tracking-tight">
                Sign In to PulseRoute
              </h2>
              <p className="text-xs text-[#64748B]">
                Select a role to continue with your account
              </p>
            </div>

            {/* Error Message if any */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[#EF233C] text-xs font-semibold mb-4 text-left">
                {error}
              </div>
            )}

            {/* 4 Demo Role Cards Grid */}
            <div className="space-y-2 mb-6 text-left">
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                Choose Demo Role
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {roleCardConfigs.map((roleCard) => {
                  const Icon = roleCard.icon;
                  const isSelected = selectedRole === roleCard.key;

                  return (
                    <button
                      key={roleCard.key}
                      type="button"
                      onClick={() => handleSelectRole(roleCard.key)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-150 flex items-start justify-between gap-2.5 group relative ${
                        isSelected
                          ? 'border-[#1769FF] bg-[#F0F6FF] shadow-sm ring-1 ring-[#1769FF]/30'
                          : 'border-[#DCE5F0] bg-[#F8FAFC] hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${roleCard.iconBg}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-[#14213D] leading-tight truncate">
                            {roleCard.title}
                          </div>
                          <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                            {roleCard.persona}
                          </div>
                        </div>
                      </div>

                      {/* Radio Indicator */}
                      <div className="shrink-0 mt-0.5">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected
                              ? 'border-[#1769FF] bg-[#1769FF]'
                              : 'border-slate-300 bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-left">
              {/* Email Field */}
              <div>
                <label className="block text-xs font-bold text-[#14213D] mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5F0] text-xs font-medium text-[#14213D] placeholder-[#94A3B8] focus:outline-none focus:border-[#1769FF] focus:bg-white focus:ring-2 focus:ring-[#1769FF]/10 transition-all"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#14213D]">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-[11px] font-semibold text-[#1769FF] hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#F8FAFC] border border-[#DCE5F0] text-xs font-medium text-[#14213D] placeholder-[#94A3B8] focus:outline-none focus:border-[#1769FF] focus:bg-white focus:ring-2 focus:ring-[#1769FF]/10 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#14213D] transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-[#64748B]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-[#1769FF] border-[#DCE5F0] focus:ring-[#1769FF] accent-[#1769FF]"
                  />
                  <span>Remember this session</span>
                </label>

                <span className="text-[11px] text-[#64748B] font-mono">
                  Role: <strong className="text-[#14213D] uppercase">{selectedRole}</strong>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#1769FF] to-[#0F55D6] hover:from-[#0F55D6] hover:to-[#0A41AA] text-white font-bold text-xs shadow-lg shadow-[#1769FF]/25 flex items-center justify-center gap-2 transition-all transform active:scale-[0.99] disabled:opacity-50 mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            {/* Disclaimer & Register Link */}
            <div className="mt-5 pt-4 border-t border-[#DCE5F0] space-y-2 text-center text-xs">
              <p className="text-[11px] text-[#64748B]">
                🔒 Simulated JWT Authentication • Student Prototype Mode
              </p>
              <p className="text-[#64748B]">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#1769FF] hover:underline">
                  Create Demo Profile
                </Link>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
