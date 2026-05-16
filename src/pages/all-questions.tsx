import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronDown,
  ChevronUp,
  Building2,
  Globe,
  Sparkles,
  Filter as FilterIcon,
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import {
  useAdminQuestions,
  useAdminQuestionsStats,
  useAdminQuestionsFilterOptions,
  usePatchAdminQuestionReview,
  useCenters,
  useBulkSoftDeleteAdminQuestions,
} from '@/hooks/use-admin';
import type {
  AdminBankQuestion,
  AdminQuestionFilters,
  AdminQuestionScope,
  AdminReviewStatus,
} from '@/hooks/use-admin';
import { QuestionCard } from '@/components/question-card';

const NATURES = ['CONCEPTUAL', 'NUMERICAL', 'FACTUAL', 'APPLICATION'] as const;
const SOURCES = ['ai', 'manual', 'ocr', 'pyq-imported', 'system', 'teacher-upload', 'theory-pdf-upload'] as const;
const REVIEW_STATUSES = ['AUTO_APPROVED', 'NEEDS_REVIEW', 'REJECTED'] as const;
const NCERT_ORIGINS = ['NCERT_TEXT', 'NCERT_EXAMPLE', 'NCERT_EXERCISE', 'NCERT_EXEMPLAR', 'BEYOND_NCERT'] as const;
const COMP_EXAMS = ['JEE', 'NEET', 'BITSAT', 'GUJCET'] as const;
const QUESTION_TYPES = ['mcq', 'subjective'] as const;
const GRADES = [6, 7, 8, 9, 10, 11, 12] as const;

interface CenterRow {
  id: string;
  name: string;
  slug: string;
}

function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div
      className="flex flex-col rounded-xl border border-[var(--border)] px-4 py-3"
      style={{ backgroundColor: `${color}10` }}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
        {label}
      </div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>
        {value}
      </div>
    </div>
  );
}

function SelectChip<T extends string | number>({
  label,
  value,
  options,
  onChange,
  formatOption,
}: {
  label: string;
  value: T | undefined;
  options: readonly T[];
  onChange: (next: T | undefined) => void;
  formatOption?: (v: T) => string;
}) {
  return (
    <label className="flex flex-col gap-1 min-w-[140px]">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--text-tertiary)]">
        {label}
      </span>
      <select
        value={value === undefined ? '' : String(value)}
        onChange={e => {
          const v = e.target.value;
          if (v === '') onChange(undefined);
          else if (typeof options[0] === 'number') onChange(Number(v) as T);
          else onChange(v as T);
        }}
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
      >
        <option value="">Any</option>
        {options.map(opt => (
          <option key={String(opt)} value={String(opt)}>
            {formatOption ? formatOption(opt) : String(opt)}
          </option>
        ))}
      </select>
    </label>
  );
}

function ToggleChip({ label, value, onChange }: { label: string; value: boolean | undefined; onChange: (n: boolean | undefined) => void }) {
  const next = value === undefined ? true : value === true ? false : undefined;
  const display = value === undefined ? 'Any' : value ? 'Yes' : 'No';
  const color = value === undefined ? '#8b8fa3' : value ? '#22c55e' : '#ef4444';
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-[12px] hover:border-[var(--accent)] transition-colors"
      style={{ backgroundColor: `${color}10`, color }}
    >
      <span className="text-[var(--text-tertiary)] font-semibold uppercase tracking-wider text-[10px]">
        {label}
      </span>
      <span className="font-semibold">{display}</span>
    </button>
  );
}

function ReviewStatusDropdown({
  questionId,
  current,
  onChange,
}: {
  questionId: string;
  current: AdminReviewStatus;
  onChange: (next: AdminReviewStatus) => void;
}) {
  const [busy, setBusy] = useState(false);
  const patch = usePatchAdminQuestionReview();
  const colorOf = (s: AdminReviewStatus) =>
    s === 'AUTO_APPROVED' ? '#22c55e' : s === 'NEEDS_REVIEW' ? '#f59e0b' : '#ef4444';
  const handleChange = async (next: AdminReviewStatus) => {
    if (next === current) return;
    setBusy(true);
    try {
      await patch(questionId, next);
      onChange(next);
    } finally {
      setBusy(false);
    }
  };
  return (
    <select
      value={current}
      disabled={busy}
      onChange={e => handleChange(e.target.value as AdminReviewStatus)}
      className="rounded text-[10px] font-semibold uppercase tracking-wider px-2 py-1 border border-transparent focus:outline-none focus:border-[var(--accent)] cursor-pointer disabled:opacity-50"
      style={{ backgroundColor: `${colorOf(current)}1f`, color: colorOf(current) }}
      title="Change review status"
    >
      {REVIEW_STATUSES.map(s => (
        <option key={s} value={s} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
          {s.replace(/_/g, ' ')}
        </option>
      ))}
    </select>
  );
}

