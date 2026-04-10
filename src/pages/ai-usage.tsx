import { Cpu, ScanLine, CheckCircle, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { useAIUsage } from '@/hooks/use-admin';

export function AiUsagePage() {
  const { data: ai, isLoading } = useAIUsage();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const a = ai || {};
  const successRate = a.totalCalls > 0 ? Math.round((a.successCount / a.totalCalls) * 100) : 0;
  const byProvider = a.byProvider || [];
  const byCenter = a.byCenter || [];
  const byAction = a.byAction || [];
  const daily = a.daily || [];
  const recentCalls = a.recentCalls || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">AI & OCR Usage</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Token consumption and API call tracking</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total API Calls" value={a.totalCalls || 0} icon={Cpu} color="#8b5cf6" sub={`${a.failureCount || 0} failures`} />
        <StatCard label="Total Tokens" value={(a.totalTokens || 0).toLocaleString()} icon={Zap} color="#f59e0b" sub={`In: ${(a.totalInputTokens || 0).toLocaleString()} / Out: ${(a.totalOutputTokens || 0).toLocaleString()}`} />
        <StatCard label="Success Rate" value={`${successRate}%`} icon={CheckCircle} color="#22c55e" sub={`${a.successCount || 0} successful`} />
        <StatCard label="Avg Latency" value={`${a.avgLatencyMs || 0}ms`} icon={ScanLine} color="#3b82f6" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* By Provider */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tokens by Provider</h3>
          {byProvider.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No AI calls yet. Generate a quiz to start tracking.</p>
          ) : (
            <div className="space-y-3">
              {byProvider.map((p: any) => (
                <div key={p.provider} className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{p.provider}</span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-2">{p.calls} calls</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--accent)]">{(p.tokens || 0).toLocaleString()}</span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-1">tokens</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* By Center */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tokens by Center</h3>
          {byCenter.length === 0 ? (
            <p className="text-sm text-[var(--text-tertiary)] text-center py-8">No center-attributed calls yet.</p>
          ) : (
            <div className="space-y-3">
              {byCenter.map((c: any) => (
                <div key={c.center} className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-primary)]">{c.center}</span>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--amber)]">{(c.tokens || 0).toLocaleString()}</span>
                    <span className="text-xs text-[var(--text-tertiary)] ml-1">({c.calls} calls)</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Usage Chart */}
      {daily.length > 0 && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Daily Token Usage (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={daily}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="tokens" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Calls */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent AI Calls</h3>
        </div>
        {recentCalls.length === 0 ? (
          <div className="p-8 text-center">
            <Cpu size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
            <p className="text-sm text-[var(--text-secondary)]">No AI calls recorded yet</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">Generate a quiz or scan a document to start tracking</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Provider', 'Model', 'Action', 'Input', 'Output', 'Total', 'Latency', 'Center', 'Status', 'Time'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentCalls.map((c: any) => (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)]">
                  <td className="px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] capitalize">{c.provider}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{c.model?.split('-').slice(-2).join('-')}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{c.action}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--blue)] font-mono">{(c.inputTokens || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--amber)] font-mono">{(c.outputTokens || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--accent)] font-bold font-mono">{(c.totalTokens || 0).toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{c.latencyMs}ms</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-secondary)]">{c.centerName || '—'}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${c.success ? 'bg-[#22c55e20] text-[var(--green)]' : 'bg-[#ef444420] text-[var(--red)]'}`}>
                      {c.success ? 'OK' : 'FAIL'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[var(--text-tertiary)]">{new Date(c.createdAt).toLocaleTimeString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
