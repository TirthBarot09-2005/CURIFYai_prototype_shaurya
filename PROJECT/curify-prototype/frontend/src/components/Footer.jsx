import { Link } from 'react-router-dom';
import { Activity, Heart, Shield, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] mt-16">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                <Activity size={16} className="text-white" />
              </div>
              <span className="font-extrabold text-white text-sm">CURIFY <span className="text-emerald-400">AI</span></span>
            </Link>
            <p className="text-xs text-slate-500 leading-relaxed max-w-[200px]">
              Turning clinical uncertainty into bankable financial certainty.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Platform</h4>
            <ul className="space-y-2.5">
              {[['/', 'Home'], ['/patient', 'Patient Search'], ['/lender', 'Lender Dashboard'], ['/about', 'About']].map(([to, label]) => (
                <li key={to}><Link to={to} className="text-xs text-slate-500 hover:text-slate-200 transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Compliance */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Compliance</h4>
            <ul className="space-y-2.5">
              {['DPDP Act 2023', 'RBI Guidelines', 'NMC Ethical AI', 'NHA/CGHS Anchored'].map(c => (
                <li key={c} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <CheckCircle2 size={11} className="text-emerald-500/60" /> {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Hackathon */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-4">Hackathon</h4>
            <p className="text-xs text-slate-500 mb-2">Tenzorx × Poonawalla Fincorp</p>
            <p className="text-xs text-slate-500 mb-2">Healthcare AI Hackathon 2026</p>
            <div className="flex items-center gap-1.5 mt-4">
              <Heart size={11} className="text-rose-400" />
              <span className="text-xs text-slate-500">Built for 500M+ Indians</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.04] pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-600">
            © 2026 CURIFY AI Navigator. Hackathon Edition v1.0
          </p>
          <div className="flex items-center gap-1.5">
            <Shield size={11} className="text-slate-600" />
            <p className="text-[11px] text-slate-600">
              Decision Support Only — Not Medical Advice. All estimates anchored to NHA/CGHS 2024 published rates.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
