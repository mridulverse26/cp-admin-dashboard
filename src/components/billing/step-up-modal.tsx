import { useState } from 'react';
import { ShieldCheck, X, Loader2 } from 'lucide-react';
import { useBillingStepUp } from '@/hooks/use-admin';

/**
 * 5-minute step-up auth modal. Prompts for fresh TOTP code and stores the
 * step-up token via the hook. Caller awaits the promise; on success the
 * next API call automatically includes X-Step-Up-Token via the axios
 * interceptor.
 */
export function StepUpModal({
  reason,
  onSuccess,
  onCancel,
}: {
  reason: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const stepUp = useBillingStepUp();

  const submit = async () => {
    setError(null);
    try {
      await stepUp.mutateAsync(code);
      onSuccess();
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } }; message?: string };
      setError(err?.response?.data?.message ?? err?.message ?? 'TOTP verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onCancel}>
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-[420px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
            <ShieldCheck size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Step-up authentication</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{reason}</p>
          </div>
          <button onClick={onCancel} className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] -mt-1">
            <X size={18} />
          </button>
        </div>

        <div className="bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg p-3 mb-4">
          <div className="text-xs text-[var(--text-secondary)]">
            Open your authenticator app and enter the current 6-digit code. Token valid for 5 minutes.
          </div>
        </div>

        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus
          placeholder="123456"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          maxLength={10}
          className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />

        {error && (
          <div className="mt-3 text-xs text-red-400">{error}</div>
        )}

        <div className="flex gap-2 justify-end mt-5">
          <button
            onClick={onCancel}
            disabled={stepUp.isPending}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-shell)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={code.length < 6 || stepUp.isPending}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {stepUp.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            Verify
          </button>
        </div>
      </div>
    </div>
  );
}