function ProvenanceLine({ q }: { q: AdminBankQuestion }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
      {q.centerName ? (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#6366f118] text-[#818cf8] font-semibold">
          <Building2 size={10} />
          {q.centerName}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#06b6d418] text-[#22d3ee] font-semibold">
          <Globe size={10} />
          Global pool
        </span>
      )}
      {q.sourcePdfName && (
        <span className="text-[var(--text-tertiary)] truncate max-w-[260px]" title={q.sourcePdfName}>
          📄 {q.sourcePdfName}
        </span>
      )}
    </div>
  );
}

function questionToParsed(q: AdminBankQuestion, fallbackNumber: number) {
  const optionList = q.options ?? [];
  const letters: Array<'A' | 'B' | 'C' | 'D'> = ['A', 'B', 'C', 'D'];
  const options = optionList.slice(0, 4).map((opt, i) => ({
    letter: letters[i],
    text: opt.text,
  }));
  let correctLetter: 'A' | 'B' | 'C' | 'D' | null = null;
  if (q.correctOption) {
    const idx = optionList.findIndex(o => o.id === q.correctOption || o.text === q.correctOption);
    if (idx >= 0 && idx < 4) correctLetter = letters[idx];
    else if (/^[A-D]$/i.test(q.correctOption)) {
      correctLetter = q.correctOption.toUpperCase() as 'A' | 'B' | 'C' | 'D';
    }
  }
  return {
    number: q.sourcePage ?? fallbackNumber,
    stem: q.questionText,
    options,
    correctLetter,
    answerSource: q.answerSource,
    tags: {
      subject: q.subject,
      topic: q.topic,
      subTopic: q.subTopic,
      difficulty: q.difficulty,
      board: q.board,
      competitiveExamRelevance: q.competitiveExamRelevance,
      isPyq: q.isPyq,
      pyqExam: q.pyqExam,
      pyqYear: q.pyqYear,
      nature: q.nature,
      ncertOrigin: q.ncertOrigin,
      ncertChapter: q.ncertChapter,
      ncertTopic: q.ncertTopic,
      grade: q.grade,
      appearanceCount: q.appearanceCount,
      teacherRating: q.teacherRating,
      reviewStatus: q.reviewStatus,
      confidenceScore: q.confidenceScore,
    },
  };
}

