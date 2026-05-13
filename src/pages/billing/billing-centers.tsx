import { Link } from 'react-router-dom';
import { Building2, ChevronRight, Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useCenters } from '@/hooks/use-admin';

interface AdminCenter {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  plan: string;
  isActive: boolean;
  studentCount?: number;
}

export default function BillingCentersPage() {
  const { data, isLoading } = useCenters();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const list = ((data as AdminCenter[] | undefined) ?? []) as AdminCenter[];
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.city ?? '').toLowerCase().includes(q),
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)] flex items-center gap-2">
          <Building2 size={20} /> Tenant Billing
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Pick a tenant to view and edit their subscription. Per-student rate and feature access are admin-controlled.
        </p>
      </div>

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, slug, or city"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">Loading…</div>
      ) : (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)]">
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center text-sm text-[var(--text-tertiary)]">No matches</div>
          )}
          {filtered.map((c) => (
            <Link
              key={c.id}
              to={`/billing/centers/${c.slug}`}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-card-hover)] group"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-[var(--text-primary)]">{c.name}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  {c.slug} {c.city ? `· ${c.city}` : ''}
                </div>
              </div>
              <div className="text-xs px-2 py-0.5 rounded bg-[var(--bg-shell)] text-[var(--text-secondary)] border border-[var(--border)]">
                {c.plan}
              </div>
              <ChevronRight size={16} className="text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
