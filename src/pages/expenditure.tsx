import { useState } from 'react';
import { DollarSign, TrendingUp, Server, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { useAwsSpend } from '@/hooks/use-admin';

const RANGE_OPTIONS = [7, 30, 90] as const;
type RangeDays = (typeof RANGE_OPTIONS)[number];

const SERVICE_BAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7'];

function formatUsd(amount: number): string {
  if (Math.abs(amount) < 0.01) return '$0.00';
  if (Math.abs(amount) < 10) return `$${amount.toFixed(2)}`;
  return `$${amount.toFixed(2)}`;
}

function timeAgo(iso: string | null): string {
  if (!iso) return '—';
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ExpenditurePage() {
  const [range, setRange] = useState<RangeDays>(30);
  const { data, isLoading, isError, refetch, isFetching } = useAwsSpend(range);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6">
        <p className="text-sm text-[var(--text-primary)]">Failed to load AWS spend data.</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Check that the EC2 instance role has <code>ce:GetCostAndUsage</code> in us-east-1.
        </p>
      </div>
    );
  }

  const topService = data.byService[0];
  const maxServiceAmount = data.byService.reduce((m, s) => Math.max(m, s.amount), 0);
  const dailyAvg = data.daily.length > 0 ? data.rangeTotal / data.daily.length : 0;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Expenditure</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            AWS spend by service · figures already net of credits/refunds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
            {RANGE_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setRange(d)}
                className={`px-3 py-2 text-xs font-medium transition-colors ${
                  range === d
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Month-to-Date"
          value={formatUsd(data.mtdTotal)}
          icon={DollarSign}
          color="#6366f1"
          sub="USD, current month"
        />
        <StatCard
          label={`Last ${data.days} days`}
          value={formatUsd(data.rangeTotal)}
          icon={TrendingUp}
          color="#22c55e"
          sub={`Avg ${formatUsd(dailyAvg)}/day`}
        />
        <StatCard
          label="Top Service"
          value={topService?.service ?? '—'}
          icon={Server}
          color="#f59e0b"
          sub={topService ? formatUsd(topService.amount) : undefined}
        />
        <StatCard
          label="Services Billed"
          value={data.byService.length}
          icon={Server}
          color="#3b82f6"
        />
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Daily Spend (USD)</h3>
        {data.daily.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No spend data yet for this range.</p>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data.daily}>
              <defs>
                <linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#2a2d3e" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8b8fa3' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#8b8fa3' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `$${v.toFixed(2)}`} />
              <Tooltip
                contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }}
                formatter={(v) => [`$${Number(v ?? 0).toFixed(4)}`, 'Spend']}
              />
              <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={2} fill="url(#spendFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Spend by Service</h3>
        {data.byService.length === 0 ? (
          <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No billable services in this range.</p>
        ) : (
          <div className="space-y-4">
            {data.byService.map((s, idx) => {
              const pct = maxServiceAmount > 0 ? Math.round((s.amount / maxServiceAmount) * 100) : 0;
              const sharePct = data.rangeTotal !== 0 ? Math.round((s.amount / data.rangeTotal) * 1000) / 10 : 0;
              const color = SERVICE_BAR_COLORS[idx % SERVICE_BAR_COLORS.length];
              return (
                <div key={s.service}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div>
                      <span className="text-sm text-[var(--text-primary)] font-medium">{s.service}</span>
                      <span className="text-xs text-[var(--text-tertiary)] ml-2">{sharePct}% of total</span>
                    </div>
                    <span className="text-sm font-bold" style={{ color }}>
                      {formatUsd(s.amount)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[var(--border)]">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.abs(pct)}%`, background: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-[var(--text-tertiary)] flex-wrap">
        <span>Snapshot: {timeAgo(data.lastUpdated)}</span>
        <span>·</span>
        <span>{data.cached ? 'Cached (refreshes every 6h)' : 'Fresh from Cost Explorer'}</span>
        <span>·</span>
        <span>Cost Explorer updates ~24h after spend occurs</span>
        <span>·</span>
        <span>Negative numbers = AWS credits applied</span>
      </div>
    </div>
  );
}
