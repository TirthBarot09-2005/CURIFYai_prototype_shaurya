import { MapPin, Award, Star, IndianRupee, TrendingUp, UserCheck, ShieldCheck, FileText, AlertCircle } from 'lucide-react';

export default function HospitalCard({ hospital, index, procedure, userBudget, onApplyLoan }) {
  const accBadge = hospital.accreditation === 'JCI'
    ? 'bg-violet-500/10 text-violet-400 border-violet-500/20'
    : hospital.accreditation === 'NABH'
    ? 'bg-sky-500/10 text-sky-400 border-sky-500/20'
    : 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  const tierMap = { metro: 'Metro', tier2: 'Tier 2', tier3: 'Tier 3' };
  const baseRate = hospital.base_rates?.[procedure?.toLowerCase()?.replace(/ /g, '_')];
  const formattedRate = baseRate ? `₹${(baseRate / 100000).toFixed(1)}L` : 'N/A';
  const scorePct = Math.round((hospital.composite_score || 0) * 100);
  const bps = hospital.billing_predictability_score;
  const doctors = hospital.doctors?.[procedure?.toLowerCase()?.replace(/ /g, '_')] || [];
  const isLimitedData = hospital.volume_proxy < 200;

  return (
    <div className="hospital-card transition-all duration-300" style={{ animationDelay: `${index * 0.08}s` }}>
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold shrink-0">
              {index + 1}
            </span>
            <h3 className="text-sm font-bold text-white truncate">{hospital.name}</h3>
            {isLimitedData && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-orange-500/10 border border-orange-500/20 text-orange-400">
                <AlertCircle size={9} /> Limited Data
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 ml-8">
            <span className="flex items-center gap-1"><MapPin size={11} /> {hospital.city}</span>
            <span className="px-1.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] font-medium text-[10px]">
              {tierMap[hospital.tier] || hospital.tier}
            </span>
          </div>
        </div>
        {/* Radial Score */}
        <div className="relative w-12 h-12 shrink-0">
          <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="28" cy="28" r="24" fill="none"
              stroke={scorePct >= 80 ? '#22c55e' : scorePct >= 60 ? '#f59e0b' : '#ef4444'}
              strokeWidth="3" strokeLinecap="round"
              strokeDasharray={`${scorePct * 1.508} 150.8`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-bold text-white">{scorePct}</span>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${accBadge}`}>
          <Award size={10} /> {hospital.accreditation || 'N/A'}
        </span>
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Star size={10} /> {hospital.nlp_score?.toFixed(1)}
        </span>
        {baseRate && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <IndianRupee size={10} /> {formattedRate}
          </span>
        )}
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-white/[0.04] text-slate-400 border border-white/[0.06]">
          <TrendingUp size={10} /> {hospital.volume_proxy?.toLocaleString()} proc/yr
        </span>
        {bps && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium border ${
            bps >= 0.85 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : bps >= 0.75 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            <ShieldCheck size={10} /> Billing: {Math.round(bps * 100)}%
          </span>
        )}
      </div>

      {/* Doctors */}
      {doctors.length > 0 && (
        <div className="mb-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <UserCheck size={10} className="text-sky-400" /> Top Doctors
          </div>
          <div className="flex flex-wrap gap-1.5">
            {doctors.map((doc, i) => (
              <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-500/20 text-sky-300">
                {doc}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <ScoreBar label="Clinical" value={hospital.clinical_relevance} color="bg-emerald-500" />
        <ScoreBar label="Affordability" value={hospital.affordability_match} color="bg-sky-500" />
        <ScoreBar label="Proximity" value={hospital.proximity_score} color="bg-violet-500" />
      </div>

      {/* Apply Loan Button - Only show if there is a funding gap or budget not specified */}
      {onApplyLoan && (!userBudget || userBudget < baseRate) && (
        <button onClick={onApplyLoan}
          className="w-full mt-2 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1.5">
          <FileText size={12} /> Apply for Healthcare Loan
        </button>
      )}
    </div>
  );
}

function ScoreBar({ label, value, color }) {
  const pct = Math.round((value || 0) * 100);
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500">{label}</span>
        <span className="font-semibold text-slate-300">{pct}%</span>
      </div>
      <div className="score-track">
        <div className={`score-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
