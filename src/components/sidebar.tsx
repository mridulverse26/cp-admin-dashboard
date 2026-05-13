import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  BookOpen,
  Cpu,
  Activity,
  Inbox,
  HardDrive,
  DollarSign,
  LogOut,
  Library,
  ToggleLeft,
  CreditCard,
  History,
} from 'lucide-react';
import { logout as basicLogout } from '@/components/auth-gate';
import { useBillingPendingChangeRequests } from '@/hooks/use-admin';
import { clearSession, getSession } from '@/lib/billing-auth';

const NAV_MAIN = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/centers', icon: Building2, label: 'Centers' },
  { to: '/users', icon: Users, label: 'Users' },
  { to: '/assessments', icon: FileText, label: 'Assessments' },
  { to: '/question-bank', icon: BookOpen, label: 'Question Bank' },
  { to: '/questions', icon: Library, label: 'All Questions' },
  { to: '/requests', icon: Inbox, label: 'Requests' },
  { to: '/ai', icon: Cpu, label: 'AI & OCR' },
  { to: '/storage', icon: HardDrive, label: 'Storage' },
  { to: '/expenditure', icon: DollarSign, label: 'Expenditure' },
  { to: '/feature-flags', icon: ToggleLeft, label: 'Feature Flags' },
  { to: '/system', icon: Activity, label: 'System' },
];

const NAV_BILLING = [
  { to: '/billing/centers', icon: CreditCard, label: 'Billing' },
  { to: '/billing/inbox', icon: Inbox, label: 'Approvals' },
  { to: '/billing/audit', icon: History, label: 'Audit Log' },
];

export function Sidebar() {
  const session = getSession();
  const navigate = useNavigate();
  const { data: pending } = useBillingPendingChangeRequests();
  const pendingForMe = (pending ?? []).filter((r: any) => r.proposedBy !== session?.admin.id).length;

  const signOutBilling = () => {
    clearSession();
    navigate('/billing/login');
  };

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

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_MAIN.map(({ to, icon: Icon, label }) => (
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

        <div className="pt-4 mt-2 border-t border-[var(--border)]">
          <div className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            Billing {session && <span className="text-emerald-400">●</span>}
          </div>
          {NAV_BILLING.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)]'
                }`
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {to === '/billing/inbox' && pendingForMe > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500 text-white font-bold">
                  {pendingForMe}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <div className="px-3 py-3 border-t border-[var(--border)] space-y-2">
        {session && (
          <div className="px-2 mb-1">
            <div className="text-[11px] font-medium text-[var(--text-primary)] truncate">{session.admin.displayName}</div>
            <div className="text-[10px] text-[var(--text-tertiary)] truncate">{session.admin.email}</div>
            <button
              onClick={signOutBilling}
              className="w-full mt-2 flex items-center gap-2 px-2 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] rounded"
            >
              <LogOut size={12} /> Sign out of billing
            </button>
          </div>
        )}
        <button
          onClick={basicLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-all"
        >
          <LogOut size={16} />
          Sign out
        </button>
        <div className="px-3 text-[10px] text-[var(--text-tertiary)]">v0.1.0 - Dev Build</div>
      </div>
    </aside>
  );
}
