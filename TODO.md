# ClassPulse AI — Task Queue

## Current Task

**Status**: PENDING
**Project**: cp-admin-dashboard
**Branch**: feat/ai-usage-per-center
**Task**: Enhance the AI Usage page (src/pages/ai-usage.tsx) to show token usage broken down by center. Add a simple, clean section below the existing stats that shows:

1. A list of centers sorted by most AI tokens used (descending)
2. Each center shows: center name, a progress bar (relative to the highest usage), and the token count
3. Use the dark theme CSS variables (--bg-card, --accent, --text-primary, etc.)
4. Keep it simple — no new libraries, just Tailwind + CSS

The backend already has an endpoint for this. Check the existing hooks in src/hooks/use-admin.ts — the useAIUsage() hook fetches from /ai-usage. If the response already includes per-center breakdown, use it. If not, add a new hook useAICenterUsage() that fetches from /ai-usage/centers (assume the backend will provide this).

Design reference:
```
┌─────────────────────────────────────────────┐
│  AI Usage by Center                         │
│                                             │
│  Sharma Classes      ████████░░  4,200 tkns │
│  Delhi Coaching      ██████░░░░  3,100 tkns │
│  JEE Masters         ████░░░░░░  2,000 tkns │
│  NEET Academy        ██░░░░░░░░    800 tkns │
│                                             │
│  Total: 10,100 tokens                       │
└─────────────────────────────────────────────┘
```

Rules:
- Follow existing patterns in CLAUDE.md
- Use var(--bg-card), var(--accent), var(--text-primary) etc. — NO hardcoded colors
- Use existing hook pattern from use-admin.ts
- Keep it simple — no Recharts for this, just Tailwind divs for progress bars
- Use import type {} for type-only imports (erasableSyntaxOnly is enforced)
- Do NOT use enum keyword — use string unions or as const

**Acceptance Criteria**:
- [ ] ai-usage.tsx has a new "AI Usage by Center" section
- [ ] Shows center name + progress bar + token count
- [ ] Sorted by highest usage first
- [ ] Matches dark theme
- [ ] tsc -b passes (zero errors)
- [ ] npm run build passes
- [ ] PR created

**Files to Reference**: src/pages/ai-usage.tsx, src/hooks/use-admin.ts, src/components/stat-card.tsx, CLAUDE.md
