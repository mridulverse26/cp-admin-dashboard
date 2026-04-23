import { useState, type ReactNode, type FormEvent } from 'react';
import { Lock } from 'lucide-react';

const USERNAME = 'classpulse';
const PASSWORD = 'classpulse@12';
const STORAGE_KEY = 'cp-admin-auth';
const AUTH_TOKEN = 'ok';

export function isAuthed() {
  return typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) === AUTH_TOKEN;
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => isAuthed());
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (authed) return <>{children}</>;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (username === USERNAME && password === PASSWORD) {
      localStorage.setItem(STORAGE_KEY, AUTH_TOKEN);
      setAuthed(true);
      return;
    }
    setError('Invalid credentials');
    setPassword('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-shell)]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 space-y-4"
      >
        <div className="flex items-center gap-3 pb-2 border-b border-[var(--border)]">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent)] flex items-center justify-center">
            <Lock size={18} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-[var(--text-primary)]">ClassPulse Admin</div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider">
              Restricted Access
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Username
            </span>
            <input
              type="text"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={e => {
                setUsername(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-shell)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </label>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-shell)] border border-[var(--border)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        {error && (
          <div className="text-[12px] text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
