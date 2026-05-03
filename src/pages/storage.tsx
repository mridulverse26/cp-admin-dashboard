import { HardDrive, Database, FileBox, RefreshCw, PieChart, Building2 } from 'lucide-react';
import { StatCard } from '@/components/stat-card';
import { useAwsStorage, useAwsStorageByCenter, type AwsCenterStorage } from '@/hooks/use-admin';

const BUCKET_BAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6'];
const CENTER_BAR_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#3b82f6', '#ec4899', '#14b8a6', '#a855f7', '#ef4444'];

function planLabel(plan: string): string {
  return plan.replace(/_/g, ' ');
}

function quotaBarColor(percentUsed: number): string {
  if (percentUsed >= 90) return '#ef4444';
  if (percentUsed >= 70) return '#f59e0b';
  return '#22c55e';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  const decimals = i >= 2 ? 2 : i === 1 ? 1 : 0;
  return `${value.toFixed(decimals)} ${units[i]}`;
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

export function StoragePage() {
  const { data, isLoading, isError, refetch, isFetching } = useAwsStorage();
  const { data: byCenter, refetch: refetchByCenter } = useAwsStorageByCenter();

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
        <p className="text-sm text-[var(--text-primary)]">Failed to load storage data.</p>
        <p className="text-xs text-[var(--text-tertiary)] mt-1">
          Check that the EC2 instance role has <code>s3:ListAllMyBuckets</code> and <code>cloudwatch:GetMetricStatistics</code>.
        </p>
      </div>
    );
  }

  const maxBytes = data.buckets.reduce((m, b) => Math.max(m, b.sizeBytes), 0);

  return (
    <div>
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Storage</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            S3 bucket sizes across the AWS account · ap-south-1
          </p>
        </div>
        <button
          onClick={() => { refetch(); refetchByCenter(); }}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Used"
          value={formatBytes(data.totalBytes)}
          icon={HardDrive}
          color="#6366f1"
          sub={`${data.totalObjects.toLocaleString()} objects · ${data.buckets.length} buckets`}
        />
        <StatCard
          label="Total Quota"
          value={byCenter ? formatBytes(byCenter.totals.totalQuotaBytes) : '—'}
          icon={Database}
          color="#22c55e"
          sub={byCenter ? `Across ${byCenter.totals.centerCount} centers` : 'Loading…'}
        />
        <StatCard
          label="Utilization"
          value={byCenter ? `${byCenter.totals.utilizationPct}%` : '—'}
          icon={PieChart}
          color={byCenter ? quotaBarColor(byCenter.totals.utilizationPct) : '#6366f1'}
          sub={byCenter ? `${formatBytes(byCenter.totals.trackedBytes)} of quota in use` : undefined}
        />
        <StatCard
          label="Largest Bucket"
          value={data.buckets[0]?.name ?? '—'}
          icon={FileBox}
          color="#f59e0b"
          sub={data.buckets[0] ? formatBytes(data.buckets[0].sizeBytes) : undefined}
        />
      </div>

      {byCenter && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Storage by Center</h3>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                App-tracked uploads, grouped by coaching center
              </p>
            </div>
            <Building2 size={16} className="text-[var(--text-tertiary)]" />
          </div>

          {byCenter.centers.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No centers found.</p>
          ) : (
            <div className="space-y-4">
              {byCenter.centers.map((c: AwsCenterStorage, idx: number) => {
                const accent = CENTER_BAR_COLORS[idx % CENTER_BAR_COLORS.length];
                const usedPct = c.percentUsed;
                const barColor = quotaBarColor(usedPct);
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: accent }} />
                        <span className="text-sm font-medium text-[var(--text-primary)] truncate">{c.name}</span>
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--text-secondary)] flex-shrink-0">
                          {planLabel(c.plan)}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] flex-shrink-0">
                          {c.fileCount.toLocaleString()} files
                        </span>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <span className="text-sm font-bold text-[var(--text-primary)]">
                          {formatBytes(c.usedBytes)}
                        </span>
                        <span className="text-xs text-[var(--text-tertiary)] mx-1">/</span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {formatBytes(c.quotaBytes)}
                        </span>
                        <span className="text-xs ml-2 font-mono" style={{ color: barColor }}>
                          {usedPct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden bg-[var(--border)]">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, usedPct)}%`, background: barColor }}
                      />
                    </div>
                  </div>
                );
              })}

              {byCenter.totals.untrackedBytes > 0 && (
                <div className="pt-3 mt-3 border-t border-[var(--border)]">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[var(--text-tertiary)]" />
                      <span className="text-sm font-medium text-[var(--text-secondary)]">System / Unattributed</span>
                      <span className="text-[10px] text-[var(--text-tertiary)]">qbank, applications, backups, proctoring</span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-secondary)]">
                      {formatBytes(byCenter.totals.untrackedBytes)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-[var(--border)]">
                    <div
                      className="h-full rounded-full bg-[var(--text-tertiary)]"
                      style={{
                        width: `${
                          byCenter.totals.bucketBytes > 0
                            ? (byCenter.totals.untrackedBytes / byCenter.totals.bucketBytes) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-tertiary)]">
            <span>
              Tracked usage: <span className="text-[var(--text-secondary)] font-medium">{formatBytes(byCenter.totals.trackedBytes)}</span>
            </span>
            <span>
              Total quota: <span className="text-[var(--text-secondary)] font-medium">{formatBytes(byCenter.totals.totalQuotaBytes)}</span>
            </span>
            <span>
              Utilization: <span className="font-medium" style={{ color: quotaBarColor(byCenter.totals.utilizationPct) }}>{byCenter.totals.utilizationPct}%</span>
            </span>
          </div>
        </div>
      )}

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Buckets by Size</h3>
        <div className="space-y-4">
          {data.buckets.map((b, idx) => {
            const pct = maxBytes > 0 ? Math.round((b.sizeBytes / maxBytes) * 100) : 0;
            const sharePct = data.totalBytes > 0 ? Math.round((b.sizeBytes / data.totalBytes) * 1000) / 10 : 0;
            const color = BUCKET_BAR_COLORS[idx % BUCKET_BAR_COLORS.length];
            return (
              <div key={b.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm text-[var(--text-primary)] font-medium">{b.name}</span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">
                      {b.objectCount.toLocaleString()} objects · {sharePct}% of total
                    </span>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>
                    {formatBytes(b.sizeBytes)}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden bg-[var(--border)]">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{ width: `${pct}%`, background: color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Bucket Details</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Bucket', 'Size', 'Objects', 'Share', 'Last Sample'].map(h => (
                <th key={h} className="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.buckets.map(b => {
              const sharePct = data.totalBytes > 0 ? (b.sizeBytes / data.totalBytes) * 100 : 0;
              return (
                <tr key={b.name} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)]">
                  <td className="px-5 py-3 text-sm font-medium text-[var(--text-primary)]">{b.name}</td>
                  <td className="px-5 py-3 text-sm text-[var(--text-secondary)] font-mono">{formatBytes(b.sizeBytes)}</td>
                  <td className="px-5 py-3 text-sm text-[var(--text-secondary)] font-mono">{b.objectCount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-[var(--text-secondary)] font-mono">{sharePct.toFixed(1)}%</td>
                  <td className="px-5 py-3 text-xs text-[var(--text-tertiary)]">{timeAgo(b.lastUpdated)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
        <span>Snapshot: {timeAgo(data.lastUpdated)}</span>
        <span>·</span>
        <span>{data.cached ? 'Cached (refreshes hourly)' : 'Fresh from CloudWatch'}</span>
        <span>·</span>
        <span>S3 metrics update once per day at the AWS source</span>
      </div>
    </div>
  );
}
