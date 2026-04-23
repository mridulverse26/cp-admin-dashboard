import { useMonitor, useOnlineUsers } from '@/hooks/use-admin';
import type { AdminOnlineUser } from '@/hooks/use-admin';
import { Building2, Users, Activity, Zap, Server, Database, Clock, AlertTriangle, CheckCircle, RefreshCw, Wifi, Flame } from 'lucide-react';

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const s = Math.max(0, Math.floor(diffMs / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

function Avatar({ src, name }: { src: string | null; name: string | null }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="w-8 h-8 rounded-full object-cover bg-[var(--bg-card-hover)] shrink-0"
        onError={e => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)] shrink-0">
      {initial}
    </div>
  );
}

function OnlineStudentsTable({ students }: { students: AdminOnlineUser[] }) {
  if (students.length === 0) {
    return (
      <div className="px-4 py-10 text-center">
        <Activity size={24} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
        <p className="text-[13px] text-[var(--text-secondary)]">No students online right now</p>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
          Students active in the last 15 minutes will show up here
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-[var(--border)]">
            {['', 'Name', 'Phone', 'Email', 'Center', 'Class', 'Exam', 'XP', 'Streak', 'Last seen'].map(h => (
              <th
                key={h || 'avatar'}
                className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors">
              <td className="px-4 py-2.5 w-10">
                <Avatar src={s.avatar} name={s.name} />
              </td>
              <td className="px-4 py-2.5 text-[12px] font-medium text-[var(--text-primary)]">
                <span className="inline-flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                  {s.name || '—'}
                </span>
              </td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)] font-mono">{s.phone}</td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{s.email || '—'}</td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-primary)]">
                {s.centerName || '—'}
                {s.centerSlug && (
                  <span className="block text-[10px] text-[var(--text-tertiary)] font-mono">{s.centerSlug}</span>
                )}
              </td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{s.grade || '—'}</td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{s.targetExam || '—'}</td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{s.xp ?? 0}</td>
              <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">
                <span className="inline-flex items-center gap-1">
                  {(s.currentStreak ?? 0) > 0 && <Flame size={11} className="text-[#f59e0b]" />}
                  {s.currentStreak ?? 0}
                </span>
              </td>
              <td className="px-4 py-2.5 text-[11px] text-[var(--text-tertiary)]">{timeAgo(s.lastActiveAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function BigStat({ label, value, sub, icon: Icon, color, pulse = false }: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  pulse?: boolean;
}) {
  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{label}</div>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
          <Icon size={16} style={{ color }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="text-[32px] font-bold text-[var(--text-primary)] leading-none tracking-tight">{value}</div>
        {pulse && <span className="w-2 h-2 rounded-full mb-1 animate-pulse" style={{ background: color }} />}
      </div>
      {sub && <div className="text-[12px] text-[var(--text-secondary)] mt-1.5">{sub}</div>}
    </div>
  );
}

function MetricBar({ label, value, max, color, unit = '%' }: {
  label: string;
  value: number | null;
  max: number;
  color: string;
  unit?: string;
}) {
  const pct = value !== null ? Math.min((value / max) * 100, 100) : 0;
  const displayValue = value !== null ? `${value}${unit}` : '—';
  const status = value === null ? 'unknown' : value > max * 0.8 ? 'critical' : value > max * 0.6 ? 'warning' : 'ok';

  return (
    <div className="flex items-center gap-3">
      <div className="w-[130px] text-[12px] text-[var(--text-secondary)] shrink-0">{label}</div>
      <div className="flex-1 h-2 bg-[var(--border)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : color,
          }}
        />
      </div>
      <div
        className="w-10 text-right text-[12px] font-bold"
        style={{ color: status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : 'var(--text-primary)' }}
      >
        {displayValue}
      </div>
    </div>
  );
}

function AlarmDot({ ok }: { ok: boolean }) {
  return <span className={`w-2 h-2 rounded-full shrink-0 ${ok ? 'bg-[#22c55e]' : 'bg-[#ef4444] animate-pulse'}`} />;
}

export function SystemHealthPage() {
  const { data: m, isLoading, dataUpdatedAt, refetch, isFetching } = useMonitor();
  const { data: onlineUsers, isFetching: isFetchingOnline } = useOnlineUsers();
  const onlineStudents = (onlineUsers ?? []).filter(u => u.role === 'STUDENT');

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

  const apiUp = !!m;
  const ec2Ok = (m?.ec2Cpu ?? 0) < 80;
  const rdsOk = (m?.rdsCpu ?? 0) < 80 && (m?.rdsConnections ?? 0) < 70;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Live Monitor</h1>
          <p className="text-[12px] text-[var(--text-secondary)] mt-0.5">
            Auto-refreshes every 30s · Last updated: {lastUpdated}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[12px] font-medium ${apiUp ? 'bg-[#22c55e12] border-[#22c55e30] text-[#22c55e]' : 'bg-[#ef444412] border-[#ef444430] text-[#ef4444]'}`}>
            {apiUp ? <Wifi size={13} /> : <AlertTriangle size={13} />}
            {apiUp ? 'All Systems Operational' : 'API Unreachable'}
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer transition-colors"
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Row 1: Platform Totals */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Platform</div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <BigStat label="Total Centers" value={m?.totalCenters ?? 0} icon={Building2} color="#6366f1" sub="Coaching centers" />
            <BigStat label="Total Students" value={m?.totalStudents ?? 0} icon={Users} color="#22c55e" sub={`+${m?.newUsersToday ?? 0} joined today`} />
            <BigStat label="Live Students" value={m?.liveStudents ?? 0} icon={Activity} color="#f59e0b" sub="Active in last 5 min" pulse={true} />
            <BigStat label="Tests Ongoing" value={m?.liveTestsOngoing ?? 0} icon={Zap} color="#ef4444" sub="In-progress right now" pulse={(m?.liveTestsOngoing ?? 0) > 0} />
          </div>

          {/* Row 1.5: Online Students */}
          <div className="flex items-center gap-2 mb-3">
            <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)]">
              Online Students
            </div>
            <span className="text-[10px] text-[var(--text-tertiary)]">
              · Active in last 15 min · {onlineStudents.length} online
              {isFetchingOnline && ' · refreshing…'}
            </span>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden mb-6">
            <OnlineStudentsTable students={onlineStudents} />
          </div>

          {/* Row 2: Today's Activity */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Today's Activity</div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">Tests Submitted</div>
              <div className="text-[40px] font-bold text-[var(--text-primary)] leading-none">{m?.testsSubmittedToday ?? 0}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1.5">in last 24 hours</div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">DPPs Completed</div>
              <div className="text-[40px] font-bold text-[var(--text-primary)] leading-none">{m?.dppsCompletedToday ?? 0}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1.5">in last 24 hours</div>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3">Server Uptime</div>
              <div className="text-[40px] font-bold text-[var(--text-primary)] leading-none">{m?.uptimeSeconds ? formatUptime(m.uptimeSeconds) : '—'}</div>
              <div className="text-[12px] text-[var(--text-secondary)] mt-1.5">since last restart</div>
            </div>
          </div>

          {/* Row 3: Infrastructure */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">Infrastructure</div>
          <div className="grid grid-cols-2 gap-4 mb-6">

            {/* EC2 */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Server size={15} className="text-[var(--text-secondary)]" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">EC2 — t3.small (ap-south-1)</span>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${ec2Ok ? 'bg-[#22c55e18] text-[#22c55e]' : 'bg-[#ef444418] text-[#ef4444]'}`}>
                  {ec2Ok ? 'HEALTHY' : 'HIGH LOAD'}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <MetricBar label="CPU Usage" value={m?.ec2Cpu ?? null} max={100} color="#6366f1" />
                <MetricBar label="PM2 Processes" value={2} max={4} color="#22c55e" unit="" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                2 cluster processes · 1.9GB RAM
              </div>
            </div>

            {/* RDS */}
            <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Database size={15} className="text-[var(--text-secondary)]" />
                <span className="text-[12px] font-semibold text-[var(--text-primary)]">RDS PostgreSQL (db.t4g.micro)</span>
                <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full ${rdsOk ? 'bg-[#22c55e18] text-[#22c55e]' : 'bg-[#ef444418] text-[#ef4444]'}`}>
                  {rdsOk ? 'HEALTHY' : 'WATCH'}
                </span>
              </div>
              <div className="flex flex-col gap-3">
                <MetricBar label="DB CPU" value={m?.rdsCpu ?? null} max={100} color="#6366f1" />
                <MetricBar label="Connections" value={m?.rdsConnections ?? null} max={85} color="#f59e0b" unit="" />
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
                Pool: 10/process · Max: 85 connections
              </div>
            </div>
          </div>

          {/* Row 4: CloudWatch Alarms */}
          <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-secondary)] mb-3">CloudWatch Alarms</div>
          <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { name: 'EC2-HighCPU', label: 'EC2 CPU > 80%', desc: 'Fires if CPU sustained high', ok: ec2Ok },
                { name: 'EC2-Down', label: 'EC2 Down', desc: 'Status check failed', ok: apiUp },
                { name: 'RDS-HighCPU', label: 'RDS CPU > 80%', desc: 'Database CPU alert', ok: rdsOk },
                { name: 'RDS-HighConnections', label: 'RDS Connections > 70', desc: 'Near pool limit', ok: (m?.rdsConnections ?? 0) < 70 },
              ].map(alarm => (
                <div key={alarm.name} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-shell)]">
                  <AlarmDot ok={alarm.ok} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-[var(--text-primary)]">{alarm.label}</div>
                    <div className="text-[11px] text-[var(--text-secondary)]">{alarm.desc}</div>
                  </div>
                  <div className={`text-[10px] font-bold ${alarm.ok ? 'text-[#22c55e]' : 'text-[#ef4444]'}`}>
                    {alarm.ok ? 'OK' : 'ALARM'}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
              <Clock size={11} />
              Alerts fire to mridul.sehgalwork@gmail.com · SNS: classpulse-alerts
            </div>
          </div>

          {/* Footer note */}
          <div className="mt-4 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]">
            <CheckCircle size={11} className="text-[#22c55e]" />
            Frontend served via CloudFront + S3 — always available · Backend: api.classpulseai.com
          </div>
        </>
      )}
    </div>
  );
}
