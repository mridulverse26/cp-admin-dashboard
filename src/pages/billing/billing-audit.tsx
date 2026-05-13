import { useState } from 'react';
import { History } from 'lucide-react';
import { useBillingAuditLog } from '@/hooks/use-admin';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function BillingAuditPage() {
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(0);
  const limit = 50;
  const { data, isLoading } = useBillingAuditLog({
    eventType: eventType || undefined,
    limit,
    offset: page * limit,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <History size={20} /> Billing Audit Log
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Append-only — every billing-admin action is recorded here. Cannot be edited or deleted.
        </p>
      </div>

      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Filter by event type (e.g. change_request_applied)"
          value={eventType}
          onChange={(e) => { setEventType(e.target.value); setPage(0); }}
          className="flex-1 px-3 py-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
        <div className="text-xs text-[var(--text-tertiary)] self-center">
          {data?.total != null ? `${data.total} total` : ''}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">Loading…</div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[var(--bg-shell)]/50 border-b border-[var(--border)]">
              <tr>
                <th className="text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-4 py-2.5">When</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-4 py-2.5">Actor</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-4 py-2.5">Event</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-4 py-2.5">Tenant</th>
                <th className="text-left text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] font-semibold px-4 py-2.5">Before → After</th>
              </tr>
            </thead>
            <tbody>
              {data?.rows.map((row: any) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)] whitespace-nowrap">{fmt(row.createdAt)}</td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{row.actorEmail ?? row.actorAdminId ?? '—'}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded bg-[var(--bg-shell)] text-[var(--text-primary)] border border-[var(--border)] font-mono">
                      {row.eventType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--text-secondary)]">{row.coachingCenterSlug ?? row.coachingCenterId ?? '—'}</td>
                  <td className="px-4 py-3 text-[11px] text-[var(--text-tertiary)] font-mono max-w-md">
                    {row.beforeState || row.afterState ? (
                      <details>
                        <summary className="cursor-pointer text-[var(--text-secondary)] hover:text-[var(--text-primary)]">view diff</summary>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          <pre className="bg-[var(--bg-shell)] p-2 rounded whitespace-pre-wrap break-words">{JSON.stringify(row.beforeState, null, 2)}</pre>
                          <pre className="bg-[var(--bg-shell)] p-2 rounded whitespace-pre-wrap break-words">{JSON.stringify(row.afterState, null, 2)}</pre>
                        </div>
                      </details>
                    ) : '—'}
                  </td>
                </tr>
              ))}
              {data?.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[var(--text-tertiary)]">No audit entries match the filter</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded disabled:opacity-50"
        >
          ← Prev
        </button>
        <span>Page {page + 1}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={(data?.rows.length ?? 0) < limit}
          className="px-3 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
