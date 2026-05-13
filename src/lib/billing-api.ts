import axios from 'axios';
import type { AxiosInstance } from 'axios';
import { getSession, getStepUp, clearSession } from './billing-auth';

export type EnvKey = 'prod' | 'uat' | 'demo';
export const ALL_ENVS: EnvKey[] = ['prod', 'uat', 'demo'];

const ADMIN_KEY =
  import.meta.env.VITE_ADMIN_KEY ||
  'FjjkPINUC1zVum14ZhbSIyoMAsbQBYGAWfQJXsU8LZ1JtcstMF9tQkdz4AE0b5Kc';

const API_BASES: Record<EnvKey, string> = {
  prod: import.meta.env.VITE_API_URL_PROD || 'https://app-api.classpulseai.com',
  uat: import.meta.env.VITE_API_URL_UAT || 'https://uat-api.classpulseai.com',
  demo: import.meta.env.VITE_API_URL_DEMO || 'https://demo-api.classpulseai.com',
};

/** Default (single-env) axios client — points at VITE_API_URL like the rest
 *  of the admin app, but injects the billing session + step-up headers. */
function buildClient(baseURL: string): AxiosInstance {
  const client = axios.create({ baseURL, timeout: 20000 });

  client.interceptors.request.use((config) => {
    config.headers = config.headers ?? ({} as any);
    (config.headers as any)['x-admin-key'] = ADMIN_KEY;
    const session = getSession();
    if (session) (config.headers as any)['Authorization'] = `Bearer ${session.token}`;
    const stepUp = getStepUp();
    if (stepUp) (config.headers as any)['X-Step-Up-Token'] = stepUp.token;
    return config;
  });

  client.interceptors.response.use(
    (r) => r,
    (err) => {
      const status = err?.response?.status;
      const path = (err?.config?.url ?? '') as string;
      // Auto-logout on session-token expiry (NOT step-up — that just needs a re-prompt)
      if (
        status === 401 &&
        path.includes('/billing/admin/') &&
        !path.endsWith('/login') &&
        !path.endsWith('/verify-totp') &&
        !path.endsWith('/step-up')
      ) {
        const message = err?.response?.data?.message ?? '';
        if (!message.toLowerCase().includes('step-up')) clearSession();
      }
      return Promise.reject(err);
    },
  );
  return client;
}

export const billingApi = buildClient(
  (import.meta.env.VITE_API_URL_PROD || API_BASES.prod) + '/api/v1',
);

const envClients: Record<EnvKey, AxiosInstance> = {
  prod: buildClient(API_BASES.prod + '/api/v1'),
  uat: buildClient(API_BASES.uat + '/api/v1'),
  demo: buildClient(API_BASES.demo + '/api/v1'),
};

export function envClient(env: EnvKey): AxiosInstance {
  return envClients[env];
}

export interface EnvResult<T> {
  env: EnvKey;
  ok: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Sequential demo → uat → prod broadcast for billing mutations. Production
 * is LAST and runs only if both demo+uat succeed. If prod fails after
 * demo+uat succeeded, demo+uat stay applied (they're test envs; better to
 * have them ahead of prod than to silently roll back without user awareness).
 *
 * The 30-second cancel window before prod is implemented in the UI layer,
 * not here — callers pass `onBeforeProd: () => Promise<boolean>` to gate.
 */
export async function broadcastBillingMutation<T>(
  request: (client: AxiosInstance) => Promise<{ data: { success: true; data: T } }>,
  options: {
    onBeforeProd?: () => Promise<boolean>;
    onEnvProgress?: (env: EnvKey, ok: boolean, error?: string) => void;
  } = {},
): Promise<{ allOk: boolean; results: EnvResult<T>[]; primary: T | null }> {
  const order: EnvKey[] = ['demo', 'uat', 'prod'];
  const results: EnvResult<T>[] = [];

  for (let i = 0; i < order.length; i++) {
    const env = order[i];

    // Before prod: optional cancellable confirmation
    if (env === 'prod' && options.onBeforeProd) {
      const proceed = await options.onBeforeProd();
      if (!proceed) {
        results.push({ env, ok: false, error: 'Cancelled by user before prod apply' });
        options.onEnvProgress?.(env, false, 'cancelled');
        return { allOk: false, results, primary: null };
      }
    }

    // If a previous env failed, skip subsequent ones — prod must never run if uat/demo broke
    const priorFailed = results.some((r) => !r.ok);
    if (priorFailed) {
      results.push({ env, ok: false, error: 'Skipped — prior env failed' });
      options.onEnvProgress?.(env, false, 'skipped');
      continue;
    }

    try {
      const resp = await request(envClient(env));
      results.push({ env, ok: true, data: resp.data.data, status: 200 });
      options.onEnvProgress?.(env, true);
    } catch (e) {
      const err = e as {
        response?: { data?: { message?: string }; status?: number };
        message?: string;
      };
      const error = err?.response?.data?.message ?? err?.message ?? 'unknown error';
      results.push({ env, ok: false, error, status: err?.response?.status });
      options.onEnvProgress?.(env, false, error);
    }
  }

  const allOk = results.every((r) => r.ok);
  const primary = results.find((r) => r.env === 'prod' && r.ok)?.data ?? null;
  return { allOk, results, primary };
}