export function AllQuestionsPage() {
  const [filters, setFilters] = useState<AdminQuestionFilters>({ scope: 'all' });
  const [searchDraft, setSearchDraft] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [reviewStatusOverrides, setReviewStatusOverrides] = useState<Record<string, AdminReviewStatus>>({});

  // Bulk-select + bulk-soft-delete state.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const bulkDelete = useBulkSoftDeleteAdminQuestions();
  const toggleSelect = (id: string) =>
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelectedIds(new Set());

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(prev =>
        prev.search === (searchDraft || undefined)
          ? prev
          : { ...prev, search: searchDraft || undefined },
      );
    }, 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  const { data: centers } = useCenters() as { data: CenterRow[] | undefined };
  const { data: filterOptions } = useAdminQuestionsFilterOptions();
  const stats = useAdminQuestionsStats(filters);
  const questions = useAdminQuestions(filters);

  const joyCenterId = useMemo(
    () => centers?.find(c => c.slug === 'joy-institute' || c.slug === 'joy')?.id,
    [centers],
  );

  const items = useMemo(
    () => questions.data?.pages.flatMap(p => p.items) ?? [],
    [questions.data],
  );

  const set = <K extends keyof AdminQuestionFilters>(key: K, value: AdminQuestionFilters[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const applyScope = (scope: AdminQuestionScope, centerId?: string) =>
    setFilters(prev => ({ ...prev, scope, centerId }));

  const reset = () => {
    setSearchDraft('');
    setFilters({ scope: filters.scope, centerId: filters.centerId });
  };

  const topicsForSubject = useMemo(() => {
    if (!filterOptions) return [];
    if (!filters.subject) return filterOptions.topics.map(t => t.topic);
    return filterOptions.topics
      .filter(t => t.subject === filters.subject)
      .map(t => t.topic);
  }, [filterOptions, filters.subject]);

  const ncertChaptersForSubject = useMemo(() => {
    if (!filterOptions) return [];
    if (!filters.subject) return filterOptions.ncertChapters.map(t => t.chapter);
    return filterOptions.ncertChapters
      .filter(t => t.subject === filters.subject)
      .map(t => t.chapter);
  }, [filterOptions, filters.subject]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">All Questions</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Cross-tenant question library · live filters re-compute the counts below
          </p>
        </div>
        <button
          onClick={() => questions.refetch()}
          disabled={questions.isFetching}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={questions.isFetching ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Scope tabs */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ScopeTab
          label="All centers"
          active={filters.scope === 'all'}
          onClick={() => applyScope('all')}
          icon={<Sparkles size={14} />}
        />
        <ScopeTab
          label="Joy Institute"
          active={filters.scope === 'center' && filters.centerId === joyCenterId}
          onClick={() => joyCenterId && applyScope('center', joyCenterId)}
          icon={<Building2 size={14} />}
          disabled={!joyCenterId}
        />
        <ScopeTab
          label="Global pool"
          active={filters.scope === 'global'}
          onClick={() => applyScope('global')}
          icon={<Globe size={14} />}
        />
        <select
          value={
            filters.scope === 'center' && filters.centerId !== joyCenterId
              ? filters.centerId ?? ''
              : ''
          }
          onChange={e => {
            const id = e.target.value;
            if (id) applyScope('center', id);
          }}
          className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg px-3 py-2 text-[12px] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="">Pick a center…</option>
          {(centers ?? [])
            .filter(c => c.id !== joyCenterId)
            .map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
        </select>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <StatPill
          label="Showing (filtered)"
          value={stats.data?.filteredTotal ?? '—'}
          color="#6366f1"
        />
        <StatPill label="Total in DB" value={stats.data?.totalAll ?? '—'} color="#22c55e" />
        <StatPill label="Global pool" value={stats.data?.totalGlobal ?? '—'} color="#22d3ee" />
        <StatPill
          label="Centers w/ qbank"
          value={stats.data?.byCenter?.filter(c => c.centerId !== null).length ?? '—'}
          color="#f59e0b"
        />
      </div>

      {/* Search */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2 bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg px-3 py-2">
            <Search size={14} className="text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search question text…"
              value={searchDraft}
              onChange={e => setSearchDraft(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)]"
            />
          </div>
          <button
            onClick={() => setAdvancedOpen(o => !o)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-[var(--bg-shell)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <FilterIcon size={13} />
            Filters
            {advancedOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          <button
            onClick={reset}
            className="px-3 py-2 rounded-lg text-[12px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Reset
          </button>
        </div>

        {advancedOpen && (
          <div className="mt-4 pt-4 border-t border-[var(--border)] flex flex-wrap gap-3">
            <SelectChip
              label="Subject"
              value={filters.subject}
              options={(filterOptions?.subjects ?? []) as readonly string[]}
              onChange={v => set('subject', v as string | undefined)}
            />
            <SelectChip
              label="Topic"
              value={filters.topic}
              options={topicsForSubject as readonly string[]}
              onChange={v => set('topic', v as string | undefined)}
            />
            <SelectChip
              label="Grade"
              value={filters.grade}
              options={GRADES}
              onChange={v => set('grade', v as number | undefined)}
            />
            <SelectChip
              label="Board"
              value={filters.board}
              options={(filterOptions?.boards ?? []) as readonly string[]}
              onChange={v => set('board', v as string | undefined)}
            />
            <SelectChip
              label="Type"
              value={filters.questionType}
              options={QUESTION_TYPES}
              onChange={v => set('questionType', v as 'mcq' | 'subjective' | undefined)}
            />
            <SelectChip
              label="Nature"
              value={filters.nature}
              options={NATURES}
              onChange={v => set('nature', v)}
            />
            <SelectChip
              label="Source"
              value={filters.source}
              options={SOURCES}
              onChange={v => set('source', v as string | undefined)}
            />
            <SelectChip
              label="Review"
              value={filters.reviewStatus}
              options={REVIEW_STATUSES}
              onChange={v => set('reviewStatus', v as AdminReviewStatus | undefined)}
              formatOption={s => s.replace(/_/g, ' ')}
            />
            <SelectChip
              label="Comp. exam"
              value={filters.competitiveExam}
              options={COMP_EXAMS}
              onChange={v => set('competitiveExam', v as string | undefined)}
            />
            <SelectChip
              label="PYQ exam"
              value={filters.pyqExam}
              options={(filterOptions?.pyqExams ?? []) as readonly string[]}
              onChange={v => set('pyqExam', v as string | undefined)}
            />
            <SelectChip
              label="PYQ year"
              value={filters.pyqYear}
              options={(filterOptions?.pyqYears ?? []) as readonly string[]}
              onChange={v => set('pyqYear', v as string | undefined)}
            />
            <SelectChip
              label="NCERT origin"
              value={filters.ncertOrigin}
              options={NCERT_ORIGINS}
              onChange={v => set('ncertOrigin', v as string | undefined)}
              formatOption={s => s.replace(/_/g, ' ')}
            />
            <SelectChip
              label="NCERT chapter"
              value={filters.ncertChapter}
              options={ncertChaptersForSubject as readonly string[]}
              onChange={v => set('ncertChapter', v as string | undefined)}
            />
            <ToggleChip
              label="Is PYQ"
              value={filters.isPyq}
              onChange={v => set('isPyq', v)}
            />
            <ToggleChip
              label="Has image"
              value={filters.hasImages}
              onChange={v => set('hasImages', v)}
            />
          </div>
        )}
      </div>

      {/* Subject breakdown — only if filter applied changes layout */}
      {stats.data && stats.data.bySubject.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4 px-1">
          {stats.data.bySubject.map(s => (
            <span
              key={s.subject}
              className="px-2 py-0.5 rounded-full bg-[#6366f120] text-[#a5b4fc] text-[10px] font-bold uppercase tracking-wide"
            >
              {s.subject} · {s.count}
            </span>
          ))}
          {/* byDifficulty intentionally removed — we no longer surface difficulty
              as a user-facing axis. Exam-tier breakdown (JEE / NEET / Boards) lives
              in the stats endpoint and can be added here later if useful. */}
        </div>
      )}

      {/* Question list */}
      {questions.isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : questions.error ? (
        <div className="bg-[var(--bg-card)] border border-red-500/30 rounded-xl px-4 py-12 text-center text-sm text-red-400">
          Failed to load questions
        </div>
      ) : items.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl px-4 py-12 text-center">
          <ImageIcon size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">No questions match the current filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q, i) => {
            const currentReview = reviewStatusOverrides[q.id] ?? q.reviewStatus;
            const isSelected = selectedIds.has(q.id);
            return (
              <div
                key={q.id}
                className={`bg-[var(--bg-card)] border rounded-xl p-4 transition-colors ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--bg-card-hover)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(q.id)}
                      className="mt-0.5 h-4 w-4 cursor-pointer accent-[var(--accent)]"
                      aria-label={`Select question ${q.id.slice(0, 8)}`}
                    />
                    <ProvenanceLine q={q} />
                  </div>
                  <ReviewStatusDropdown
                    questionId={q.id}
                    current={currentReview}
                    onChange={next =>
                      setReviewStatusOverrides(prev => ({ ...prev, [q.id]: next }))
                    }
                  />
                </div>
                <QuestionCard
                  q={questionToParsed(q, i + 1)}
                  questionId={q.id}
                  imageUrl={q.figureS3Url}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {items.length > 0 && (
        <div className="flex items-center justify-center mt-6">
          {questions.hasNextPage ? (
            <button
              onClick={() => questions.fetchNextPage()}
              disabled={questions.isFetchingNextPage}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white text-[13px] font-semibold transition-colors disabled:opacity-50"
            >
              {questions.isFetchingNextPage ? 'Loading…' : 'Load more'}
              {stats.data && (
                <span className="text-[11px] opacity-80 font-normal">
                  · {items.length} of {stats.data.filteredTotal} shown
                </span>
              )}
            </button>
          ) : (
            <span className="text-[12px] text-[var(--text-tertiary)]">
              All {items.length} question{items.length === 1 ? '' : 's'} loaded
            </span>
          )}
        </div>
      )}

      {/* Bulk-action bar — sticky at the bottom when 1+ row is selected. */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] shadow-2xl">
          <span className="text-[13px] font-semibold text-[var(--text-primary)]">
            {selectedIds.size} selected
          </span>
          <button
            onClick={clearSelection}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X size={12} />
            Clear
          </button>
          <button
            onClick={() => setConfirmDeleteOpen(true)}
            disabled={bulkDelete.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50"
          >
            <Trash2 size={12} />
            Soft-delete {selectedIds.size}
          </button>
        </div>
      )}

      {/* Confirm modal */}
      {confirmDeleteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => !bulkDelete.isPending && setConfirmDeleteOpen(false)}
        >
          <div
            className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Soft-delete {selectedIds.size} question{selectedIds.size === 1 ? '' : 's'}?
            </h3>
            <p className="text-[13px] text-[var(--text-secondary)] mb-4 leading-relaxed">
              They'll be hidden from teachers and students immediately. Rows stay in
              the database (reversible by clearing <code className="text-[11px] px-1 rounded bg-[var(--bg-shell)]">deleted_at</code> via
              SQL). Cap: 5,000 per call — the server will return 400 otherwise.
            </p>
            {bulkDelete.error && (
              <div className="text-[12px] text-red-400 mb-3">
                {(bulkDelete.error as Error).message}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={bulkDelete.isPending}
                className="px-3 py-1.5 rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const ids = Array.from(selectedIds);
                    await bulkDelete.mutateAsync(ids);
                    clearSelection();
                    setConfirmDeleteOpen(false);
                  } catch {
                    // error stays shown in the modal via bulkDelete.error
                  }
                }}
                disabled={bulkDelete.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} />
                {bulkDelete.isPending ? 'Deleting…' : 'Soft-delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScopeTab({
  label,
  active,
  onClick,
  icon,
  disabled,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? 'bg-[var(--accent)] text-white'
          : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
