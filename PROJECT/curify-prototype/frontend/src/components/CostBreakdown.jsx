import { Stethoscope, BedDouble, FlaskConical, Pill, ShieldPlus, Calculator, Clock, MapPin, Activity } from 'lucide-react';

export default function CostBreakdown({ data }) {
  if (!data) return null;

  const fmt = (v) => v >= 100000 ? `₹${(v / 100000).toFixed(2)}L` : v >= 1000 ? `₹${(v / 1000).toFixed(0)}K` : `₹${v}`;

  const rows = [
    { label: 'Surgery / Procedure', min: data.surgery_cost_min, max: data.surgery_cost_max, icon: Stethoscope, color: 'bg-emerald-500', pct: 45 },
    { label: 'Hospital Stay (Room)', min: data.room_cost_min, max: data.room_cost_max, icon: BedDouble, color: 'bg-sky-500', pct: 15 },
    { label: 'Diagnostics', min: data.diagnostics_min, max: data.diagnostics_max, icon: FlaskConical, color: 'bg-violet-500', pct: 10 },
    { label: 'Medicines', min: data.medicines_min, max: data.medicines_max, icon: Pill, color: 'bg-amber-500', pct: 18 },
    { label: 'Contingency Buffer', min: data.contingency_min, max: data.contingency_max, icon: ShieldPlus, color: 'bg-rose-500', pct: 12 },
  ];

  return (
    <div className="glass-strong p-6 animate-slide delay-2">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Calculator size={18} className="text-emerald-400" />
          Component-Level Cost Breakdown
        </h3>
        <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          NHA/CGHS Anchored
        </span>
      </div>

      <div className="space-y-1 mb-5">
        {rows.map((r, i) => {
          const Icon = r.icon;
          const barWidth = data.total_max > 0 ? Math.round((r.max / data.total_max) * 100) : r.pct;
          return (
            <div key={i} className="group py-3 border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] -mx-2 px-2 rounded-lg transition-colors duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.color}`} />
                  <Icon size={14} className="text-slate-500" />
                  <span className="text-sm text-slate-300">{r.label}</span>
                </div>
                <span className="text-sm font-semibold text-white font-mono">
                  {fmt(r.min)} – {fmt(r.max)}
                </span>
              </div>
              <div className="ml-[26px] score-track">
                <div className={`score-fill ${r.color}/60`} style={{ width: `${barWidth}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="relative overflow-hidden rounded-xl p-4 mb-5 bg-gradient-to-r from-emerald-500/10 to-sky-500/10 border border-emerald-500/15">
        <div className="flex items-center justify-between relative z-10">
          <span className="text-sm font-bold text-emerald-300 uppercase tracking-wider">Total Estimated Range</span>
          <span className="text-xl font-bold text-white font-mono">
            {fmt(data.total_min)} – {fmt(data.total_max)}
          </span>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: Clock, label: 'Est. Stay', value: `${data.estimated_los} days`, color: 'text-sky-400' },
          { icon: MapPin, label: 'Geo Factor', value: `${data.geo_adjustment}x`, color: 'text-violet-400' },
          { icon: Activity, label: 'Comorbidity', value: `+${Math.round((data.comorbidity_uplift || 0) * 100)}%`, color: 'text-amber-400' },
        ].map((m, i) => (
          <div key={i} className="stat-glow">
            <m.icon size={16} className={`mx-auto mb-2 ${m.color}`} />
            <div className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">{m.label}</div>
            <div className="text-sm font-bold text-white">{m.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
