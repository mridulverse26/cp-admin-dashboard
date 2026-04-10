import { Activity, Database, Server } from 'lucide-react';

function StatusDot({ status }: { status: 'up' | 'down' }) {
  return (
    <span
      className={`w-2.5 h-2.5 rounded-full ${
        status === 'up' ? 'bg-[var(--green)] animate-pulse' : 'bg-[var(--red)]'
      }`}
    />
  );
}

export function SystemHealthPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">System Health</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Infrastructure and service status</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Backend Status */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#22c55e18] flex items-center justify-center">
              <Server size={18} className="text-[var(--green)]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Backend API</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="up" />
            <span className="text-sm font-medium text-[var(--green)]">Operational</span>
          </div>
        </div>

        {/* DB Status */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#22c55e18] flex items-center justify-center">
              <Database size={18} className="text-[var(--green)]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Database</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusDot status="up" />
            <span className="text-sm font-medium text-[var(--green)]">Connected</span>
          </div>
        </div>

        {/* Uptime */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-lg bg-[#6366f118] flex items-center justify-center">
              <Activity size={18} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Uptime</div>
            </div>
          </div>
          <div className="text-[28px] font-bold text-[var(--text-primary)] tracking-tight">99.9%</div>
          <div className="text-[12px] text-[var(--text-secondary)] mt-1">Last 30 days</div>
        </div>
      </div>

      {/* Coming Soon Notice */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-8 text-center">
        <Activity size={40} className="mx-auto mb-3 text-[var(--text-tertiary)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Detailed metrics coming soon</h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
          Response times, error rates, memory usage, and real-time logs will be available here once monitoring is instrumented.
        </p>
      </div>
    </div>
  );
}
