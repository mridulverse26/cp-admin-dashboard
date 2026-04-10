import { useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useUsers } from '@/hooks/use-admin';

const TABS = ['All', 'Students', 'Teachers', 'Owners'] as const;
const ROLE_MAP: Record<string, string | undefined> = {
  All: undefined,
  Students: 'STUDENT',
  Teachers: 'TEACHER',
  Owners: 'CENTER_OWNER',
};

export function UsersPage() {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [search, setSearch] = useState('');
  const { data: users, isLoading } = useUsers({ role: ROLE_MAP[activeTab] });

  // Fetch all users for badge counts
  const { data: allData } = useUsers({ limit: 200 });
  const allList = Array.isArray(allData) ? allData : allData?.users || [];
  const counts: Record<string, number> = {
    All: allData?.total || allList.length || 0,
    Students: allList.filter((u: any) => u.role === 'STUDENT').length,
    Teachers: allList.filter((u: any) => u.role === 'TEACHER').length,
    Owners: allList.filter((u: any) => u.role === 'CENTER_OWNER').length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const rawList = Array.isArray(users) ? users : users?.users || [];
  const list = rawList.filter((u: any) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.phone?.includes(search) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Users</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">{list.length} user{list.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === tab
                ? 'bg-[var(--accent)] text-white'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
              activeTab === tab ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-tertiary)]'
            }`}>{counts[tab] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[var(--border)]">
              {['Name', 'Phone', 'Email', 'Role', 'Center', 'XP', 'Level', 'Last Active'].map(h => (
                <th key={h} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <Users size={32} className="mx-auto mb-2 text-[var(--text-tertiary)]" />
                  <p className="text-sm text-[var(--text-secondary)]">No users found</p>
                </td>
              </tr>
            ) : (
              list.map((u: any) => (
                <tr key={u._id} className="border-b border-[var(--border)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                  <td className="px-4 py-3 text-[13px] font-medium text-[var(--text-primary)]">{u.name}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{u.phone || '-'}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{u.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                      u.role === 'owner' ? 'bg-[#f59e0b18] text-[var(--amber)]' :
                      u.role === 'teacher' ? 'bg-[#3b82f618] text-[var(--blue)]' :
                      'bg-[#22c55e18] text-[var(--green)]'
                    }`}>
                      {u.role || 'student'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{u.centerName || '-'}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--amber)]">{u.xp ?? 0}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-secondary)]">{u.level ?? 1}</td>
                  <td className="px-4 py-3 text-[13px] text-[var(--text-tertiary)]">
                    {u.lastActive ? new Date(u.lastActive).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
