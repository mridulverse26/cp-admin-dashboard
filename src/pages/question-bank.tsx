import { useEffect, useState } from 'react';
import {
  ChevronRight,
  FileText,
  Download,
  Eye,
  ListChecks,
  Building2,
  RefreshCw,
  X,
  Check,
  Sparkles,
  KeyRound,
} from 'lucide-react';
import {
  useQuestionBankPdfs,
  useQuestionBankBreakdown,
  syncQuestionBank,
  fetchQuestionBankPdfUrl,
  fetchQuestionBankPdfQuestions,
} from '@/hooks/use-admin';
import type {
  QuestionBankCenterGroup,
  QuestionBankPdf,
  ParsedMcq,
  ParsedMcqTags,
  ParsedQuestionsResponse,
} from '@/hooks/use-admin';

function formatSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const PROCESSING_STEP_LABELS: Record<string, string> = {
  queued: 'Queued',
  extracting_text: 'Extracting text',
  detecting_structure: 'Detecting structure',
  extracting_questions: 'Extracting questions',
  predicting_answers: 'Predicting answers',
  tagging: 'Tagging',
  self_review: 'Self-review',
  deduping: 'Dedup',
  saving: 'Saving',
  done: 'Done',
};

function StatusPill({ pdf }: { pdf: QuestionBankPdf }) {
  const styles: Record<QuestionBankPdf['status'], string> = {
    UPLOADED: 'bg-[#6366f118] text-[#818cf8]',
    PROCESSING: 'bg-[#f59e0b18] text-[#f59e0b]',
    PARSED: 'bg-[#22c55e18] text-[#22c55e]',
    NEEDS_REVIEW: 'bg-[#a855f718] text-[#c084fc]',
    FAILED: 'bg-[#ef444418] text-[#ef4444]',
  };
  const labels: Record<QuestionBankPdf['status'], string> = {
    UPLOADED: 'Not processed',
    PROCESSING: 'Processing',
    PARSED: 'Parsed',
    NEEDS_REVIEW: 'Needs review',
    FAILED: 'Failed',
  };
  const stepLabel =
    pdf.status === 'PROCESSING' && pdf.processingStep
      ? PROCESSING_STEP_LABELS[pdf.processingStep] ?? pdf.processingStep
      : null;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[pdf.status]}`}
      title={pdf.processingError ?? undefined}
    >
      {stepLabel ? `${labels[pdf.status]} · ${stepLabel}` : labels[pdf.status]}
    </span>
  );
}

function PdfPreviewModal({ pdf, onClose }: { pdf: QuestionBankPdf; onClose: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionBankPdfUrl(pdf.id)
      .then(r => {
        if (!cancelled) setUrl(r.url);
      })
      .catch(e => {
        if (!cancelled) setError(e?.message ?? 'Failed to load preview');
      });
    return () => {
      cancelled = true;
    };
  }, [pdf.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onClose}>
      <div
        className="relative w-full max-w-5xl h-[85vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 min-w-0">
            <FileText size={16} className="text-[var(--text-secondary)] shrink-0" />
            <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{pdf.originalName}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 bg-[var(--bg-shell)]">
          {error ? (
            <div className="flex items-center justify-center h-full text-sm text-red-400">{error}</div>
          ) : !url ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <iframe src={url} className="w-full h-full" title={pdf.originalName} />
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerSourceBadge({ source }: { source: 'key' | 'ai' | 'manual' | null }) {
  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-shell)] text-[var(--text-tertiary)]">
        no answer
      </span>
    );
  }
  const styles = {
    key: { bg: 'bg-[#22c55e18]', fg: 'text-[#22c55e]', Icon: KeyRound, label: 'Answer key' },
    ai: { bg: 'bg-[#f59e0b18]', fg: 'text-[#f59e0b]', Icon: Sparkles, label: 'AI predicted' },
    manual: { bg: 'bg-[#6366f118]', fg: 'text-[#818cf8]', Icon: Check, label: 'Manual' },
  }[source];
  const Icon = styles.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${styles.bg} ${styles.fg}`}>
      <Icon size={10} />
      {styles.label}
    </span>
  );
}

