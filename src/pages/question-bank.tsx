import { useEffect, useState } from 'react';
import {
  ChevronRight,
  FileText,
  Download,
  Eye,
  Building2,
  RefreshCw,
  X,
} from 'lucide-react';
import {
  useQuestionBankPdfs,
  syncQuestionBank,
  fetchQuestionBankPdfUrl,
} from '@/hooks/use-admin';
import type { QuestionBankCenterGroup, QuestionBankPdf } from '@/hooks/use-admin';

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusPill({ status }: { status: QuestionBankPdf['status'] }) {
  const styles: Record<QuestionBankPdf['status'], string> = {
    UPLOADED: 'bg-[#6366f118] text-[#818cf8]',
    PROCESSING: 'bg-[#f59e0b18] text-[#f59e0b]',
    PARSED: 'bg-[#22c55e18] text-[#22c55e]',
    FAILED: 'bg-[#ef444418] text-[#ef4444]',
  };
  const labels: Record<QuestionBankPdf['status'], string> = {
    UPLOADED: 'Not processed yet',
    PROCESSING: 'Processing',
    PARSED: 'Parsed',
    FAILED: 'Failed',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[status]}`}>
      {labels[status]}
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

function PdfsTable({ pdfs }: { pdfs: QuestionBankPdf[] }) {
  const [previewPdf, setPreviewPdf] = useState<QuestionBankPdf | null>(null);

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
              {['File', 'Topic', 'Size', 'Pages', 'Found', 'Parsed', 'Status', 'Uploaded', 'Actions'].map(h => (
                <th key={h} className="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pdfs.map(pdf => (
              <tr key={pdf.id} className="border-t border-[var(--border)]">
                <td className="px-4 py-2.5 text-[12px] font-medium text-[var(--text-primary)]">
                  <span className="inline-flex items-center gap-2">
                    <FileText size={13} className="text-[var(--text-tertiary)] shrink-0" />
                    {pdf.originalName}
                  </span>
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
                <td className="px-4 py-2.5">
                  <StatusPill status={pdf.status} />
                </td>
                <td className="px-4 py-2.5 text-[11px] text-[var(--text-tertiary)]">
                  {new Date(pdf.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPreviewPdf(pdf)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card-hover)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-medium text-[var(--text-secondary)] transition-colors"
                      title="Preview"
                    >
                      <Eye size={12} />
                      Preview
                    </button>
                    <button
                      onClick={() => openDownload(pdf)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[var(--bg-card-hover)] hover:bg-[var(--accent)] hover:text-white text-[11px] font-medium text-[var(--text-secondary)] transition-colors"
                      title="Download"
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
    </>
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
      </tr>
      {expanded && (
        <tr className="border-b border-[var(--border)]">
          <td colSpan={4} className="bg-[var(--bg-shell)] p-0">
            <div className="px-4 py-3 border-l-2 border-[var(--accent)]/40">
              <PdfsTable pdfs={center.pdfs} />
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
              </tr>
            </thead>
            <tbody>
              {(groups ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
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
