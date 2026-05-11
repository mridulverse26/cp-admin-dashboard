import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, AlertTriangle, Save, RotateCcw, Info, X } from 'lucide-react';
import {
  useCenterFeatureFlags,
  usePatchCenterFeatureFlags,
  type CenterFeatureFlagsResponse,
  type FeatureFlagKey,
  type FeatureFlagModuleDefinition,
} from '@/hooks/use-admin';

const GROUP_ORDER: Record<string, number> = {
  daily: 1,
  assessments: 2,
  manage: 3,
  student: 4,
};

const MANDATORY_TEACHER = [
  'Home', 'Calendar', 'Attendance', 'Batches', 'Students', 'Analytics', 'Settings',
];
const MANDATORY_STUDENT = ['Home', 'Schedule', 'Profile', 'About Us'];

interface PendingChanges {
  [flagKey: string]: boolean;
}

function ConfirmDisableModal({
  module,
  onConfirm,
  onCancel,
}: {
  module: FeatureFlagModuleDefinition;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onCancel}>
      <div
        className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-6 w-[440px] max-w-[90vw]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--text-primary)]">Disable {module.label}?</h3>
            <p className="text-sm text-[var(--text-secondary)] mt-1.5">
              {module.description}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] -mt-1"
          >
            <X size={18} />
          </button>
        </div>

        <div className="bg-[var(--bg-shell)] border border-[var(--border)] rounded-lg p-3 mb-4">
          <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
            Existing data is <span className="font-semibold text-[var(--text-primary)]">preserved</span> — disabling
            only hides the module in the customer app and blocks its API endpoints. Re-enabling brings
            everything back instantly.
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-shell)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-500 transition-colors"
          >
            Disable {module.label}
          </button>
        </div>
      </div>
    </div>
  );
}

function ModuleToggleRow({
  module,
  effective,
  onToggle,
}: {
  module: FeatureFlagModuleDefinition;
  effective: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--border)] last:border-b-0">
      <button
        type="button"
        role="switch"
        aria-checked={effective}
        onClick={() => onToggle(!effective)}
        className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
          effective ? 'bg-emerald-500' : 'bg-[var(--border)]'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            effective ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-sm font-medium text-[var(--text-primary)]">{module.label}</div>
          <code className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-shell)] px-1.5 py-0.5 rounded">
            {module.flagKey}
          </code>
        </div>
        <div className="text-xs text-[var(--text-tertiary)] mt-0.5">{module.description}</div>
      </div>
    </div>
  );
}