function Tag({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
      style={{ backgroundColor: `${color}1f`, color }}
    >
      <span className="text-[var(--text-tertiary)]">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}

function TagsRow({ tags }: { tags: ParsedMcqTags }) {
  const items: { label: string; value: string | number; color: string }[] = [];
  const diffColor =
    tags.difficulty === 'EASY' ? '#22c55e' : tags.difficulty === 'HARD' ? '#ef4444' : '#f59e0b';

  if (tags.subject) items.push({ label: 'Subject', value: tags.subject, color: '#818cf8' });
  if (tags.topic) items.push({ label: 'Topic', value: tags.topic, color: '#818cf8' });
  if (tags.subTopic) items.push({ label: 'Sub-topic', value: tags.subTopic, color: '#a78bfa' });
  if (tags.difficulty) items.push({ label: 'Difficulty', value: tags.difficulty, color: diffColor });
  if (tags.board) items.push({ label: 'Board', value: tags.board, color: '#22c55e' });
  if (tags.grade) items.push({ label: 'Grade', value: tags.grade, color: '#22c55e' });
  if (tags.nature) items.push({ label: 'Nature', value: tags.nature, color: '#06b6d4' });
  if (tags.ncertOrigin) items.push({ label: 'NCERT', value: tags.ncertOrigin.replace(/_/g, ' '), color: '#06b6d4' });
  if (tags.ncertChapter) items.push({ label: 'Chapter', value: tags.ncertChapter, color: '#06b6d4' });
  if (tags.competitiveExamRelevance && tags.competitiveExamRelevance.length > 0) {
    items.push({ label: 'Exams', value: tags.competitiveExamRelevance.join(', '), color: '#f59e0b' });
  }
  if (tags.isPyq) {
    const pyqLabel = [tags.pyqExam, tags.pyqYear].filter(Boolean).join(' ') || 'Yes';
    items.push({ label: 'PYQ', value: pyqLabel, color: '#ec4899' });
  }
  if (tags.appearanceCount && tags.appearanceCount > 1) {
    items.push({ label: 'Repeats', value: `${tags.appearanceCount}×`, color: '#ec4899' });
  }
  if (tags.teacherRating && tags.teacherRating > 0) {
    items.push({ label: 'Rated', value: `${tags.teacherRating}★`, color: '#fbbf24' });
  }
  if (tags.confidenceScore !== null && tags.confidenceScore !== undefined) {
    items.push({ label: 'Confidence', value: `${Math.round(tags.confidenceScore * 100)}%`, color: '#94a3b8' });
  }
  if (tags.reviewStatus && tags.reviewStatus !== 'AUTO_APPROVED') {
    items.push({ label: 'Review', value: tags.reviewStatus.replace(/_/g, ' '), color: '#f59e0b' });
  }

  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-[var(--border)]">
      {items.map((it, i) => (
        <Tag key={i} label={it.label} value={it.value} color={it.color} />
      ))}
    </div>
  );
}

