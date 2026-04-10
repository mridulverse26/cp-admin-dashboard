import { FileText, HelpCircle, BarChart3, Target } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { useAssessmentAnalytics } from '@/hooks/use-admin';

const DIFFICULTY_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export function AssessmentsPage() {
  const { data: analytics, isLoading } = useAssessmentAnalytics();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const a = analytics || {};
  const testsByType = a.testsByType || [];
  const questionsByDifficulty = a.questionsByDifficulty || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assessments</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Test and question analytics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Tests" value={a.totalTests ?? 0} icon={FileText} color="#6366f1" />
        <StatCard label="Total Questions" value={a.totalQuestions ?? 0} icon={HelpCircle} color="#3b82f6" />
        <StatCard label="Avg Score" value={`${a.avgScore ?? 0}%`} icon={BarChart3} color="#22c55e" />
        <StatCard label="Completion Rate" value={`${a.completionRate ?? 0}%`} icon={Target} color="#f59e0b" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Tests by Type */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Tests by Type</h3>
          {testsByType.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-10 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={testsByType}>
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#8b8fa3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Questions by Difficulty */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Questions by Difficulty</h3>
          {questionsByDifficulty.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-10 text-center">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={questionsByDifficulty}
                    dataKey="count"
                    nameKey="difficulty"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {questionsByDifficulty.map((_: any, i: number) => (
                      <Cell key={i} fill={DIFFICULTY_COLORS[i % DIFFICULTY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-5 mt-2">
                {['Easy', 'Medium', 'Hard'].map((d, i) => (
                  <div key={d} className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: DIFFICULTY_COLORS[i] }} />
                    <span className="text-[11px] text-[var(--text-tertiary)]">{d}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
