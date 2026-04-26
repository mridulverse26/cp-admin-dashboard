import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Clock,
  Send,
  Mic,
  ExternalLink,
  MapPin,
} from 'lucide-react';
import {
  useLeads,
  useApplications,
  patchLead,
  patchApplication,
  fetchApplicationAudioUrl,
  type MarketingLead,
  type MarketingLeadStatus,
  type InternApplication,
  type InternApplicationStatus,
} from '@/hooks/use-admin';

type Tab = 'leads' | 'applications';

const LEAD_STATUSES: MarketingLeadStatus[] = ['NEW', 'CONTACTED', 'CLOSED'];
const APPLICATION_STATUSES: InternApplicationStatus[] = ['NEW', 'SHORTLISTED', 'REJECTED', 'CLOSED'];

function timeAgo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    NEW: 'bg-[#6366f120] text-[#a5b4fc]',
    CONTACTED: 'bg-[#22c55e20] text-[#22c55e]',
    CLOSED: 'bg-[var(--bg-card-hover)] text-[var(--text-tertiary)]',
    SHORTLISTED: 'bg-[#22c55e20] text-[#22c55e]',
    REJECTED: 'bg-[#ef444420] text-[#ef4444]',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${styles[status] ?? 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)]'}`}>
      {status}
    </span>
  );
}

