import { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Save,
  RotateCcw,
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  Calendar,
  Wand2,
} from 'lucide-react';
import {
  useBillingSubscription,
  useBillingProposeChange,
  useBillingPreviewPreset,
} from '@/hooks/use-admin';
import { getStepUp } from '@/lib/billing-auth';
import type { EnvKey } from '@/lib/billing-api';
import { StepUpModal } from '@/components/billing/step-up-modal';

const FEATURE_GROUPS: { label: string; keys: { id: string; label: string }[] }[] = [
  {
    label: 'Daily',
    keys: [
      { id: 'home', label: 'Home' },
      { id: 'calendar', label: 'Calendar' },
      { id: 'attendance', label: 'Attendance' },
      { id: 'teaching-plan', label: 'Teaching Plan' },
      { id: 'resources', label: 'Resources' },
    ],
  },
  {
    label: 'Assessments',
    keys: [
      { id: 'mcq', label: 'MCQ Tests' },
      { id: 'theory', label: 'Theory Tests' },
      { id: 'dpp', label: 'DPP' },
      { id: 'homework', label: 'Homework' },
      { id: 'question-bank', label: 'Question Bank' },
    ],
  },
  {
    label: 'Manage',
    keys: [
      { id: 'batches', label: 'Batches' },
      { id: 'students', label: 'Students' },
      { id: 'doubts', label: 'Doubts' },
      { id: 'parent-reports', label: 'Parent Reports' },
      { id: 'fees', label: 'Fees' },
    ],
  },
  {
    label: 'Other',
    keys: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'wellness', label: 'Wellness' },
      { id: 'gamification', label: 'Gamification' },
      { id: 'settings', label: 'Settings' },
    ],
  },
];

const PROD_CONFIRM_SECONDS = 30;

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

