import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { getSession } from '@/lib/billing-auth';

/**
 * Wraps all billing routes. Redirects to /billing/login if no session is
 * present (or it's expired). The actual auth check happens server-side via
 * the BillingAdminGuard — this just keeps users from seeing empty UI.
 */
export function RequireBillingSession({ children }: { children: ReactNode }) {
  const session = getSession();
  const location = useLocation();
  if (!session) {
    return <Navigate to="/billing/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
