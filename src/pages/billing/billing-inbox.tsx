import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Inbox, Check, X as XIcon, Loader2, AlertTriangle, Clock } from 'lucide-react';
import {
  useBillingPendingChangeRequests,
  useBillingApproveChangeRequest,
  useBillingRejectChangeRequest,
} from '@/hooks/use-admin';
import { getStepUp, getSession } from '@/lib/billing-auth';
import { StepUpModal } from '@/components/billing/step-up-modal';

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}

function timeUntil(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const m = Math.floor(ms / 60000);
  return `${m}m left`;
}

export default function BillingInboxPage() {
  const { data, isLoading, error } = useBillingPendingChangeRequests();
  const approve = useBillingApproveChangeRequest();
  const reject = useBillingRejectChangeRequest();
  const session = getSession();

  const [stepUpFor, setStepUpFor] = useState<null | (() => void)>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const onApprove = (id: string) => {
    if (!getStepUp()) {
      setStepUpFor(() => () => approve.mutate({ id }));
      return;
    }
    approve.mutate({ id });
  };

  const onReject = (id: string) => {
    if (!rejectReason.trim()) return;
    reject.mutate(
      { id, reason: rejectReason },
      {
        onSuccess: () => {
          setRejectingId(null);
          setRejectReason('');
        },
      },
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {stepUpFor && (
        <StepUpModal
          reason="Approving a billing change requires fresh TOTP verification."
          onSuccess={() => {
            const fn = stepUpFor;
            setStepUpFor(null);
            fn();
          }}
          onCancel={() => setStepUpFor(null)}
        />
      )}

      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Inbox size={20} /> Approval Inbox
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Billing changes proposed by the other admin. Each approval applies to demo → uat → prod (production-last).
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm text-red-300">{(error as Error)?.message ?? 'Failed to load'}</div>
        </div>
      )}

      {(!data || data.length === 0) && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-12 text-center">
          <Inbox size={32} className="mx-auto text-[var(--text-tertiary)]" />
          <div className="mt-3 text-sm text-[var(--text-secondary)]">Nothing pending. You're all caught up.</div>
        </div>
      )}

      <div className="space-y-3">
        {data?.map((req: any) => {
          const isMine = req.proposedBy === session?.admin.id;
          return (
            <div key={req.id} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{req.action}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-[var(--bg-shell)] text-[var(--text-secondary)] border border-[var(--border)]">
                      {req.coachingCenterSlug ?? 'global'}
                    </span>
                    {isMine && (
                      <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300">your proposal</span>
                    )}
                    <span className="text-xs text-[var(--text-tertiary)]">· {timeAgo(req.proposedAt)}</span>
                    <span className="text-xs text-amber-400 inline-flex items-center gap-1">
                      <Clock size={11} /> {timeUntil(req.expiresAt)}
                    </span>
                  </div>
                  {req.reason && (
                    <div className="text-sm text-[var(--text-secondary)] mt-2 italic">"{req.reason}"</div>
                  )}
                  <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                    <div className="bg-[var(--bg-shell)] border border-[var(--border)] rounded p-2.5">
                      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1">Before</div>
                      <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-words">{JSON.stringify(req.beforeState, null, 2)}</pre>
                    </div>
                    <div className="bg-[var(--bg-shell)] border border-emerald-500/30 rounded p-2.5">
                      <div className="text-[10px] text-emerald-400 uppercase tracking-wider mb-1">After</div>
                      <pre className="text-[var(--text-secondary)] whitespace-pre-wrap break-words">{JSON.stringify(req.afterState, null, 2)}</pre>
                    </div>
                  </div>
                </div>

                {!isMine && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => onApprove(req.id)}
                      disabled={approve.isPending}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 disabled:opacity-50"
                    >
                      {approve.isPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                      Approve
                    </button>
                    <button
                      onClick={() => setRejectingId(req.id)}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-red-300 bg-red-500/10 rounded-lg border border-red-500/30 hover:bg-red-500/20"
                    >
                      <XIcon size={12} /> Reject
                    </button>
                  </div>
                )}
              </div>

              {rejectingId === req.id && (
                <div className="mt-4 pt-4 border-t border-[var(--border)]">
                  <textarea
                    autoFocus
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={2}
                    placeholder="Why are you rejecting? Visible to the proposer."
                    className="w-full px-3 py-2 bg-[var(--bg-shell)] border border-[var(--border)] rounded text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex gap-2 justify-end mt-2">
                    <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="px-3 py-1.5 text-xs text-[var(--text-secondary)]">
                      Cancel
                    </button>
                    <button
                      onClick={() => onReject(req.id)}
                      disabled={!rejectReason.trim() || reject.isPending}
                      className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded hover:bg-red-500 disabled:opacity-50"
                    >
                      Confirm reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-xs text-[var(--text-tertiary)] pt-4 border-t border-[var(--border)]">
        Auto-refreshes every 30 seconds. <Link to="/billing/audit" className="underline">View audit log →</Link>
      </div>
    </div>
  );
}
