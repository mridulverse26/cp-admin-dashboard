import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

// Renders q-bank stem / option text with:
//   • inline + display math via $...$ / $$...$$ (remark-math + rehype-katex)
//   • markdown tables for "Match the column" questions (remark-gfm)
//   • basic markdown emphasis / lists
//
// Pre-this-component, question-card.tsx rendered text as plain {q.stem} inside
// a whitespace-pre-wrap div, so 200/200 cards in batches 1+2 had mathSpanCount=0
// (raw `$_2$`, `\frac{...}` etc. visible). See QBANK_ISSUES.md Q-001 + Q-008.

const INLINE_COMPONENTS: Components = {
  // Option text is inside a <span>; nested <p> would be invalid HTML and
  // would also break the flex layout. Flatten paragraphs to a fragment.
  p: ({ children }) => <>{children}</>,
};

const BLOCK_COMPONENTS: Components = {
  // Stem is block-level — keep paragraphs as paragraphs, but null out the
  // default browser <p> margin so the existing card spacing isn't doubled.
  p: ({ children }) => <p className="m-0">{children}</p>,
  // Tables get a thin border + horizontal scroll so wide "Match the column"
  // tables don't blow up the card width.
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="border-collapse text-[12px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-[var(--border)] px-2 py-1 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-[var(--border)] px-2 py-1 align-top">{children}</td>
  ),
};

// Normalize stem/option text before handing it to remark-math + react-markdown.
// We've seen these real-world patterns break rendering on Dhaval Sir Chemistry
// + Joy Institute banks (PROD, 2026-05-16):
//
//   1. `<DIAGRAM>`, `< DIAGRAM >`, `<diagram>` — OCR emits this token when it
//      detects a figure but can't extract it. ReactMarkdown will silently
//      drop `<DIAGRAM>` because it looks like an unknown HTML tag. Replace
//      with a visible italic hint so the text still reads.
//
//   2. `\to$` with no opening `$` (Q1 ff6649f4: "Reaction : 2NO$_2$F $\to$
//      2NO$_2$ + F$_2$"). The lone `\to` outside `$...$` breaks remark-math's
//      scan and the WHOLE paragraph reverts to raw text. Heuristic: an odd
//      count of `$` in the stem signals a broken delimiter — try to repair
//      by appending a closing `$` so at least most math segments render.
//
//   3. Markdown italic vs math: `[A]_0` outside `$...$` would be parsed as
//      italic by markdown. Inside `$...$` it's a math subscript. Our content
//      almost always wraps these in `$`, but we add a guard for stray cases.
//
// Long-term fix is at ingestion; this component only patches the display.
const DIAGRAM_PLACEHOLDER_RE = /<\s*diagram\s*>/gi;

function normalizeForMarkdown(text: string): string {
  let t = text.replace(DIAGRAM_PLACEHOLDER_RE, '_(figure pending)_');

  // Guard #2: if `$` count is odd, append a trailing `$` so at least the
  // last partial math segment closes. Better to render with one extra "$"
  // somewhere than to lose all math rendering for the whole paragraph.
  const dollarCount = (t.match(/\$/g) ?? []).length;
  if (dollarCount % 2 === 1) {
    t = t + '$';
  }

  return t;
}

export function MathContent({ text, inline = false }: { text: string; inline?: boolean }) {
  if (!text) return null;
  const Wrapper = inline ? 'span' : 'div';
  return (
    <Wrapper data-math-content="v2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={inline ? INLINE_COMPONENTS : BLOCK_COMPONENTS}
      >
        {normalizeForMarkdown(text)}
      </ReactMarkdown>
    </Wrapper>
  );
}
