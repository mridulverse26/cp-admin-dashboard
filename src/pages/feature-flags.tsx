import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, AlertTriangle, ToggleLeft } from 'lucide-react';
import {
  useFeatureFlagSummaries,
  type CenterFlagsSummary,
} from '@/hooks/use-admin';

type DisabledFilter = 'all' | 'any-disabled' | 'all-on';

function formatTimeAgo(dateInput: string | null): string {
  if (!dateInput) return 'never';
  const date = new Date(dateInput);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

function disabledSummary(s: CenterFlagsSummary): string {
  if (s.disabledModules.length === 0) return '';
  if (s.disabledModules.length <= 3) {
    return s.disabledModules.join(', ');
  }
  return `${s.disabledModules.slice(0, 3).join(', ')} +${s.disabledModules.length - 3} more`;
}

export function FeatureFlagsPage() {
  const { data, isLoading, error } = useFeatureFlagSummaries();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DisabledFilter>('all');

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      if (q && !c.centerName.toLowerCase().includes(q) && !c.centerSlug.toLowerCase().includes(q)) {
        return false;
      }
      if (filter === 'any-disabled' && c.disabledModules.length === 0) return false;
      if (filter === 'all-on' && c.disabledModules.length > 0) return false;
      return true;
    });
  }, [data, search, filter]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Feature Flags</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Per-tenant module toggles. Disabling a module hides it in the customer app and blocks the backend endpoints.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-[420px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" size={14} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search centers by name or slug..."
            className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as DisabledFilter)}
          className="px-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">All centers</option>
          <option value="any-disabled">Any module off</option>
          <option value="all-on">Everything on</option>
        </select>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-32 text-[var(--text-secondary)] text-sm">
          Loading centers…
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-300">Failed to load</div>
            <div className="text-xs text-red-300/80 mt-1">{(error as Error)?.message ?? 'Unknown error'}</div>
          </div>
        </div>
      )}

      {data && (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
          {filtered.length === 0 ? (
            <div className="px-6 py-12 text-center text-sm text-[var(--text-tertiary)]">
              No centers match this filter.
            </div>
          ) : (
            filtered.map((c) => (
              <Link
                key={c.centerId}
                to={`/feature-flags/${c.centerId}`}
                className="flex items-center gap-4 px-5 py-4 border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center shrink-0">
                  <ToggleLeft size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {c.centerName}
                  </div>
                  <div className="text-xs text-[var(--text-tertiary)] mt-0.5 truncate">
                    {c.centerSlug}
                    {c.disabledModules.length > 0 && (
                      <span className="ml-2 text-amber-400">· disabled: {disabledSummary(c)}</span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`text-sm font-semibold ${
                      c.disabledModules.length === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {c.enabledCount}/{c.totalCount} on
                  </div>
                  <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">
                    {c.lastChange ? `by ${c.lastChange.changedBy} · ${formatTimeAgo(c.lastChange.createdAt)}` : 'never changed'}
                  </div>
                </div>
                <ChevronRight size={16} className="text-[var(--text-tertiary)] shrink-0" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
