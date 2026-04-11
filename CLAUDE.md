# cp-admin-dashboard — Admin Panel Rules

## Stack
React 19 + Vite + TypeScript + TanStack React Query + Recharts + Tailwind CSS + Axios

## Overview
Internal admin panel for ClassPulse team to monitor all coaching centers, users, assessments, AI usage, and system health. This is NOT customer-facing.

## Architecture
```
src/
├── pages/           — 8 page components (overview, centers, users, etc.)
├── components/      — Sidebar, StatCard
├── hooks/
│   └── use-admin.ts — ALL React Query hooks (single file)
├── lib/
│   └── api.ts       — Axios instance with admin key auth
├── App.tsx          — Router + QueryClientProvider
└── main.tsx         — Entry point
```

## API Client

```typescript
import { api } from "@/lib/api";
// Base URL: http://localhost:3000/api/v1/admin
// Auth: x-admin-key header (NOT JWT — this is admin-only access)
```

**Do NOT use JWT auth here.** The admin dashboard uses a static API key.

## Hook Pattern

All hooks live in a single file: `src/hooks/use-admin.ts`

```typescript
export function useOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/overview').then(r => r.data.data),
    refetchInterval: 30000,  // Auto-refresh for live dashboards
  });
}
```

**Rules:**
- All hooks go in `use-admin.ts` — don't create separate hook files
- Query keys are prefixed with `admin-`: `['admin-centers']`, `['admin-users']`
- Use `refetchInterval` for real-time dashboard data (overview, online users)
- No Zustand — React Query handles all state

## Page Pattern

```typescript
export default function MyPage() {
  const { data, isLoading } = useMyHook();

  if (isLoading) return <div className="flex items-center justify-center h-64">...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Title</h2>
        <p className="text-sm text-[var(--text-secondary)]">Subtitle</p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={data.total} icon={Users} color="#6366f1" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recharts BarChart, PieChart, AreaChart */}
      </div>
    </div>
  );
}
```

## Dark Theme

This dashboard uses a dark theme. CSS variables in `index.css`:
```
--bg-shell: #0f1117        (page background)
--bg-sidebar: #161822      (sidebar)
--bg-card: #1c1e2e         (card backgrounds)
--bg-card-hover: #232538   (card hover)
--border: #2a2d3e          (borders)
--text-primary: #e4e6f0    (headings)
--text-secondary: #8b8fa3  (body text)
--accent: #6366f1          (indigo accent)
```

**Never use light theme colors.** Always use `var(--bg-card)`, `var(--text-primary)`, etc.

## Recharts Conventions
- Background color for chart containers: `#1c1e2e`
- Grid stroke: `#2a2d3e`
- Text fill: `#8b8fa3`
- Accent colors: `#6366f1` (indigo), `#22c55e` (green), `#f59e0b` (amber), `#ef4444` (red)

## Import Alias
```typescript
import { Something } from "@/lib/api";
import { StatCard } from "@/components/stat-card";
```

## Scripts
```bash
npm run dev       # Vite dev server (port 5174)
npm run build     # tsc -b + vite build
npm run lint      # ESLint
```

## Common Mistakes to Avoid
- Don't use JWT auth — this uses `x-admin-key` header
- Don't use light theme colors — everything is dark theme
- Don't create separate hook files — all hooks go in `use-admin.ts`
- Don't add Zustand — React Query is sufficient here
- Don't forget `refetchInterval` for live dashboard data