export function FeatureFlagsDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useCenterFeatureFlags(id);
  const patchFlags = usePatchCenterFeatureFlags();

  const [pending, setPending] = useState<PendingChanges>({});
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmModule, setConfirmModule] = useState<FeatureFlagModuleDefinition | null>(null);

  const effective = useMemo(() => {
    if (!data) return {} as Record<FeatureFlagKey, boolean>;
    return { ...data.flags, ...pending } as Record<FeatureFlagKey, boolean>;
  }, [data, pending]);

  const groupedModules = useMemo(() => {
    if (!data) return new Map<string, FeatureFlagModuleDefinition[]>();
    const groups = new Map<string, FeatureFlagModuleDefinition[]>();
    for (const m of data.catalog.modules) {
      const list = groups.get(m.group) ?? [];
      list.push(m);
      groups.set(m.group, list);
    }
    return groups;
  }, [data]);

  const dirtyCount = Object.keys(pending).length;

  const toggleOrConfirm = (module: FeatureFlagModuleDefinition, next: boolean) => {
    if (!next) {
      // Disabling — show confirmation modal.
      setConfirmModule(module);
      return;
    }
    setPending((p) => {
      const copy = { ...p };
      if (data?.flags[module.flagKey] === next) {
        delete copy[module.flagKey];
      } else {
        copy[module.flagKey] = next;
      }
      return copy;
    });
  };

  const commitDisable = () => {
    if (!confirmModule) return;
    const module = confirmModule;
    setPending((p) => {
      const copy = { ...p };
      if (data?.flags[module.flagKey] === false) {
        delete copy[module.flagKey];
      } else {
        copy[module.flagKey] = false;
      }
      return copy;
    });
    setConfirmModule(null);
  };

  const onSave = async () => {
    if (!id || dirtyCount === 0) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await patchFlags(id, pending);
      setPending({});
    } catch (err) {
      setErrorMsg((err as Error)?.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const onReset = () => {
    setPending({});
    setErrorMsg(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--text-secondary)] text-sm">
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link to="/feature-flags" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <ChevronLeft size={14} /> Back to centers
        </Link>
        <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-sm font-medium text-red-300">Failed to load center</div>
            <div className="text-xs text-red-300/80 mt-1">{(error as Error)?.message ?? 'Center not found'}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24">
      <div>
        <Link to="/feature-flags" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-3">
          <ChevronLeft size={14} /> Back to centers
        </Link>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">{data.centerName}</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Modules for{' '}
          <code className="text-xs bg-[var(--bg-card)] px-1.5 py-0.5 rounded">{data.centerSlug}</code>
          {data.lastChange && (
            <span className="ml-2 text-[var(--text-tertiary)]">
              · Last change by {data.lastChange.changedBy} ({new Date(data.lastChange.createdAt).toLocaleString()})
            </span>
          )}
        </p>
      </div>

      <div className="flex items-start gap-3 p-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-lg">
        <Info size={16} className="text-[var(--accent)] mt-0.5 shrink-0" />
        <div className="text-xs text-[var(--text-secondary)] leading-relaxed">
          Disabling a module hides it in the customer app (teacher + student nav) and returns
          <code className="mx-1 bg-[var(--bg-shell)] px-1 py-0.5 rounded">403 MODULE_DISABLED</code>
          from its backend endpoints. Existing data is preserved; re-enabling restores access immediately.
        </div>
      </div>

      {/* Mandatory modules — informational, not toggleable */}
      <section>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
          Always on
        </h3>
        <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg p-4 space-y-3">
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Teacher</div>
            <div className="flex flex-wrap gap-1.5">
              {MANDATORY_TEACHER.map((m) => (
                <span key={m} className="px-2 py-0.5 text-[11px] rounded bg-[var(--bg-shell)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Student</div>
            <div className="flex flex-wrap gap-1.5">
              {MANDATORY_STUDENT.map((m) => (
                <span key={m} className="px-2 py-0.5 text-[11px] rounded bg-[var(--bg-shell)] text-[var(--text-secondary)] border border-[var(--border)]">
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Toggleable groups */}
      {data.catalog.groups
        .slice()
        .sort((a, b) => (GROUP_ORDER[a.key] ?? 99) - (GROUP_ORDER[b.key] ?? 99))
        .map((group) => {
          const modules = groupedModules.get(group.key) ?? [];
          if (modules.length === 0) return null;
          return (
            <section key={group.key}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-2 px-1">
                {group.label}
              </h3>
              <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-lg overflow-hidden">
                {modules.map((m) => (
                  <ModuleToggleRow
                    key={m.flagKey}
                    module={m}
                    effective={effective[m.flagKey] ?? m.defaultEnabled}
                    onToggle={(next) => toggleOrConfirm(m, next)}
                  />
                ))}
              </div>
            </section>
          );
        })}

      {/* Sticky save bar */}
      {dirtyCount > 0 && (
        <div className="fixed bottom-0 left-[220px] right-0 bg-[var(--bg-card)] border-t border-[var(--border)] px-8 py-4 flex items-center justify-between gap-4 z-40">
          <div className="text-sm text-[var(--text-secondary)]">
            <span className="font-semibold text-[var(--text-primary)]">{dirtyCount}</span> change{dirtyCount === 1 ? '' : 's'} pending
            {errorMsg && (
              <span className="ml-3 text-red-400 text-xs">{errorMsg}</span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onReset}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--bg-shell)] rounded-lg border border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors disabled:opacity-50"
            >
              <RotateCcw size={14} /> Reset
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {confirmModule && (
        <ConfirmDisableModal
          module={confirmModule}
          onConfirm={commitDisable}
          onCancel={() => setConfirmModule(null)}
        />
      )}
    </div>
  );
}

// helper used by other files; not unused
export type { CenterFeatureFlagsResponse };
