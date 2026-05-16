import { Check, Copy, KeyRound, Sparkles } from 'lucide-react';
import { useState } from 'react';
import type { ParsedMcq, ParsedMcqTags } from '@/hooks/use-admin';
import { MathContent } from '@/components/math-content';

// Real `answer_source` values found in the prod DB as of 2026-05-16
// (SELECT DISTINCT answer_source FROM ast_question_bank):
//   key, ai, ai-high, ai-low, ai_review, answer_key, pdf
// The original component only knew 'key' | 'ai' | 'manual' — anything else
// triggered "Cannot read properties of undefined (reading 'Icon')" and crashed
// the entire /questions admin page. Normalizing into 3 visual buckets +
// graceful fallback for genuinely unknown values keeps the badge cheap.
const ANSWER_SOURCE_BUCKETS: Record<string, 'key' | 'ai' | 'manual'> = {
  key: 'key',
  answer_key: 'key',
  pdf: 'key',           // pdf-extracted answer keys
  ai: 'ai',
  'ai-high': 'ai',
  'ai-low': 'ai',
  ai_review: 'ai',
  manual: 'manual',
};

const ANSWER_SOURCE_STYLES = {
  key: { bg: 'bg-[#22c55e18]', fg: 'text-[#22c55e]', Icon: KeyRound, label: 'Answer key' },
  ai: { bg: 'bg-[#f59e0b18]', fg: 'text-[#f59e0b]', Icon: Sparkles, label: 'AI predicted' },
  manual: { bg: 'bg-[#6366f118]', fg: 'text-[#818cf8]', Icon: Check, label: 'Manual' },
} as const;

export function AnswerSourceBadge({ source }: { source: string | null }) {
  if (!source) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-shell)] text-[var(--text-tertiary)]">
        no answer
      </span>
    );
  }
  const bucket = ANSWER_SOURCE_BUCKETS[source];
  if (!bucket) {
    // Unknown source — render the raw value as a neutral chip rather than crash.
    // If we see this in the wild, add the value to ANSWER_SOURCE_BUCKETS above.
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-shell)] text-[var(--text-tertiary)]">
        {source}
      </span>
    );
  }
  const styles = ANSWER_SOURCE_STYLES[bucket];
  const Icon = styles.Icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${styles.bg} ${styles.fg}`}>
      <Icon size={10} />
      {styles.label}
    </span>
  );
}

// Compact copyable chip showing a short prefix of a question's DB uuid.
// Click → full uuid on clipboard so a coworker can paste it anywhere
// (Slack, ticket, SQL query) and refer to a stable identifier instead
// of the position-on-page Q-number.
export function QuestionIdChip({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked (insecure context / browser perms) — noop
    }
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      title={copied ? 'Copied!' : `Copy id: ${id}`}
      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-[var(--text-tertiary)] hover:text-[var(--accent)] border border-[var(--border)] hover:border-[var(--accent)] transition-colors"
    >
      <span>{id.slice(0, 8)}</span>
      {copied ? <Check size={10} /> : <Copy size={10} />}
    </button>
  );
}

export function Tag({ label, value, color }: { label: string; value: string | number; color: string }) {
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

export function TagsRow({ tags }: { tags: ParsedMcqTags }) {
  const items: { label: string; value: string | number; color: string }[] = [];

  if (tags.subject) items.push({ label: 'Subject', value: tags.subject, color: '#818cf8' });
  if (tags.topic) items.push({ label: 'Topic', value: tags.topic, color: '#818cf8' });
  if (tags.subTopic) items.push({ label: 'Sub-topic', value: tags.subTopic, color: '#a78bfa' });
  // Difficulty intentionally not surfaced — we use exam-tier (CBSE Boards / JEE / NEET)
  // as the user-facing complexity signal. Difficulty stays in the DTO for internal use
  // but is no longer shown on cards. See PROD discussion on 2026-05-16.
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

interface QuestionCardProps {
  q: ParsedMcq;
  /** Optional decoration shown above the stem (provenance, review-status dropdown, etc.) */
  header?: React.ReactNode;
  /** Optional image URL — rendered between the stem and options */
  imageUrl?: string | null;
  /** Stable DB id (uuid). Renders as a copyable chip so coworkers can reference rows. */
  questionId?: string;
}

export function QuestionCard({ q, header, imageUrl, questionId }: QuestionCardProps) {
  return (
    <div className="bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
            Q{q.number}
          </span>
          {questionId && <QuestionIdChip id={questionId} />}
          <AnswerSourceBadge source={q.answerSource} />
        </div>
        {header}
      </div>
      <div className="text-[13px] text-[var(--text-primary)] leading-relaxed mb-3">
        <MathContent text={q.stem} />
      </div>
      {imageUrl && (
        <div className="mb-3">
          <img
            src={imageUrl}
            alt="Question figure"
            loading="lazy"
            className="rounded border border-[var(--border)] max-w-[28rem] max-h-[20rem] object-contain bg-white p-1"
          />
        </div>
      )}
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
              <span className="flex-1"><MathContent text={opt.text} inline /></span>
              {isCorrect && <Check size={13} className="text-[#22c55e] shrink-0 mt-0.5" />}
            </div>
          );
        })}
      </div>
      {q.tags && <TagsRow tags={q.tags} />}
    </div>
  );
}
