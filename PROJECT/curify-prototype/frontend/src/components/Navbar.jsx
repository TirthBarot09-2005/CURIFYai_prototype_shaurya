import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, HeartPulse, BarChart3, Info, LogIn, LogOut, LayoutDashboard, UserCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { pathname } = useLocation();
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  // Dynamic nav links based on role
  const NAV_LINKS = [
    { to: '/', label: 'Home' },
    { to: '/blog', label: 'Blog', icon: BookOpen },
    ...(role === 'patient' ? [
      { to: '/patient', label: 'AI Search', icon: HeartPulse },
    ] : []),
    ...(role === 'lender' ? [
      { to: '/lender', label: 'Underwrite', icon: BarChart3 },
      { to: '/lender/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ] : []),
    { to: '/about', label: 'About', icon: Info },
  ];

  return (
    <header>
      <nav
        data-state={open ? 'active' : undefined}
        className={cn(
          "fixed z-50 w-full px-3 md:px-4 transition-colors duration-300",
          isScrolled ? "border-transparent" : "border-b border-white/[0.04]"
        )}
      >
        <div className={cn(
          "mx-auto mt-2 transition-all duration-300",
          isScrolled && "bg-[rgba(10,12,20,0.75)] max-w-5xl rounded-2xl border border-white/[0.08] backdrop-blur-xl px-3"
        )}>
          <div className="relative flex flex-wrap items-center justify-between gap-3 py-3">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link to="/" className="flex items-center gap-2.5 group">
                <motion.div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center"
                  whileHover={{ scale: 1.05 }} transition={{ duration: 0.2 }}>
                  <img src="/pokecut.png" alt="CURIFY" className="h-full w-full object-cover" />
                </motion.div>
                <span className="text-white font-bold text-lg tracking-tight hidden sm:inline">CURIFY</span>
              </Link>
              <div className="flex gap-2 lg:hidden">
                <button onClick={() => setOpen(!open)} aria-label={open ? 'Close Menu' : 'Open Menu'}
                  className="relative z-20 cursor-pointer p-2.5">
                  <Menu className={cn("transition-all duration-200", open && "rotate-180 scale-0 opacity-0")} size={22} color="white" />
                  <X className={cn("absolute inset-0 m-auto transition-all duration-200", open ? "rotate-0 scale-100 opacity-100" : "-rotate-180 scale-0 opacity-0")} size={22} color="white" />
                </button>
              </div>
            </div>

            {/* Desktop nav — centered */}
            <div className="absolute inset-0 m-auto hidden lg:flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1 pointer-events-auto">
                {NAV_LINKS.map(({ to, label }) => {
                  const active = pathname === to;
                  return (
                    <Link key={to} to={to}
                      className={cn(
                        "relative px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200",
                        active ? "text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.06]"
                      )}>
                      {active && (
                        <motion.div layoutId="nav-pill"
                          className="absolute inset-0 rounded-xl bg-white/[0.08] border border-white/[0.08]"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
                      )}
                      <span className="relative z-10">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Auth area — right */}
            <div className="hidden lg:flex items-center gap-3">
              {user ? (
                <>
                  <Link to="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors group">
                    <UserCircle size={16} className={cn("transition-colors", role === 'patient' ? 'text-emerald-400 group-hover:text-emerald-300' : 'text-sky-400 group-hover:text-sky-300')} />
                    <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{user.displayName || user.email}</span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                      role === 'patient' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                    )}>{role}</span>
                  </Link>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all">
                    <LogOut size={14} /> Logout
                  </button>
                </>
              ) : (
                <Link to="/auth"
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                    isScrolled
                      ? "bg-white/[0.08] border border-white/[0.08] text-white hover:bg-white/[0.12]"
                      : "bg-white text-zinc-950 hover:bg-zinc-200"
                  )}>
                  <LogIn size={14} /> Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu */}
            <AnimatePresence>
              {open && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="w-full lg:hidden overflow-hidden">
                  <div className="border border-white/[0.08] backdrop-blur-2xl bg-slate-900/90 rounded-xl p-4 mt-2 space-y-1">
                    {NAV_LINKS.map(({ to, label, icon: Icon }) => (
                      <Link key={to} to={to} onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                          pathname === to ? "bg-white/[0.08] text-white" : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
                        )}>
                        {Icon && <Icon size={16} />}
                        {label}
                      </Link>
                    ))}
                    <div className="border-t border-white/[0.06] pt-2 mt-2">
                      {user ? (
                        <>
                          <div className="flex items-center gap-2 px-4 py-2 text-xs text-slate-400">
                            <UserCircle size={14} /> {user.displayName || user.email}
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ml-auto",
                              role === 'patient' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-sky-500/10 text-sky-400'
                            )}>{role}</span>
                          </div>
                          <button onClick={() => { handleLogout(); setOpen(false); }}
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all w-full">
                            <LogOut size={16} /> Logout
                          </button>
                        </>
                      ) : (
                        <Link to="/auth" onClick={() => setOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all">
                          <LogIn size={16} /> Sign In
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </header>
  );
}
