import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  BarChart3, Shield, AlertTriangle, CheckCircle2, Clock, XCircle,
  TrendingUp, Users, IndianRupee, Activity, ChevronDown, Eye,
  Loader2, RefreshCw, FileText, MapPin, Sparkles, Flag, Zap
} from 'lucide-react';
import NeuralVortexBg from '../components/ui/NeuralVortexBg';
import { useAuth } from '../context/AuthContext';

import { TracingBeam } from '../components/ui/tracing-beam';

const API_URL = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG = {
  pending: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: Clock, label: 'Pending Review' },
  approved: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2, label: 'Approved' },
  conditional: { color: 'text-sky-400', bg: 'bg-sky-500/10 border-sky-500/20', icon: Eye, label: 'Conditional' },
  rejected: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: XCircle, label: 'Rejected' },
  flagged: { color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', icon: Flag, label: 'Flagged for Review' },
};

const RISK_CONFIG = {
  Low: { color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Medium: { color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  High: { color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

function ConfidenceIndicator({ score }) {
  const pct = Math.round(score * 100);
  let color = 'from-red-500 to-orange-500';
  let label = 'LOW — Manual Review';
  if (score >= 0.80) { color = 'from-emerald-500 to-green-400'; label = 'HIGH — Fast Track'; }
  else if (score >= 0.50) { color = 'from-amber-500 to-yellow-400'; label = 'MEDIUM — Conditional'; }
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-slate-400">{label}</span>
        <span className="font-bold text-white">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-full rounded-full bg-gradient-to-r ${color}`} />
      </div>
    </div>
  );
}

function PortfolioChart({ data, title, colorClass }) {
  if (!data || Object.keys(data).length === 0) return null;
  const max = Math.max(...Object.values(data));
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h4>
      {Object.entries(data).map(([key, val]) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-28 truncate capitalize">{key.replace(/_/g, ' ')}</span>
          <div className="flex-1 h-5 bg-white/5 rounded-md overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${(val / max) * 100}%` }} transition={{ duration: 0.8 }}
              className={`h-full rounded-md ${colorClass || 'bg-emerald-500/60'}`} />
          </div>
          <span className="text-xs font-bold text-white w-8 text-right">{val}</span>
        </div>
      ))}
    </div>
  );
}