export default function BillingCenterDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading, error, refetch } = useBillingSubscription(slug);
  const propose = useBillingProposeChange();
  const preview = useBillingPreviewPreset();

  const [pendingRate, setPendingRate] = useState<number | null>(null);
  const [pendingFlags, setPendingFlags] = useState<Record<string, boolean> | null>(null);
  const [reason, setReason] = useState('');

  const [stepUpFor, setStepUpFor] = useState<null | (() => void)>(null);
  const [envStatus, setEnvStatus] = useState<Partial<Record<EnvKey, 'ok' | 'fail' | 'wait'>>>({});
  const [prodCountdown, setProdCountdown] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const effectiveRate = pendingRate ?? data?.subscription.unitAmountPaise ?? 0;
  const effectiveFlags = useMemo(
    () => (data ? { ...data.featureFlags, ...(pendingFlags ?? {}) } : {}),
    [data, pendingFlags],
  );
  const dirty = pendingRate !== null || pendingFlags !== null;
  const computedBill = effectiveRate * (data?.activeStudentCount ?? 0);

  // Countdown effect for production-last 30s window
  useEffect(() => {
    if (prodCountdown === null) return;
    if (prodCountdown <= 0) return;
    const t = setTimeout(() => setProdCountdown(prodCountdown - 1), 1000);
    return () => clearTimeout(t);
  }, [prodCountdown]);

  const toggleFlag = (key: string, next: boolean) => {
    if (!data) return;
    setPendingFlags((p) => {
      const copy = { ...(p ?? {}) };
      if (data.featureFlags[key] === next) delete copy[key];
      else copy[key] = next;
      return Object.keys(copy).length === 0 ? null : copy;
    });
  };

  const applyPreset = async (preset: 'teaching' | 'thinking' | 'assessment') => {
    if (!slug || !data) return;
    const result = await preview.mutateAsync({ slug, preset });
    setPendingRate(result.suggestedRatePaise);
    const next: Record<string, boolean> = {};
    for (const key of Object.keys(result.proposedFlags)) {
      if (result.proposedFlags[key] !== data.featureFlags[key]) {
        next[key] = result.proposedFlags[key];
      }
    }
    setPendingFlags(Object.keys(next).length === 0 ? null : next);
  };

  const onReset = () => {
    setPendingRate(null);
    setPendingFlags(null);
    setReason('');
    setEnvStatus({});
    setErrorMsg(null);
  };

  const startSave = () => {
    if (!data || !dirty) return;
    if (!getStepUp()) {
      setStepUpFor(() => doSave);
      return;
    }
    doSave();
  };

  async function doSave() {
    if (!data || !slug) return;
    setErrorMsg(null);
    setEnvStatus({ demo: 'wait', uat: 'wait', prod: 'wait' });

    try {
      // Rate change (highest impact)
      if (pendingRate !== null && pendingRate !== data.subscription.unitAmountPaise) {
        await runBroadcast({
          slug,
          action: 'update_rate',
          payload: { unitAmountPaise: pendingRate },
        });
      }
      // Feature toggles
      if (pendingFlags) {
        await runBroadcast({
          slug,
          action: 'update_features',
          payload: { featureFlags: pendingFlags },
        });
      }
      onReset();
      await refetch();
    } catch (e) {
      setErrorMsg((e as Error)?.message ?? 'Save failed');
    }
  }

  async function runBroadcast(args: { slug: string; action: any; payload: any }) {
    return propose.mutateAsync({
      ...args,
      reason: reason || undefined,
      onEnvProgress: (env, ok, err) => {
        setEnvStatus((s) => ({ ...s, [env]: ok ? 'ok' : 'fail' }));
        if (!ok && err) setErrorMsg((cur) => cur ?? `${env}: ${err}`);
      },
      onBeforeProd: async () => {
        // 30-second cancellable window
        setProdCountdown(PROD_CONFIRM_SECONDS);
        const cancelled = await new Promise<boolean>((resolve) => {
          let elapsed = 0;
          const interval = setInterval(() => {
            elapsed += 1;
            if (elapsed >= PROD_CONFIRM_SECONDS) {
              clearInterval(interval);
              resolve(false); // not cancelled — proceed
            }
          }, 1000);
          // Listen for explicit cancel via prodCancelled state
          const checkCancel = () => {
            if (prodCancelled.current) {
              clearInterval(interval);
              resolve(true);
            } else {
              if (elapsed < PROD_CONFIRM_SECONDS) setTimeout(checkCancel, 200);
            }
          };
          setTimeout(checkCancel, 200);
        });
        setProdCountdown(null);
        return !cancelled;
      },
    });
  }

  const prodCancelled = useState({ current: false })[0] as { current: boolean };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">Loading…</div>;
  }
  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/billing/centers" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={14} /> Back to centers
        </Link>
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-300">Failed to load subscription</div>
            <div className="text-xs text-red-300/80 mt-1">{(error as Error)?.message ?? 'Center not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-32">
      {stepUpFor && (
        <StepUpModal
          reason="Subscription panel changes require fresh TOTP verification."
          onSuccess={() => {
            const fn = stepUpFor;
            setStepUpFor(null);
            fn();
          }}
          onCancel={() => setStepUpFor(null)}
        />
      )}

      <div>
        <Link to="/billing/centers" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3">
          <ChevronLeft size={14} /> Back to centers
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[var(--text-primary)]">{data.centerName}</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {data.activeStudentCount} active students · plan: {data.subscription.planTier} · status: {data.subscription.status}
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-[var(--text-tertiary)] uppercase tracking-wider">Monthly bill</div>
            <div className="text-2xl font-semibold text-[var(--text-primary)]">{formatRupees(computedBill)}</div>
            <div className="text-xs text-[var(--text-tertiary)]">{formatRupees(effectiveRate)}/student × {data.activeStudentCount}</div>
          </div>
        </div>
      </div>

      {/* Quick preset buttons */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
          Quick-apply preset (you can tweak after)
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['teaching', 'thinking', 'assessment'] as const).map((p) => (
            <button
              key={p}
              onClick={() => applyPreset(p)}
              disabled={preview.isPending}
              className="px-4 py-3 text-sm font-medium bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] inline-flex items-center justify-center gap-2"
            >
              <Wand2 size={14} /> {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </section>

      {/* Rate */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
          Per-student rate
        </h3>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-5">
          <div className="flex items-center gap-3">
            <span className="text-2xl text-[var(--text-tertiary)]">₹</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={effectiveRate / 100}
              onChange={(e) => {
                const rupees = parseFloat(e.target.value);
                if (Number.isFinite(rupees)) {
                  const paise = Math.round(rupees * 100);
                  setPendingRate(paise === data.subscription.unitAmountPaise ? null : paise);
                }
              }}
              className="w-32 px-3 py-2 bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-2xl font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
            <span className="text-sm text-[var(--text-secondary)]">/ student / month</span>
            {pendingRate !== null && (
              <span className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">
                changed from {formatRupees(data.subscription.unitAmountPaise)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Feature toggles */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
          Features (tick what they get)
        </h3>
        <div className="space-y-3">
          {FEATURE_GROUPS.map((group) => (
            <div key={group.label} className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
              <div className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] bg-[var(--bg-shell)]/40 border-b border-[var(--border)]">
                {group.label}
              </div>
              {group.keys.map((feat) => {
                const on = effectiveFlags[feat.id] ?? false;
                const wasOn = data.featureFlags[feat.id] ?? false;
                const changed = on !== wasOn;
                return (
                  <div key={feat.id} className="flex items-center gap-4 px-5 py-3 border-b border-[var(--border)] last:border-b-0">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      onClick={() => toggleFlag(feat.id, !on)}
                      className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${on ? 'bg-emerald-500' : 'bg-[var(--border)]'}`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${on ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <span className="text-sm text-[var(--text-primary)] flex-1">{feat.label}</span>
                    {changed && <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">changed</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      {/* Reason for change */}
      {dirty && (
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
            Reason (shown to the other admin in approval inbox)
          </h3>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            placeholder="e.g., negotiated locked rate for Dhaval Sir"
            className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </section>
      )}

      {/* Quick state actions */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
          State actions
        </h3>
        <div className="flex flex-wrap gap-2">
          {data.subscription.status !== 'suspended' && (
            <button
              onClick={() => {
                if (!getStepUp()) {
                  setStepUpFor(() => () => propose.mutate({ slug: slug!, action: 'suspend_tenant', payload: {} }));
                  return;
                }
                propose.mutate({ slug: slug!, action: 'suspend_tenant', payload: {} });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-500/10 rounded-lg border border-amber-500/30 hover:bg-amber-500/20"
            >
              <Pause size={12} /> Suspend
            </button>
          )}
          {data.subscription.status === 'suspended' && (
            <button
              onClick={() => {
                if (!getStepUp()) {
                  setStepUpFor(() => () => propose.mutate({ slug: slug!, action: 'reactivate_tenant', payload: {} }));
                  return;
                }
                propose.mutate({ slug: slug!, action: 'reactivate_tenant', payload: {} });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-300 bg-emerald-500/10 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/20"
            >
              <Play size={12} /> Reactivate
            </button>
          )}
          <button
            onClick={() => {
              const days = parseInt(prompt('Extend trial by how many days?') ?? '0', 10);
              if (!Number.isFinite(days) || days <= 0) return;
              if (!getStepUp() && days > 7) {
                setStepUpFor(() => () => propose.mutate({ slug: slug!, action: 'extend_trial', payload: { extendDays: days } }));
                return;
              }
              propose.mutate({ slug: slug!, action: 'extend_trial', payload: { extendDays: days } });
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-card)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
          >
            <Calendar size={12} /> Extend trial
          </button>
        </div>
      </section>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-[220px] right-0 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between gap-4 z-40">
          <div className="text-sm text-[var(--text-secondary)] min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[var(--text-primary)]">
                {pendingRate !== null ? '1 rate change' : ''}
                {pendingRate !== null && pendingFlags ? ' · ' : ''}
                {pendingFlags ? `${Object.keys(pendingFlags).length} feature change${Object.keys(pendingFlags).length === 1 ? '' : 's'}` : ''}
              </span>
              <span className="text-xs text-[var(--text-tertiary)]">
                Order: demo → uat → prod
                {' · '}
                {(['demo', 'uat', 'prod'] as EnvKey[]).map((e, i) => {
                  const s = envStatus[e];
                  const color =
                    s === 'ok' ? 'text-emerald-400' : s === 'fail' ? 'text-red-400' : s === 'wait' ? 'text-amber-400' : 'text-[var(--text-secondary)]';
                  const mark = s === 'ok' ? '✓' : s === 'fail' ? '✗' : s === 'wait' ? '…' : '•';
                  return (
                    <span key={e} className={color}>
                      {i > 0 && <span className="text-[var(--text-tertiary)] mx-1">|</span>}
                      {e} {mark}
                    </span>
                  );
                })}
              </span>
            </div>
            {prodCountdown !== null && (
              <div className="mt-1 flex items-center gap-3 text-xs text-amber-400">
                <span>Applying to PROD in {prodCountdown}s…</span>
                <button onClick={() => { prodCancelled.current = true; }} className="underline">Cancel prod</button>
              </div>
            )}
            {errorMsg && <div className="mt-1 text-red-400 text-xs">{errorMsg}</div>}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onReset}
              disabled={propose.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-shell)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={startSave}
              disabled={propose.isPending}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
            >
              {propose.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {propose.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