function LeadCard({ lead, onChange }: { lead: MarketingLead; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(lead.notes ?? '');

  const update = async (patch: { status?: MarketingLeadStatus; notes?: string | null }) => {
    setBusy(true);
    try {
      await patchLead(lead.id, patch);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        {open ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{lead.name}</div>
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Phone size={10} /> {lead.phone}
              {lead.whatsappOk && <span className="px-1 rounded bg-[#22c55e15] text-[#22c55e] text-[9px] font-semibold">WA OK</span>}
            </div>
          </div>
          <div className="text-[12px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
            <Building2 size={11} className="text-[var(--text-tertiary)] shrink-0" />
            <span className="truncate">{lead.instituteName}</span>
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Clock size={10} /> {timeAgo(lead.createdAt)}
          </div>
          <StatusBadge status={lead.status} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] bg-[var(--bg-shell)]/40">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px] mt-3">
            <Field label="Students" value={lead.studentCount} />
            <Field label="Classes" value={lead.classes.join(', ')} />
            <Field label="Competitive exams" value={lead.competitiveExams?.join(', ') || '—'} />
          </div>
          {lead.message && (
            <div className="mt-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Message</div>
              <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 leading-relaxed">{lead.message}</div>
            </div>
          )}

          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Notes (admin only)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (lead.notes ?? '') && update({ notes: notes || null })}
              placeholder="Add a note about this lead..."
              className="w-full text-[12px] text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-none min-h-[60px]"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] text-[var(--text-tertiary)] mr-auto">
              IP: {lead.ipAddress ?? '—'}
            </span>
            {LEAD_STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy || lead.status === s}
                onClick={() => update({ status: s })}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                  lead.status === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ApplicationCard({ application, onChange }: { application: InternApplication; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(application.notes ?? '');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const update = async (patch: { status?: InternApplicationStatus; notes?: string | null }) => {
    setBusy(true);
    try {
      await patchApplication(application.id, patch);
      onChange();
    } finally {
      setBusy(false);
    }
  };

  // Lazy-load audio URL when card opens AND has audio attached
  useEffect(() => {
    if (!open || !application.audioS3Key || audioUrl) return;
    setAudioLoading(true);
    setAudioError(null);
    fetchApplicationAudioUrl(application.id)
      .then((res) => {
        if (res?.url) setAudioUrl(res.url);
        else setAudioError('No audio attached');
      })
      .catch((e) => setAudioError(e?.message ?? 'Failed to load audio'))
      .finally(() => setAudioLoading(false));
  }, [open, application.id, application.audioS3Key, audioUrl]);

  const areaLabel = application.area === 'Other' ? application.areaCustom || 'Other' : application.area;

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--bg-card)]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-3 flex items-center gap-3 text-left hover:bg-[var(--bg-card-hover)] transition-colors"
      >
        {open ? <ChevronDown size={14} className="text-[var(--text-tertiary)]" /> : <ChevronRight size={14} className="text-[var(--text-tertiary)]" />}
        <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3 items-center">
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-[var(--text-primary)] truncate flex items-center gap-1.5">
              {application.name}
              {application.audioS3Key && (
                <Mic size={11} className="text-[#22c55e]" />
              )}
            </div>
            <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
              <Mail size={10} /> {application.email}
            </div>
          </div>
          <div className="text-[12px] text-[var(--text-secondary)] truncate flex items-center gap-1.5">
            <MapPin size={11} className="text-[var(--text-tertiary)] shrink-0" />
            <span className="truncate">{areaLabel}</span>
          </div>
          <div className="text-[11px] text-[var(--text-tertiary)] flex items-center gap-1.5">
            <Clock size={10} /> {timeAgo(application.createdAt)}
          </div>
          <StatusBadge status={application.status} />
        </div>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-[var(--border)] bg-[var(--bg-shell)]/40">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-[12px] mt-3">
            <Field label="Phone" value={`${application.phone}${application.whatsappOk ? ' (WA)' : ''}`} />
            <Field label="Education" value={application.education} />
            <Field label="Has vehicle" value={application.hasVehicle ? 'Yes' : 'No'} />
            <Field label="Available from" value={application.startDate} />
            <Field label="Weekly hours" value={application.weeklyHours} />
            {application.linkedinUrl ? (
              <Field
                label="LinkedIn"
                value={
                  <a href={application.linkedinUrl} target="_blank" rel="noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                    <ExternalLink size={11} /> Profile
                  </a>
                }
              />
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            <Block label="Why ClassPulse" body={application.whyClasspulse} />
            <Block label="Gatekeeper story" body={application.gatekeeperStory} />
          </div>

          {application.audioS3Key && (
            <div className="mt-4">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 flex items-center gap-1.5">
                <Mic size={11} /> Voice intro
                {application.audioDurationSec ? <span className="text-[var(--text-secondary)]">· {application.audioDurationSec}s</span> : null}
              </div>
              {audioLoading && <div className="text-[12px] text-[var(--text-tertiary)]">Loading…</div>}
              {audioError && <div className="text-[12px] text-[#ef4444]">{audioError}</div>}
              {audioUrl && (
                <audio controls src={audioUrl} className="w-full max-w-md" preload="metadata" />
              )}
            </div>
          )}

          <div className="mt-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">Notes (admin only)</div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (application.notes ?? '') && update({ notes: notes || null })}
              placeholder="Add interview notes..."
              className="w-full text-[12px] text-[var(--text-primary)] bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 leading-relaxed focus:outline-none focus:border-[var(--accent)] resize-none min-h-[60px]"
            />
          </div>

          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[var(--text-tertiary)] mr-auto">
              IP: {application.ipAddress ?? '—'}
            </span>
            {APPLICATION_STATUSES.map((s) => (
              <button
                key={s}
                disabled={busy || application.status === s}
                onClick={() => update({ status: s })}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold transition-colors disabled:opacity-40 ${
                  application.status === s
                    ? 'bg-[var(--accent)] text-white'
                    : 'bg-[var(--bg-card-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">{label}</div>
      <div className="text-[12px] text-[var(--text-primary)] mt-0.5 break-words">{value || '—'}</div>
    </div>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">{label}</div>
      <div className="text-[12px] text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border)] rounded p-2.5 leading-relaxed whitespace-pre-wrap">
        {body}
      </div>
    </div>
  );
}

export function RequestsPage() {
  const [tab, setTab] = useState<Tab>('leads');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const leadStatusFilter = statusFilter === 'all' ? undefined : (statusFilter as MarketingLeadStatus);
  const appStatusFilter = statusFilter === 'all' ? undefined : (statusFilter as InternApplicationStatus);

  const { data: leads, isLoading: leadsLoading } = useLeads(tab === 'leads' ? leadStatusFilter : undefined);
  const { data: applications, isLoading: appsLoading } = useApplications(tab === 'applications' ? appStatusFilter : undefined);

  // Always fetch unfiltered counts for the tab badges
  const { data: allLeads } = useLeads();
  const { data: allApplications } = useApplications();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-leads'] });
    queryClient.invalidateQueries({ queryKey: ['admin-applications'] });
  };

  const newLeads = (allLeads ?? []).filter((l) => l.status === 'NEW').length;
  const newApps = (allApplications ?? []).filter((a) => a.status === 'NEW').length;

  const list = tab === 'leads' ? leads ?? [] : applications ?? [];
  const isLoading = tab === 'leads' ? leadsLoading : appsLoading;
  const statuses = tab === 'leads' ? LEAD_STATUSES : APPLICATION_STATUSES;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Requests</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            Submissions from www.classpulseai.com — get-in-touch leads and intern applications
          </p>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex items-center gap-1 mb-4 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg w-fit">
        <button
          onClick={() => { setTab('leads'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'leads' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Send size={12} />
          Get in Touch
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            tab === 'leads' ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-tertiary)]'
          }`}>{newLeads}</span>
        </button>
        <button
          onClick={() => { setTab('applications'); setStatusFilter('all'); }}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
            tab === 'applications' ? 'bg-[var(--accent)] text-white' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Briefcase size={12} />
          Applications
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
            tab === 'applications' ? 'bg-white/20 text-white' : 'bg-[var(--border)] text-[var(--text-tertiary)]'
          }`}>{newApps}</span>
        </button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <span className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mr-1">Status:</span>
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
            statusFilter === 'all' ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
          }`}
        >
          All
        </button>
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
              statusFilter === s ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : list.length === 0 ? (
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl py-16 text-center">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-card-hover)] flex items-center justify-center mx-auto mb-3">
            {tab === 'leads' ? <Send size={20} className="text-[var(--text-tertiary)]" /> : <Briefcase size={20} className="text-[var(--text-tertiary)]" />}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">No {tab === 'leads' ? 'leads' : 'applications'} yet</p>
          <p className="text-[12px] text-[var(--text-tertiary)] mt-1">
            Submissions from www.classpulseai.com will show up here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {tab === 'leads'
            ? (list as MarketingLead[]).map((l) => <LeadCard key={l.id} lead={l} onChange={refresh} />)
            : (list as InternApplication[]).map((a) => <ApplicationCard key={a.id} application={a} onChange={refresh} />)}
        </div>
      )}
    </div>
  );
}
