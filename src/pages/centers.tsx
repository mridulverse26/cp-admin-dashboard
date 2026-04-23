import { useMemo, useState } from 'react';
import { Building2, ChevronRight, Search, User, AlertTriangle } from 'lucide-react';
import { useCentersWithStudents } from '@/hooks/use-admin';
import type { AdminCenterWithStudents, AdminStudentRow } from '@/hooks/use-admin';

const DB_HOST = 'classpulse-db.c7uw4a2mckbn.ap-south-1.rds.amazonaws.com';
const DB_NAME = 'classpulse';

function ProdBanner() {
  return (
    <div className="mb-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 flex items-center gap-3">
      <AlertTriangle size={18} className="text-red-400 shrink-0" />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="font-bold uppercase tracking-wider text-red-300">
          Production Environment
        </span>
        <span className="text-[var(--text-secondary)]">
          <span className="text-[var(--text-tertiary)]">DB host:</span>{' '}
          <code className="font-mono text-[var(--text-primary)]">{DB_HOST}</code>
        </span>
        <span className="text-[var(--text-secondary)]">
          <span className="text-[var(--text-tertiary)]">Database:</span>{' '}
          <code className="font-mono text-[var(--text-primary)]">{DB_NAME}</code>
        </span>
      </div>
    </div>
  );
}

function AvatarCell({ src, name }: { src: string | null; name: string | null }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className="w-8 h-8 rounded-full object-cover bg-[var(--bg-card-hover)]"
        onError={e => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center text-[11px] font-semibold text-[var(--text-secondary)]">
      {initial}
    </div>
  );
}

function StudentsTable({ students }: { students: AdminStudentRow[] }) {
  if (students.length === 0) {
    return (
      <div className="px-6 py-6 text-center text-[12px] text-[var(--text-tertiary)]">
        No students in this center yet
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-[var(--bg-card-hover)]/40">
            {['', 'Name', 'Phone', 'Email', 'Class', 'Exam', 'XP', 'Streak', 'Joined'].map(h => (
              <th
                key={h || 'avatar'}
                className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="border-t border-[var(--border)]">
              <td className="px-4 py-2 w-10">
                <AvatarCell src={s.avatar} name={s.name} />
              </td>
              <td className="px-4 py-2 text-[12px] font-medium text-[var(--text-primary)]">
                {s.name || '—'}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)] font-mono">
                {s.phone}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {s.email || '—'}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {s.grade || '—'}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {s.targetExam || '—'}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {s.xp ?? 0}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {s.currentStreak ?? 0}
              </td>
              <td className="px-4 py-2 text-[12px] text-[var(--text-secondary)]">
                {new Date(s.createdAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CenterRow({
  center,
  expanded,
  onToggle,
}: {
  center: AdminCenterWithStudents;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-[var(--border)] hover:bg-[var(--bg-card-hover)] cursor-pointer transition-colors"
      >
        <td className="pl-4 pr-2 py-3 w-8">
          <ChevronRight
            size={16}
            className={`text-[var(--text-tertiary)] transition-transform ${
              expanded ? 'rotate-90' : ''
            }`}
          />
        </td>
        <td className="px-2 py-3 w-12">
          <AvatarCell src={center.logoUrl} name={center.name} />
        </td>
        <td className="px-4 py-3">
          <div className="text-[13px] font-semibold text-[var(--text-primary)]">
            {center.name}
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] font-mono">
            {center.slug}
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {center.ownerName || '—'}
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)] font-mono">
          {center.ownerPhone || '—'}
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {center.ownerEmail || '—'}
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {center.city || '—'}
        </td>
        <td className="px-4 py-3">
          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[var(--accent)]/15 text-[var(--accent)]">
            {center.plan || 'free'}
          </span>
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {center.studentCount}
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {new Date(center.createdAt).toLocaleDateString()}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--border)]">
          <td colSpan={10} className="bg-[var(--bg-shell)] p-0">
            <div className="px-4 py-3 border-l-2 border-[var(--accent)]/40">
              <div className="flex items-center gap-2 mb-2 text-[11px] uppercase tracking-wider text-[var(--text-tertiary)]">
                <User size={12} />
                Students ({center.students.length})
              </div>
              <StudentsTable students={center.students} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function CentersPage() {
  const { data: centers, isLoading, error } = useCentersWithStudents();
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!centers) return [];
    const q = search.trim().toLowerCase();
    if (!q) return centers;
    return centers.filter(
      c =>
        c.name?.toLowerCase().includes(q) ||
        c.slug?.toLowerCase().includes(q) ||
        c.city?.toLowerCase().includes(q) ||
        c.ownerName?.toLowerCase().includes(q) ||
        c.ownerPhone?.includes(q) ||
        c.ownerEmail?.toLowerCase().includes(q),
    );
  }, [centers, search]);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <ProdBanner />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Centers</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {filtered.length} center{filtered.length !== 1 ? 's' : ''} · click a row to see students
          </p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]"
        />
        <input
          type="text"
          placeholder="Search by name, slug, city, owner..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center text-sm text-red-400">
            Failed to load centers
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="w-8" />
                <th className="w-12" />
                {['Center', 'Owner', 'Phone', 'Email', 'City', 'Plan', 'Students', 'Created'].map(
                  h => (
                    <th
                      key={h}
                      className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <Building2 size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">No centers found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <CenterRow
                    key={c.id}
                    center={c}
                    expanded={expanded.has(c.id)}
                    onToggle={() => toggle(c.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
