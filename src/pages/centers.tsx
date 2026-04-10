import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search } from 'lucide-react';
import { useCenters } from '@/hooks/use-admin';

export function CentersPage() {
  const { data: centers, isLoading } = useCenters();
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const list = (centers || []).filter((c: any) =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Centers</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {list.length} center{list.length !== 1 ? 's' : ''} registered
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Name', 'City', 'Plan', 'Students', 'Batches', 'Tests', 'Questions', 'Created'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Building2 size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">No centers found</p>
                </td>
              </tr>
            ) : (
              list.map((c: any) => (
                <tr
                  key={c._id}
                  onClick={() => navigate(`/centers/${c._id}`)}
                  className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-[13px] font-medium text-[var(--text-primary)]">{c.name}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{c.city || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--accent)] bg-opacity-15 text-[var(--accent)]">
                      {c.plan || 'free'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{c.studentCount ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{c.batchCount ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{c.testCount ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{c.questionCount ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
                    {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
