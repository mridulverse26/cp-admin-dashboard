import { Building2, Users, FileText, Brain, Zap, TrendingUp } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { useOverview, useGrowth, useOnlineUsers } from '@/hooks/use-admin';

const LEAGUE_COLORS = ['#CD7F32', '#C0C0C0', '#FFD700', '#60A5FA'];

export function OverviewPage() {
  const { data: overview, isLoading } = useOverview();
  const { data: growth } = useGrowth();
  const { data: online } = useOnlineUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const o = overview || {};
  const leagueData = o.leagueDistribution || [];
  const subjectData = o.testsBySubject || [];
  const growthData = growth?.signupsPerDay || growth?.studentsPerDay || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">Platform overview in real-time</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#22c55e18] border border-[#22c55e30]">
          <span className="w-2 h-2 rounded-full bg-[var(--green)] animate-pulse" />
          <span className="text-xs font-medium text-[var(--green)]">{online?.length || 0} online</span>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Centers" value={o.totalCenters || 0} icon={Building2} color="#6366f1" sub={`${o.activeCenters || 0} active`} />
        <StatCard label="Students" value={o.totalStudents || 0} icon={Users} color="#22c55e" sub={`${o.activeToday || 0} active today`} />
        <StatCard label="Tests Created" value={o.totalTests || 0} icon={FileText} color="#f59e0b" sub={`${o.totalQuestions || 0} questions`} />
        <StatCard label="AI Generated" value={o.aiGeneratedQuestions || 0} icon={Brain} color="#8b5cf6" sub={`${o.totalAttempts || 0} attempts`} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {/* Student Growth */}
        <div className="col-span-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Student Growth (30 days)</h3>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" fillOpacity={1} fill="url(#colorStudents)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* League Distribution */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-[var(--amber)]" />
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Student Leagues</h3>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={leagueData} dataKey="count" nameKey="league" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3}>
                {leagueData.map((_: any, i: number) => (
                  <Cell key={i} fill={LEAGUE_COLORS[i % LEAGUE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {['Bronze', 'Silver', 'Gold', 'Diamond'].map((l, i) => (
              <div key={l} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: LEAGUE_COLORS[i] }} />
                <span className="text-[10px] text-[var(--text-tertiary)]">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tests by Subject */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tests by Subject</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={subjectData} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
              <YAxis dataKey="subject" type="category" tick={{ fontSize: 11, fill: '#8b8fa3' }} axisLine={false} tickLine={false} width={90} />
              <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Platform Stats */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Platform Metrics</h3>
          <div className="space-y-4">
            {[
              { label: 'Total XP Earned', value: o.platformXP?.toLocaleString() || '0', color: 'var(--amber)' },
              { label: 'Avg Test Score', value: `${o.avgScore || 0}%`, color: 'var(--green)' },
              { label: 'Total DPPs', value: o.totalDpps || '0', color: 'var(--blue)' },
              { label: 'Completion Rate', value: `${o.completionRate || 0}%`, color: 'var(--accent)' },
              { label: 'Total Batches', value: o.totalBatches || '0', color: 'var(--red)' },
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between">
                <span className="text-[13px] text-[var(--text-secondary)]">{m.label}</span>
                <span className="text-[14px] font-bold" style={{ color: m.color }}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
