import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  sub?: string;
}

export function StatCard({ label, value, icon: Icon, color, sub }: StatCardProps) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 hover:bg-[var(--bg-card-hover)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</span>
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <div className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight">{value}</div>
      {sub && <div className="text-[12px] text-[var(--text-secondary)] mt-1">{sub}</div>}
    </div>
  );
}
