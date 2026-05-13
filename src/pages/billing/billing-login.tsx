import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ShieldCheck, AlertTriangle, Copy, Check, Loader2 } from 'lucide-react';
import { useBillingLogin, useBillingVerifyTotp } from '@/hooks/use-admin';

type Stage = 'credentials' | 'totp-enrollment' | 'totp' | 'backup-codes';

export default function BillingLoginPage() {
  const navigate = useNavigate();
  const login = useBillingLogin();
  const verify = useBillingVerifyTotp();

  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [ticket, setTicket] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const submitCredentials = async () => {
    setError(null);
    try {
      const r = await login.mutateAsync({ email, password });
      setTicket(r.ticket);
      if (r.stage === 'totp-enrollment-required') {
        setQrDataUrl(r.qrDataUrl ?? null);
        setStage('totp-enrollment');
      } else {
        setStage('totp');
      }
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? 'Login failed');
    }
  };

  const submitTotp = async () => {
    setError(null);
    try {
      const r = await verify.mutateAsync({ ticket, code });
      if (r.backupCodes && r.backupCodes.length > 0) {
        setBackupCodes(r.backupCodes);
        setStage('backup-codes');
      } else {
        navigate('/billing/inbox');
      }
    } catch (e) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? 'TOTP verification failed');
    }
  };

  const copyBackupCodes = async () => {
    await navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-shell)] p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[var(--accent)]/10 text-[var(--accent)] mb-4">
            <ShieldCheck size={28} />
          </div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Billing Admin</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Restricted access — Mridul + Anant only</p>
        </div>

        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl p-6">
          {stage === 'credentials' && (
            <>
              <label className="block">
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Email</span>
                <div className="relative mt-1.5">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mridul.sehgalwork@gmail.com"
                    autoComplete="email"
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </label>

              <label className="block mt-4">
                <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">Password</span>
                <div className="relative mt-1.5">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && submitCredentials()}
                    autoComplete="current-password"
                    className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  />
                </div>
              </label>

              {error && (
                <div className="mt-4 flex items-start gap-2 text-xs text-red-400">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={submitCredentials}
                disabled={!email || !password || login.isPending}
                className="w-full mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {login.isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                Continue
              </button>
            </>
          )}

          {stage === 'totp-enrollment' && (
            <>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">First-time setup</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Scan this with Google Authenticator, Authy, or 1Password's TOTP feature, then enter the 6-digit code.
              </p>
              {qrDataUrl && (
                <div className="mt-4 flex justify-center bg-white p-3 rounded-lg">
                  <img src={qrDataUrl} alt="TOTP QR code" className="w-44 h-44" />
                </div>
              )}
              <input
                type="text"
                inputMode="numeric"
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submitTotp()}
                maxLength={10}
                className="w-full mt-4 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
              <button
                onClick={submitTotp}
                disabled={code.length < 6 || verify.isPending}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {verify.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Verify & enroll
              </button>
            </>
          )}

          {stage === 'totp' && (
            <>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Two-factor code</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">Enter the current 6-digit code from your authenticator.</p>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\s/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && submitTotp()}
                maxLength={10}
                className="w-full mt-4 px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
              {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
              <button
                onClick={submitTotp}
                disabled={code.length < 6 || verify.isPending}
                className="w-full mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {verify.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                Verify
              </button>
            </>
          )}

          {stage === 'backup-codes' && (
            <>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Save your backup codes</h2>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                Store these in 1Password. They will <span className="text-amber-400 font-medium">never be shown again</span>.
                Use one if you lose your authenticator.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg p-3 font-mono text-sm text-[var(--text-primary)]">
                {backupCodes.map((c) => <div key={c}>{c}</div>)}
              </div>
              <button
                onClick={copyBackupCodes}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-shell)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)]"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy all 10'}
              </button>
              <button
                onClick={() => navigate('/billing/inbox')}
                className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90"
              >
                I've saved them — continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
