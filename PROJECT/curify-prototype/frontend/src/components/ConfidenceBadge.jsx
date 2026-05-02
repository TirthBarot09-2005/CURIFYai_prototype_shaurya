import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function ConfidenceBadge({ score, showLabel = true, size = 'md' }) {
  const pct = Math.round((score || 0) * 100);
  const sizeClasses = size === 'lg' ? 'px-5 py-2.5 text-base gap-2.5' : 'px-4 py-2 text-sm gap-2';
  
  let badgeClass, label, Icon;
  if (score >= 0.80) {
    badgeClass = 'badge-green'; label = 'Auto-Approve'; Icon = ShieldCheck;
  } else if (score >= 0.50) {
    badgeClass = 'badge-yellow'; label = 'Conditional Review'; Icon = Shield;
  } else {
    badgeClass = 'badge-red'; label = 'Human Review Required'; Icon = ShieldAlert;
  }

  return (
    <div className={`inline-flex items-center ${sizeClasses} rounded-full font-bold ${badgeClass} animate-count`}>
      <Icon size={size === 'lg' ? 20 : 16} />
      <span>{pct}%</span>
      {showLabel && <span className="font-medium opacity-80">— {label}</span>}
    </div>
  );
}
