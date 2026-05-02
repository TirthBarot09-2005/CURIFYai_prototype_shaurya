import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  FileText, MapPin, User, HeartPulse, Loader2, AlertTriangle,
  Info, ChevronDown, BarChart3, Zap, ArrowRight, ShieldAlert, Sparkles, Target, Crown, Check
} from 'lucide-react';
import ConfidenceBadge from './ConfidenceBadge';
import CostBreakdown from './CostBreakdown';
import NeuralVortexBg from './ui/NeuralVortexBg';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function LenderForm() {
  const [form, setForm] = useState({ extracted_procedure: 'angioplasty', geo_tier: 'tier2', age: '', comorbidities: '' });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [tierOpen, setTierOpen] = useState(false);
  const [procOpen, setProcOpen] = useState(false);

  const procedures = [
    { value: 'angioplasty', label: 'Angioplasty', icon: '🫀' },
    { value: 'bypass_surgery', label: 'Bypass Surgery (CABG)', icon: '💓' },
    { value: 'knee_replacement', label: 'Knee Replacement', icon: '🦵' },
    { value: 'cataract_surgery', label: 'Cataract Surgery', icon: '👁️' },
    { value: 'hip_replacement', label: 'Hip Replacement', icon: '🦴' },
  ];
  const tiers = [
    { value: 'metro', label: 'Metro', sub: 'Mumbai, Delhi, Chennai, Bangalore', multiplier: '1.4×' },
    { value: 'tier2', label: 'Tier 2', sub: 'Nagpur, Pune, Ahmedabad, Surat, Jaipur', multiplier: '1.0×' },
    { value: 'tier3', label: 'Tier 3', sub: 'Raipur, Aurangabad, Nashik, Jalgaon', multiplier: '0.75×' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true); setReport(null);
    try {
      const payload = {
        extracted_procedure: form.extracted_procedure,
        location: form.geo_tier === 'metro' ? 'Mumbai' : form.geo_tier === 'tier2' ? 'Nagpur' : 'Raipur',
        age: form.age ? parseInt(form.age) : null,
        comorbidities: form.comorbidities || null,
        geo_tier: form.geo_tier,
      };
      const res = await axios.post(`${API_URL}/api/underwrite`, payload);
      setReport(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report.');
    } finally { setLoading(false); }
  };

  return (
    <div className="relative min-h-screen pt-28 pb-16">
      <NeuralVortexBg />

      <div className="relative z-10 max-w-5xl mx-auto px-4">

        {/* ── Hero ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold text-sky-300 mb-6">
            <BarChart3 size={14} /> Financial Intelligence Engine
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight tracking-tight">
            AI Underwriting<br />
            <span className="bg-gradient-to-br from-white via-white to-sky-300 bg-clip-text text-transparent">Engine</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Generate pre-underwriting reports with <span className="text-slate-300 font-medium">component-level cost breakdowns</span>,
            confidence scoring, and automated risk flag analysis.
          </p>
        </motion.div>

        {/* ── Stats Strip ── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Target, value: '8 min', label: 'vs 4hr Manual', color: 'text-emerald-400' },
            { icon: Zap, value: '98%', label: 'Accuracy Rate', color: 'text-sky-400' },
            { icon: Crown, value: '0.00–1.00', label: 'Confidence Score', color: 'text-amber-400' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 text-center">
                <div className="absolute top-0 right-0 -mr-8 -mt-8 h-24 w-24 rounded-full bg-white/[0.02] blur-2xl" />
                <Icon size={20} className={`mx-auto mb-2 ${s.color}`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-1">{s.label}</div>
              </div>
            );
          })}
        </motion.div>

        {/* ── Form Card ── */}
        <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 md:p-8 mb-10 shadow-2xl">
          <div className="absolute top-0 left-0 -ml-20 -mt-20 h-60 w-60 rounded-full bg-sky-500/[0.04] blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* Procedure dropdown */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                <FileText size={12} className="text-sky-400" /> Procedure
              </label>
              <div onClick={() => { setProcOpen(!procOpen); setTierOpen(false); }}
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 cursor-pointer flex items-center justify-between hover:bg-white/[0.07] transition-colors backdrop-blur-md">
                <span className="flex items-center gap-2">
                  <span>{procedures.find(p => p.value === form.extracted_procedure)?.icon}</span>
                  {procedures.find(p => p.value === form.extracted_procedure)?.label}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${procOpen ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {procOpen && (
                  <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {procedures.map(p => (
                      <li key={p.value} onClick={() => { setForm({ ...form, extracted_procedure: p.value }); setProcOpen(false); }}
                        className={`px-4 py-3 text-sm flex items-center gap-3 cursor-pointer transition-colors ${form.extracted_procedure === p.value ? 'bg-sky-500/10 text-sky-300' : 'text-slate-300 hover:bg-white/[0.06]'}`}>
                        <span>{p.icon}</span> {p.label}
                        {form.extracted_procedure === p.value && <Check size={14} className="ml-auto text-sky-400" />}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Tier dropdown */}
            <div className="relative">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                <MapPin size={12} className="text-sky-400" /> Location Tier
              </label>
              <div onClick={() => { setTierOpen(!tierOpen); setProcOpen(false); }}
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-slate-200 cursor-pointer flex items-center justify-between hover:bg-white/[0.07] transition-colors backdrop-blur-md">
                <span>{tiers.find(t => t.value === form.geo_tier)?.label} — {tiers.find(t => t.value === form.geo_tier)?.sub}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${tierOpen ? 'rotate-180' : ''}`} />
              </div>
              <AnimatePresence>
                {tierOpen && (
                  <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className="absolute z-50 w-full mt-2 rounded-xl border border-white/10 bg-slate-900/95 backdrop-blur-xl shadow-2xl overflow-hidden">
                    {tiers.map(t => (
                      <li key={t.value} onClick={() => { setForm({ ...form, geo_tier: t.value }); setTierOpen(false); }}
                        className={`px-4 py-3 cursor-pointer transition-colors ${form.geo_tier === t.value ? 'bg-sky-500/10' : 'hover:bg-white/[0.06]'}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={`text-sm font-medium ${form.geo_tier === t.value ? 'text-sky-300' : 'text-slate-200'}`}>{t.label}</div>
                            <div className="text-xs text-slate-500">{t.sub}</div>
                          </div>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-md ${form.geo_tier === t.value ? 'bg-sky-500/20 text-sky-300' : 'bg-white/[0.04] text-slate-500'}`}>{t.multiplier}</span>
                        </div>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>

            {/* Age */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                <User size={12} className="text-sky-400" /> Patient Age
              </label>
              <input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })}
                placeholder="e.g., 58"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 transition-all backdrop-blur-md" />
            </div>

            {/* Comorbidities */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5">
                <HeartPulse size={12} className="text-sky-400" /> Comorbidities
              </label>
              <input type="text" value={form.comorbidities} onChange={(e) => setForm({ ...form, comorbidities: e.target.value })}
                placeholder="diabetes, hypertension"
                className="w-full px-4 py-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500/30 transition-all backdrop-blur-md" />
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm flex items-center gap-2 bg-red-500/10 text-red-400 border border-red-500/20">
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full group inline-flex items-center justify-center gap-2.5 rounded-full bg-white px-8 py-4 text-sm font-semibold text-zinc-950 transition-all hover:scale-[1.02] hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-40 disabled:hover:scale-100">
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> Generating Report...</>
            ) : (
              <><Sparkles size={20} /> Generate Underwriting Report <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>
            )}
          </button>
        </motion.form>

        {/* ── Report Results ── */}
        <AnimatePresence>
          {report && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
              {/* Confidence Header */}
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 flex items-center justify-between shadow-2xl">
                <div className="absolute top-0 right-0 -mr-12 -mt-12 h-40 w-40 rounded-full bg-emerald-500/[0.04] blur-3xl pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-lg font-bold text-white">Underwriting Report</h2>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Report ID: <span className="font-mono text-sky-400">#{report.report_id}</span>
                  </p>
                </div>
                <ConfidenceBadge score={report.confidence_score} size="lg" />
              </div>

              {/* Cost Breakdown */}
              <CostBreakdown data={report.underwriting} />

              {/* Risk Flags */}
              {report.risk_flags?.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-red-500/5 backdrop-blur-xl p-5">
                  <h3 className="font-bold text-red-300 flex items-center gap-2 mb-3">
                    <ShieldAlert size={16} /> Risk Flags ({report.risk_flags.length})
                  </h3>
                  <ul className="space-y-2">
                    {report.risk_flags.map((flag, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-red-300/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                        {flag.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Disclaimer */}
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 backdrop-blur-xl p-5 flex items-start gap-3">
                <Info size={18} className="text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-amber-300">Pre-Underwriting Estimate Only</p>
                  <p className="text-sm text-amber-200/70">Final approval subject to manual review. Anchored to NHA/CGHS 2024 published rates.</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
