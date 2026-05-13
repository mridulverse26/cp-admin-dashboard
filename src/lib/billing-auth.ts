/**
 * Billing-admin session state — separate from the static admin-key auth used
 * by the rest of the dashboard. Stored in sessionStorage (NOT localStorage)
 * so a closed tab forces re-login.
 *
 * Two token tiers:
 *   - sessionToken: 8h, identifies the admin (Mridul or Anant)
 *   - stepUpToken:  5min, required for mutating endpoints (subscription panel,
 *                   approve/reject change requests, secret rotation)
 *
 * Both are JWTs signed by the backend — we treat them as opaque.
 */
const SESSION_KEY = 'cp.billing.session';
const STEPUP_KEY = 'cp.billing.stepup';

export interface BillingSession {
  token: string;
  expiresAt: string; // ISO
  admin: { id: string; email: string; displayName: string };
}

export interface StepUpToken {
  token: string;
  expiresAt: string; // ISO
}

export function getSession(): BillingSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BillingSession;
    if (new Date(parsed.expiresAt) <= new Date()) {
      clearSession();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setSession(s: BillingSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(STEPUP_KEY);
}

export function getStepUp(): StepUpToken | null {
  try {
    const raw = sessionStorage.getItem(STEPUP_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StepUpToken;
    if (new Date(parsed.expiresAt) <= new Date()) {
      sessionStorage.removeItem(STEPUP_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setStepUp(s: StepUpToken): void {
  sessionStorage.setItem(STEPUP_KEY, JSON.stringify(s));
}

export function clearStepUp(): void {
  sessionStorage.removeItem(STEPUP_KEY);
}
