import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Building2, Users, FileText, BookOpen, Cpu, Activity } from 'lucide-react';

const NAV = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/centers', icon: Building2, label: 'Centers' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/assessments', icon: FileText, label: 'Assessments' },
  { to: '/question-bank', icon: BookOpen, label: 'Question Bank' },
  { to: '/ai', icon: Cpu, label: 'AI & OCR' },
  { to: '/system', icon: Activity, label: 'System' },
];

export function Sidebar() {
  return (
    <aside className="w-[220px] h-screen bg-[var(--bg-sidebar)] border-r border-[var(--border)] flex flex-col fixed left-0 top-0 z-50">
      <div className="px-5 py-5 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center text-white text-xs font-bold">CP</div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">ClassPulse</div>
            <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                isActive
                  ? 'bg-[var(--accent)] text-white'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-[var(--border)]">
        <div className="text-[10px] text-[var(--text-tertiary)]">v0.1.0 - Dev Build</div>
      </div>
    </aside>
  );
}