function QuestionCard({ q }: { q: ParsedMcq }) {
  return (
    <div className="bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
            Q{q.number}
          </span>
          <AnswerSourceBadge source={q.answerSource} />
        </div>
      </div>
      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed mb-3 whitespace-pre-wrap">
        {q.stem}
      </div>
      <div className="space-y-1.5">
        {q.options.map(opt => {
          const isCorrect = q.correctLetter === opt.letter;
          return (
            <div
              key={opt.letter}
              className={`flex items-start gap-2 px-3 py-2 rounded border text-[12px] ${
                isCorrect
                  ? 'bg-[#22c55e12] border-[#22c55e40] text-[var(--text-primary)]'
                  : 'bg-transparent border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              <span
                className={`font-semibold min-w-[18px] ${
                  isCorrect ? 'text-[#22c55e]' : 'text-[var(--text-tertiary)]'
                }`}
              >
                {opt.letter}.
              </span>
              <span className="flex-1">{opt.text}</span>
              {isCorrect && <Check size={13} className="text-[#22c55e] shrink-0 mt-0.5" />}
            </div>
          );
        })}
      </div>
      {q.tags && <TagsRow tags={q.tags} />}
    </div>
  );
}

function QuestionsModal({ pdfId, onClose }: { pdfId: string; onClose: () => void }) {
  const [data, setData] = useState<ParsedQuestionsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchQuestionBankPdfQuestions(pdfId)
      .then(r => {
        if (!cancelled) setData(r);
      })
      .catch(e => {
        if (!cancelled) setError(e?.message ?? 'Failed to load questions');
      });
    return () => {
      cancelled = true;
    };
  }, [pdfId]);

  const counts = (() => {
    if (!data) return { key: 0, ai: 0, none: 0 };
    let key = 0,
      ai = 0,
      none = 0;
    for (const q of data.questions) {
      if (q.answerSource === 'key') key++;
      else if (q.answerSource === 'ai') ai++;
      else none++;
    }
    return { key, ai, none };
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[var(--border)] shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <ListChecks size={15} className="text-[var(--accent)] shrink-0" />
              <span className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
                {data?.file || 'Loading…'}
              </span>
            </div>
            {data && (
              <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
                {data.topic && <span>Topic: {data.topic}</span>}
                <span>{data.questions.length} questions</span>
                {counts.key > 0 && (
                  <span className="text-[#22c55e]">
                    {counts.key} from key
                  </span>
                )}
                {counts.ai > 0 && (
                  <span className="text-[#f59e0b]">
                    {counts.ai} AI-predicted
                  </span>
                )}
                {counts.none > 0 && (
                  <span className="text-[var(--text-tertiary)]">
                    {counts.none} no answer
                  </span>
                )}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {error ? (
            <div className="py-10 text-center text-sm text-red-400">{error}</div>
          ) : !data ? (
            <div className="py-10 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data.questions.length === 0 && data.skipped.length === 0 ? (
            <div className="py-10 text-center text-sm text-[var(--text-tertiary)]">
              No questions parsed from this PDF yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.skipped.length > 0 && (
                <details className="rounded-lg border border-[#f59e0b30] bg-[#f59e0b08] p-3">
                  <summary className="cursor-pointer text-[12px] font-semibold text-[#f59e0b]">
                    ⚠ {data.skipped.length} question{data.skipped.length === 1 ? '' : 's'} skipped during parsing
                  </summary>
                  <div className="mt-2 space-y-1">
                    {data.skipped.map((s, i) => (
                      <div
                        key={i}
                        className="text-[11px] text-[var(--text-secondary)] flex items-start gap-2"
                      >
                        <span className="font-mono text-[var(--text-tertiary)] shrink-0">
                          {s.number != null ? `Q${s.number}` : '—'}
                        </span>
                        <span className="flex-1">{s.reason}</span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
              {data.questions.map(q => (
                <QuestionCard key={`${q.number}-${q.stem.slice(0, 30)}`} q={q} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PdfsTable({ pdfs }: { pdfs: QuestionBankPdf[] }) {
  const [previewPdf, setPreviewPdf] = useState<QuestionBankPdf | null>(null);
  const [questionsPdfId, setQuestionsPdfId] = useState<string | null>(null);

  const openDownload = async (pdf: QuestionBankPdf) => {
    try {
      const { url } = await fetchQuestionBankPdfUrl(pdf.id);
      window.open(url, '_blank');
    } catch {
      // signed URL fetch error surfaces via browser tab
    }
  };

  if (pdfs.length === 0) {
    return (
      <div className="px-4 py-10 text-center text-[12px] text-[var(--text-tertiary)]">
        No PDFs uploaded for this center yet
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[var(--bg-card-hover)]/40">
              {['File', 'Topic', 'Size', 'Pages', 'Found', 'Parsed', 'Inserted', 'Status', 'Uploaded', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pdfs.map(pdf => (
              <tr key={pdf.id} className={`border-t border-[var(--border)] ${pdf.status === 'FAILED' ? 'bg-[#ef44440a]' : ''}`}>
                <td className="px-4 py-2.5 text-[12px] font-medium text-[var(--text-primary)]">
                  <div className="flex items-start gap-2">
                    <FileText size={13} className="text-[var(--text-tertiary)] shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <div className="truncate">{pdf.originalName}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5 text-[10px] text-[var(--text-tertiary)]">
                        {pdf.uploadSource === 'teacher' ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#22c55e15] text-[#22c55e] font-semibold">Teacher</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-[#6366f115] text-[#818cf8] font-semibold">Admin sync</span>
                        )}
                        {pdf.subject && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--bg-card-hover)] text-[var(--text-secondary)] uppercase">
                            {pdf.subject}
                          </span>
                        )}
                        {pdf.folderName && (
                          <span className="text-[var(--text-tertiary)]">📁 {pdf.folderName}</span>
                        )}
                        {pdf.uploadedByName && (
                          <span className="text-[var(--text-tertiary)]">by {pdf.uploadedByName}</span>
                        )}
                      </div>
                      {pdf.status === 'FAILED' && pdf.processingError && (
                        <div className="mt-1 px-2 py-1 rounded bg-[#ef444415] text-[10px] text-[#ef4444] max-w-[420px]">
                          ⚠ {pdf.processingError}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--text-primary)]">
                  {pdf.topic ? (
                    <span className="px-2 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-[11px] font-medium whitespace-nowrap">
                      {pdf.topic}
                    </span>
                  ) : (
                    <span className="text-[var(--text-tertiary)]">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{formatSize(pdf.fileSizeBytes)}</td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{pdf.pages ?? '—'}</td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{pdf.questionsFound || '—'}</td>
                <td className="px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">{pdf.questionsParsed || '—'}</td>
                <td className="px-4 py-2.5 text-[12px]">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {pdf.questionsInserted > 0 ? (
                      <span className="font-semibold text-[#22c55e]">{pdf.questionsInserted}</span>
                    ) : (
                      <span className="text-[var(--text-tertiary)]">—</span>
                    )}
                    {!!pdf.duplicatesMerged && pdf.duplicatesMerged > 0 && (
                      <span title="Duplicates merged" className="px-1 py-0.5 rounded text-[9px] bg-[#f59e0b18] text-[#f59e0b] font-semibold">
                        +{pdf.duplicatesMerged} dup
                      </span>
                    )}
                    {!!pdf.needsReviewCount && pdf.needsReviewCount > 0 && (
                      <span title="Questions flagged for review" className="px-1 py-0.5 rounded text-[9px] bg-[#a855f718] text-[#c084fc] font-semibold">
                        {pdf.needsReviewCount} review
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <StatusPill pdf={pdf} />
                </td>
                <td className="px-4 py-2.5 text-[11px] text-[var(--text-tertiary)]">
                  {new Date(pdf.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setQuestionsPdfId(pdf.id)}
                      disabled={pdf.questionsParsed === 0}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card-hover)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-medium text-[var(--text-secondary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title="View parsed questions"
                    >
                      <ListChecks size={12} />
                      Questions
                    </button>
                    <button
                      onClick={() => setPreviewPdf(pdf)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card-hover)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-medium text-[var(--text-secondary)] transition-colors"
                      title="Preview PDF"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    <button
                      onClick={() => openDownload(pdf)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card-hover)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-medium text-[var(--text-secondary)] transition-colors"
                      title="Download PDF"
                    >
                      <Download size={12} />
                      Download
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {previewPdf && <PdfPreviewModal pdf={previewPdf} onClose={() => setPreviewPdf(null)} />}
      {questionsPdfId && <QuestionsModal pdfId={questionsPdfId} onClose={() => setQuestionsPdfId(null)} />}
    </>
  );
}

function BreakdownPanel({ centerId }: { centerId: string }) {
  const { data, isLoading } = useQuestionBankBreakdown(centerId);

  if (isLoading) {
    return (
      <div className="px-4 py-3 text-[11px] text-[var(--text-tertiary)]">
        Loading subject breakdown…
      </div>
    );
  }
  if (!data || data.total === 0) {
    return null;
  }

  // Group topics by subject so we render them under each subject header
  const topicsBySubject = new Map<string, Array<{ topic: string; count: number }>>();
  for (const t of data.byTopic) {
    const list = topicsBySubject.get(t.subject) ?? [];
    list.push({ topic: t.topic, count: t.count });
    topicsBySubject.set(t.subject, list);
  }

  return (
    <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-card)]/40">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2">
        Question distribution · {data.total} total
      </div>
      <div className="flex flex-col gap-2">
        {data.bySubject.map(s => {
          const topics = topicsBySubject.get(s.subject) ?? [];
          return (
            <div key={s.subject} className="flex flex-wrap items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-[#6366f120] text-[#a5b4fc] text-[11px] font-bold uppercase tracking-wide">
                {s.subject} · {s.count}
              </span>
              {topics.slice(0, 12).map(t => (
                <span
                  key={`${s.subject}-${t.topic}`}
                  className="px-1.5 py-0.5 rounded text-[10px] bg-[var(--bg-card-hover)] text-[var(--text-secondary)]"
                  title={`${t.topic}: ${t.count}`}
                >
                  {t.topic} <span className="text-[var(--text-tertiary)]">{t.count}</span>
                </span>
              ))}
              {topics.length > 12 && (
                <span className="text-[10px] text-[var(--text-tertiary)]">
                  +{topics.length - 12} more
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CenterRow({
  center,
  expanded,
  onToggle,
}: {
  center: QuestionBankCenterGroup;
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
            className={`text-[var(--text-tertiary)] transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--accent)]/15 flex items-center justify-center">
              <Building2 size={16} className="text-[var(--accent)]" />
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[var(--text-primary)]">{center.centerName}</div>
              <div className="text-[11px] text-[var(--text-tertiary)] font-mono">{center.centerSlug}</div>
            </div>
          </div>
        </td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{center.pdfCount}</td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{center.totalQuestionsInserted}</td>
        <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">
          {formatSize(center.totalStorageBytes)}
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--border)]">
          <td colSpan={5} className="bg-[var(--bg-shell)] p-0">
            <div className="border-l-2 border-[var(--accent)]/40">
              <BreakdownPanel centerId={center.centerId} />
              <div className="px-4 py-3">
                <PdfsTable pdfs={center.pdfs} />
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

export function QuestionBankPage() {
  const { data: groups, isLoading, error, refetch, isFetching } = useQuestionBankPdfs();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const triggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const result = await syncQuestionBank();
      setSyncResult(
        `Scanned ${result.scanned} file${result.scanned === 1 ? '' : 's'} · ${result.inserted} new · ${result.alreadyKnown} already tracked`,
      );
      refetch();
    } catch (e) {
      setSyncResult(e instanceof Error ? e.message : 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Question Bank</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            PDFs uploaded per center · click a center to see its files
          </p>
        </div>
        <div className="flex items-center gap-2">
          {syncResult && (
            <span className="text-[11px] text-[var(--text-secondary)] px-3 py-1 rounded-full bg-[var(--bg-card)] border border-[var(--border)]">
              {syncResult}
            </span>
          )}
          <button
            onClick={triggerSync}
            disabled={syncing}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={syncing || isFetching ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync from S3'}
          </button>
        </div>
      </div>

      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center text-sm text-red-400">Failed to load question bank</div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="w-8" />
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Center
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  PDFs
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Total questions
                </th>
                <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  Storage
                </th>
              </tr>
            </thead>
            <tbody>
              {(groups ?? []).length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <FileText size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                    <p className="text-sm text-[var(--text-secondary)]">No centers with PDFs yet</p>
                    <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
                      Upload PDFs to s3://classpulse-uploads/question-bank/&lt;centerId&gt;/ then click Sync.
                    </p>
                  </td>
                </tr>
              ) : (
                (groups ?? []).map(g => (
                  <CenterRow
                    key={g.centerId}
                    center={g}
                    expanded={expanded.has(g.centerId)}
                    onToggle={() => toggle(g.centerId)}
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
