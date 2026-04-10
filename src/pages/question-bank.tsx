import { BookOpen, CheckSquare, AlignLeft } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/stat-card';
import { useQuestionBank } from '@/hooks/use-admin';

const DIFFICULTY_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

export function QuestionBankPage() {
  const { data: qbank, isLoading } = useQuestionBank();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const q = qbank || {};
  const bySubject = q.bySubject || [];
  const byDifficulty = q.byDifficulty || [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Question Bank</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">Platform-wide question statistics</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard label="Total Questions" value={q.totalQuestions ?? 0} icon={BookOpen} color="#6366f1" />
        <StatCard label="MCQ" value={q.mcqCount ?? 0} icon={CheckSquare} color="#3b82f6" />
        <StatCard label="Subjective" value={q.subjectiveCount ?? 0} icon={AlignLeft} color="#f59e0b" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-4">
        {/* By Subject */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Questions by Subject</h3>
          {bySubject.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-10 text-center">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={bySubject}>
                <XAxis dataKey="subject" tick={{ fontSize: 11, fill: '#8b8fa3' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5c607a' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1c1e2e', border: '1px solid #2a2d3e', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Difficulty */}
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Questions by Difficulty</h3>
          {byDifficulty.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] py-10 text-center">No data yet</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={byDifficulty}
                    dataKey="count"
                    nameKey="difficulty"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {byDifficulty.map((_: any, i: number) => (
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
