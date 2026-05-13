import axios from 'axios';
import type { CenterFeatureFlagsResponse } from '@/hooks/use-admin';

const ADMIN_KEY =
  import.meta.env.VITE_ADMIN_KEY ||
  'FjjkPINUC1zVum14ZhbSIyoMAsbQBYGAWfQJXsU8LZ1JtcstMF9tQkdz4AE0b5Kc';

export type EnvKey = 'prod' | 'uat' | 'demo';

export const ALL_ENVS: EnvKey[] = ['prod', 'uat', 'demo'];

const API_BASES: Record<EnvKey, string> = {
  prod: import.meta.env.VITE_API_URL_PROD || 'https://app-api.classpulseai.com',
  uat: import.meta.env.VITE_API_URL_UAT || 'https://uat-api.classpulseai.com',
  demo: import.meta.env.VITE_API_URL_DEMO || 'https://demo-api.classpulseai.com',
};

function envClient(env: EnvKey) {
  return axios.create({
    baseURL: `${API_BASES[env]}/api/v1/admin`,
    headers: { 'x-admin-key': ADMIN_KEY },
    timeout: 15000,
  });
}

export interface EnvResult<T> {
  env: EnvKey;
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

// All-or-nothing broadcast: snapshot → patch all → revert if any fail.
// Caveats: best-effort consistency (no cross-env lock between snapshot and
// patch, so a concurrent admin write would race). Revert uses the snapshot
// state, not whatever's there at revert time.
export async function broadcastFeatureFlagPatch(
  centerId: string,
  flags: Record<string, boolean>,
  changedBy?: string,
): Promise<{
  allOk: boolean;
  results: EnvResult<CenterFeatureFlagsResponse>[];
  primaryResponse: CenterFeatureFlagsResponse | null;
}> {
  const flagKeys = Object.keys(flags);

  // Step 1: snapshot the keys we're about to touch, from every env.
  const snapshots = await Promise.all(
    ALL_ENVS.map(async (env): Promise<EnvResult<Record<string, boolean>>> => {
      try {
        const r = await envClient(env).get<{
          success: boolean;
          data: CenterFeatureFlagsResponse;
        }>(`/centers/${centerId}/feature-flags`);
        const cur = r.data.data.flags as Record<string, boolean>;
        const before: Record<string, boolean> = {};
        for (const k of flagKeys) before[k] = cur[k];
        return { env, ok: true, data: before };
      } catch (e) {
        const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string };
        return {
          env,
          ok: false,
          error: err?.response?.data?.message ?? err?.message ?? 'unknown error',
          status: err?.response?.status,
        };
      }
    }),
  );

  // If snapshotting failed anywhere, abort before any writes.
  const snapshotFailed = snapshots.filter((s) => !s.ok);
  if (snapshotFailed.length > 0) {
    return {
      allOk: false,
      results: snapshots.map((s) => ({
        env: s.env,
        ok: false,
        error: s.ok
          ? `Aborted — couldn't read current state on ${snapshotFailed
              .map((f) => f.env)
              .join(', ')}`
          : s.error,
        status: s.status,
      })),
      primaryResponse: null,
    };
  }

  // Step 2: PATCH new flags on every env, in parallel.
  const patches = await Promise.all(
    ALL_ENVS.map(async (env): Promise<EnvResult<CenterFeatureFlagsResponse>> => {
      try {
        const r = await envClient(env).patch<{
          success: boolean;
          data: CenterFeatureFlagsResponse;
        }>(`/centers/${centerId}/feature-flags`, { flags, changedBy });
        return { env, ok: true, data: r.data.data, status: r.status };
      } catch (e) {
        const err = e as { response?: { data?: { message?: string }; status?: number }; message?: string };
        return {
          env,
          ok: false,
          error: err?.response?.data?.message ?? err?.message ?? 'unknown error',
          status: err?.response?.status,
        };
      }
    }),
  );

  const patchFailed = patches.filter((p) => !p.ok);
  if (patchFailed.length === 0) {
    const prod = patches.find((p) => p.env === 'prod');
    return { allOk: true, results: patches, primaryResponse: prod?.data ?? null };
  }

  // Step 3: revert any envs that succeeded.
  const toRevert = patches.filter((p) => p.ok);
  const revertResults = await Promise.all(
    toRevert.map(async (p): Promise<{ env: EnvKey; reverted: boolean; error?: string }> => {
      const snap = snapshots.find((s) => s.env === p.env);
      if (!snap?.data) return { env: p.env, reverted: false, error: 'no snapshot' };
      try {
        await envClient(p.env).patch(`/centers/${centerId}/feature-flags`, {
          flags: snap.data,
          changedBy: changedBy ? `${changedBy} (revert)` : 'revert',
        });
        return { env: p.env, reverted: true };
      } catch (e) {
        const err = e as { message?: string };
        return { env: p.env, reverted: false, error: err?.message ?? 'unknown error' };
      }
    }),
  );

  const failedEnvList = patchFailed.map((f) => f.env).join(', ');
  const revertFailed = revertResults.filter((r) => !r.reverted);
  const tail = revertFailed.length > 0
    ? ` — revert ALSO failed on ${revertFailed.map((r) => r.env).join(', ')}; manual fix needed`
    : ' — other envs reverted';

  return {
    allOk: false,
    results: patches.map((p) => ({
      ...p,
      ok: false,
      error: p.ok ? `Broadcast failed on ${failedEnvList}${tail}` : p.error,
    })),
    primaryResponse: null,
  };
}
