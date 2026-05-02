import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Navigate } from 'react-router-dom';
import { AuthenticateWithRedirectCallback } from '@clerk/clerk-react';
import { HeartPulse, BarChart3, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoleSelectPage() {
  const { user, role, profileCompleted, setUserRole, loading, isSignedIn } = useAuth();
  const navigate = useNavigate();

  const selectRole = async (role) => {
    await setUserRole(role);
    navigate(role === 'patient' ? '/patient' : '/lender/dashboard', { replace: true });
  };

  const isSsoCallback = window.location.href.includes('__clerk_status') || window.location.hash.includes('__clerk_status');

  // 1. Manual fallback for SSO redirect
  useEffect(() => {
    if (isSignedIn && isSsoCallback) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      navigate('/auth/role', { replace: true });
    }
  }, [isSignedIn, isSsoCallback, navigate]);

  // 2. Redirect to onboarding if profile not completed
  useEffect(() => {
    if (!loading) {
      if (profileCompleted && role) {
        console.log("[RoleSelectPage] Already onboarded, redirecting to dashboard...");
        navigate(role === 'patient' ? '/patient' : '/lender/dashboard', { replace: true });
      } else if (!profileCompleted) {
        console.log("[RoleSelectPage] Redirecting to unified onboarding...");
        navigate('/onboarding', { replace: true });
      }
    }
  }, [profileCompleted, role, loading, navigate]);

  if (loading || isSsoCallback) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {isSsoCallback && <AuthenticateWithRedirectCallback />}
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
          <p className="text-xs text-slate-500 animate-pulse">Synchronizing Session...</p>
        </div>
      </div>
    );
  }

  // CRITICAL: Only redirect to login if we are CERTAIN the user is not signed in
  if (!loading && !isSignedIn && !isSsoCallback) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 py-24">
      {/* Ambient glows */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/[0.06] blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-sky-500/[0.05] blur-[100px]" />
      </div>

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-10">
          <img src="/LOGO.png" alt="CURIFY" className="w-14 h-14 rounded-xl mx-auto mb-3 object-contain" />
          <h1 className="text-3xl font-bold text-white mb-2">Welcome, {user?.displayName || 'User'}!</h1>
          <p className="text-slate-400 text-sm">Choose how you'd like to use CURIFY AI</p>
        </div>

        {/* Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Patient */}
          <motion.button
            onClick={() => selectRole('patient')}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-white/[0.03] backdrop-blur-xl p-8 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/[0.06]"
          >
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-emerald-500/[0.08] blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-5">
                <HeartPulse className="text-emerald-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">I'm a Patient</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Search hospitals, compare costs, get AI-powered treatment recommendations, and apply for healthcare loans.
              </p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
                Enter Patient Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>

          {/* Lender */}
          <motion.button
            onClick={() => selectRole('lender')}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden rounded-3xl border border-sky-500/20 bg-white/[0.03] backdrop-blur-xl p-8 text-left transition-all hover:border-sky-500/40 hover:bg-sky-500/[0.06]"
          >
            <div className="absolute top-0 right-0 -mr-10 -mt-10 h-40 w-40 rounded-full bg-sky-500/[0.08] blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 flex items-center justify-center mb-5">
                <BarChart3 className="text-sky-400" size={28} />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">I'm a Lender</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Review loan applications, run underwriting reports, monitor portfolio risk, and manage approvals.
              </p>
              <div className="flex items-center gap-2 text-sky-400 text-sm font-semibold">
                Enter Lender Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
