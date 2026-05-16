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

export function MathContent({ text, inline = false }: { text: string; inline?: boolean }) {
  if (!text) return null;
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={inline ? INLINE_COMPONENTS : BLOCK_COMPONENTS}
    >
      {text}
    </ReactMarkdown>
  );
}
