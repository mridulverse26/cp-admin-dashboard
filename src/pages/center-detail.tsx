import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Building2, Users, BookOpen, FileText } from 'lucide-react';
import { useCenterDetail } from '@/hooks/use-admin';

export function CenterDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: center, isLoading } = useCenterDetail(id || '');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!center) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <Building2 size={40} className="mb-3 text-[var(--text-tertiary)]" />
        <p className="text-sm text-[var(--text-secondary)]">Center not found</p>
        <button
          onClick={() => navigate('/centers')}
          className="mt-4 px-4 py-2 text-sm rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors"
        >
          Back to Centers
        </button>
      </div>
    );
  }

  const c = center;

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate('/centers')}
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-5"
      >
        <ArrowLeft size={16} />
        Back to Centers
      </button>

      {/* Center Info Card */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">{c.name}</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">{c.city || 'No city'}</p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-medium bg-[var(--accent)] bg-opacity-15 text-[var(--accent)]">
            {c.plan || 'free'}
          </span>
        </div>
        <div className="grid grid-cols-4 gap-4 mt-5">
          {[
            { label: 'Students', value: c.studentCount ?? 0, icon: Users },
            { label: 'Batches', value: c.batchCount ?? 0, icon: BookOpen },
            { label: 'Tests', value: c.testCount ?? 0, icon: FileText },
            { label: 'Created', value: c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '-', icon: Building2 },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[var(--accent)] bg-opacity-10 flex items-center justify-center">
                <s.icon size={16} className="text-[var(--accent)]" />
              </div>
              <div>
                <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider">{s.label}</div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Students</h3>
        </div>
        {(c.students || []).length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">No students enrolled</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                {['Name', 'Phone', 'XP', 'Level', 'League'].map(h => (
                  <th key={h} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(c.students || []).map((s: any) => (
                <tr key={s._id} className="border-b border-[var(--border)] last:border-b-0">
                  <td className="px-4 py-2.5 text-[13px] font-medium text-[var(--text-primary)]">{s.name}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--text-secondary)]">{s.phone || '-'}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--amber)]">{s.xp ?? 0}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--text-secondary)]">{s.level ?? 1}</td>
                  <td className="px-4 py-2.5 text-[13px] text-[var(--text-secondary)]">{s.league || 'Bronze'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Batches */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={16} className="text-[var(--green)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Batches</h3>
        </div>
        {(c.batches || []).length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">No batches created</p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {(c.batches || []).map((b: any) => (
              <div key={b._id} className="border border-[var(--border)] rounded-lg p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                <div className="text-sm font-medium text-[var(--text-primary)]">{b.name}</div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">{b.subject || 'General'}</div>
                <div className="text-xs text-[var(--text-tertiary)] mt-2">{b.studentCount ?? 0} students</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tests */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText size={16} className="text-[var(--blue)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Tests</h3>
        </div>
        {(c.tests || []).length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)] py-6 text-center">No tests created</p>
        ) : (
          <div className="space-y-2">
            {(c.tests || []).map((t: any) => (
              <div key={t._id} className="flex items-center justify-between border border-[var(--border)] rounded-lg px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)]">{t.title}</div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5">{t.type || 'quiz'} &middot; {t.questionCount ?? 0} questions</div>
                </div>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '-'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