export default function LenderDashboard() {
  const { getToken } = useAuth();
  const [applications, setApplications] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      
      const [appRes, portRes] = await Promise.all([
        axios.get(`${API_URL}/api/loan/applications`, { headers }),
        axios.get(`${API_URL}/api/portfolio`, { headers })
      ]);
      setApplications(appRes.data);
      setPortfolio(portRes.data);
    } catch (error) {
      console.error(error);
    } finally { setLoading(false); }
  };

  useEffect(() => { 
    fetchDashboard(); 
    const interval = setInterval(fetchDashboard, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const updateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      const token = await getToken();
      await axios.patch(`${API_URL}/api/loan/${id}/status`, 
        { status, lender_notes: '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMsg(`Loan ${status} successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      await fetchDashboard();
    } catch (error) { 
      console.error(error); 
      setSuccessMsg("Error updating status.");
      setTimeout(() => setSuccessMsg(null), 3000);
    }
    finally { setActionLoading(null); }
  };

  return (
    <div className="relative min-h-screen pt-24 pb-16">
      <NeuralVortexBg />

      {/* Success Notification */}
      <AnimatePresence>
        {successMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 backdrop-blur-xl flex items-center gap-2 shadow-2xl">
            <CheckCircle2 size={18} />
            <span className="text-sm font-semibold">{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <TracingBeam className="relative z-10 px-4">
        {/* Header */}
        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs font-semibold text-sky-300 mb-4">
            <BarChart3 size={14} /> Lender Intelligence Dashboard
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-2">
            Portfolio & <span className="bg-gradient-to-br from-white to-sky-300 bg-clip-text text-transparent">Underwriting Center</span>
          </h1>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">Real-time loan applications, risk analytics, and portfolio concentration monitoring.</p>
        </motion.div>

        {/* Portfolio Stats */}
        {portfolio && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { icon: FileText, label: 'Total Applications', value: portfolio.total_applications, color: 'text-sky-400' },
              { icon: IndianRupee, label: 'Total Exposure', value: `₹${(portfolio.total_exposure / 100000).toFixed(1)}L`, color: 'text-emerald-400' },
              { icon: AlertTriangle, label: 'High Risk', value: portfolio.high_risk_count, color: 'text-red-400' },
              { icon: TrendingUp, label: 'Avg Confidence', value: `${Math.round(portfolio.avg_confidence * 100)}%`, color: 'text-amber-400' },
            ].map((s, i) => (
              <div key={i} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-4 text-center">
                <s.icon size={18} className={`mx-auto mb-1.5 ${s.color}`} />
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Portfolio Charts */}
        {portfolio && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <PortfolioChart data={portfolio.by_status} title="By Status" colorClass="bg-sky-500/60" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <PortfolioChart data={portfolio.by_procedure} title="By Procedure (Concentration Risk)" colorClass="bg-emerald-500/60" />
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
              <PortfolioChart data={portfolio.by_city} title="By City (Geo Risk)" colorClass="bg-violet-500/60" />
            </div>
          </motion.div>
        )}

        {/* Refresh */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={18} className="text-sky-400" /> Loan Applications
          </h2>
          <button onClick={fetchDashboard} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-sky-400" />
          </div>
        ) : (
          <div className="space-y-3">
            {applications.map((app, idx) => {
              const config = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedId === app.id;
              return (
                <motion.div key={app.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4 flex items-center gap-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : app.id)}>
                    {/* Confidence circle */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${config.bg}`}>
                      <span className={`text-sm font-bold ${config.color}`}>{Math.round(app.confidence_score * 100)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">Applicant:</span>
                        <span className="font-semibold text-white text-sm">{app.patient_name}</span>
                        {app.source === 'curify_recommendation' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold flex items-center gap-1">
                            <Sparkles size={8} />CURIFY Matched
                          </span>
                        )}
                        {new Date(app.created_at) > new Date(Date.now() - 5 * 60 * 1000) && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-400 font-bold animate-pulse">
                            NEW
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${config.bg} ${config.color} font-semibold ml-auto`}>
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="capitalize">{app.procedure.replace(/_/g, ' ')}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><MapPin size={10} />{app.hospital_city}</span>
                        <span>•</span>
                        <span>₹{(app.loan_amount_requested / 1000).toFixed(0)}K</span>
                        {app.risk_level && (
                          <>
                            <span>•</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${(RISK_CONFIG[app.risk_level] || RISK_CONFIG.Medium).bg} ${(RISK_CONFIG[app.risk_level] || RISK_CONFIG.Medium).color} font-semibold`}>
                              Risk: {app.risk_level}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <ChevronDown size={16} className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {/* Expanded Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }} className="overflow-hidden">
                        <div className="p-4 pt-0 border-t border-white/[0.04] space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                            <div><span className="text-slate-500">Age</span><div className="font-medium text-white">{app.patient_age || 'N/A'}</div></div>
                            <div><span className="text-slate-500">Hospital</span><div className="font-medium text-white truncate">{app.hospital_name}</div></div>
                            <div><span className="text-slate-500">Est. Cost Range</span><div className="font-medium text-white">₹{(app.estimated_cost_min/1000).toFixed(0)}K–₹{(app.estimated_cost_max/1000).toFixed(0)}K</div></div>
                            <div><span className="text-slate-500">Ayushman Coverage</span><div className="font-medium text-emerald-400">₹{(app.ayushman_coverage/1000).toFixed(0)}K</div></div>
                            <div><span className="text-slate-500">Funding Gap</span><div className="font-medium text-amber-400">₹{(app.funding_gap/1000).toFixed(0)}K</div></div>
                            <div><span className="text-slate-500">Comorbidities</span><div className="font-medium text-white">{app.comorbidities || 'None'}</div></div>
                            <div><span className="text-slate-500">Geo Tier</span><div className="font-medium text-white capitalize">{app.geo_tier}</div></div>
                          </div>

                          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                <Activity size={16} className="text-emerald-400" /> Clinical Intelligence
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-bold text-emerald-400">GENERATED VIA CURIFY AI</span>
                              </h4>
                              <div className="flex items-center gap-4">
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-500 uppercase">Risk Level</p>
                                  <p className={`text-xs font-bold ${app.risk_level === 'Low' ? 'text-emerald-400' : app.risk_level === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>{app.risk_level}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-[10px] text-slate-500 uppercase">Approval Prob.</p>
                                  <p className="text-xs font-bold text-sky-400">{app.approval_probability ? `${Math.round(app.approval_probability * 100)}%` : 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            
                            <ConfidenceIndicator score={app.confidence_score} />

                            {app.risk_flags?.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {app.risk_flags.map((f, i) => (
                                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1">
                                    <AlertTriangle size={10} /> {f.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          {app.status === 'pending' ? (
                            <div className="flex gap-2 pt-2">
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'approved'); }} disabled={actionLoading === app.id}
                                className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/30 transition-colors flex items-center justify-center gap-1.5">
                                <CheckCircle2 size={14} /> Approve
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'conditional'); }} disabled={actionLoading === app.id}
                                className="flex-1 py-2.5 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 text-xs font-semibold hover:bg-sky-500/30 transition-colors flex items-center justify-center gap-1.5">
                                <Eye size={14} /> Conditional
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'flagged'); }} disabled={actionLoading === app.id}
                                className="flex-1 py-2.5 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-semibold hover:bg-orange-500/30 transition-colors flex items-center justify-center gap-1.5">
                                <Flag size={14} /> Flag
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'rejected'); }} disabled={actionLoading === app.id}
                                className="py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-semibold hover:bg-red-500/30 transition-colors flex items-center justify-center gap-1.5">
                                <XCircle size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2 pt-2">
                              <button onClick={(e) => { e.stopPropagation(); updateStatus(app.id, 'pending'); }} disabled={actionLoading === app.id}
                                className="flex-1 py-2.5 rounded-xl bg-slate-500/10 border border-white/10 text-slate-400 text-xs font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5">
                                <RefreshCw size={14} /> Reset to Pending (Demo Only)
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* DPDP Compliance */}
        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-xl p-4 flex items-center gap-3">
          <Shield size={16} className="text-emerald-400 shrink-0" />
          <p className="text-[11px] text-slate-500">DPDP Act 2023 Compliant • Decision Support Only — Not Medical Advice • All estimates anchored to NHA/CGHS 2024 published rates</p>
        </div>
      </TracingBeam>
    </div>
  );
}
