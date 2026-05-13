import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthGate } from '@/components/auth-gate';
import { Sidebar } from '@/components/sidebar';
import { OverviewPage } from '@/pages/overview';
import { CentersPage } from '@/pages/centers';
import { CenterDetailPage } from '@/pages/center-detail';
import { UsersPage } from '@/pages/users';
import { AssessmentsPage } from '@/pages/assessments';
import { QuestionBankPage } from '@/pages/question-bank';
import { AllQuestionsPage } from '@/pages/all-questions';
import { RequestsPage } from '@/pages/requests';
import { AiUsagePage } from '@/pages/ai-usage';
import { StoragePage } from '@/pages/storage';
import { ExpenditurePage } from '@/pages/expenditure';
import { FeatureFlagsPage } from '@/pages/feature-flags';
import { FeatureFlagsDetailPage } from '@/pages/feature-flags-detail';
import { SystemHealthPage } from '@/pages/system-health';
import BillingLoginPage from '@/pages/billing/billing-login';
import BillingCentersPage from '@/pages/billing/billing-centers';
import BillingCenterDetailPage from '@/pages/billing/billing-center-detail';
import BillingInboxPage from '@/pages/billing/billing-inbox';
import BillingAuditPage from '@/pages/billing/billing-audit';
import { RequireBillingSession } from '@/components/billing/require-billing-session';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, staleTime: 30000 } },
});

function Shell() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[220px] p-8">
        <Outlet />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthGate>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            {/* Billing login is OUTSIDE the shell — entry point after AuthGate */}
            <Route path="/billing/login" element={<BillingLoginPage />} />

            <Route element={<Shell />}>
              <Route index element={<OverviewPage />} />
              <Route path="centers" element={<CentersPage />} />
              <Route path="centers/:id" element={<CenterDetailPage />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="assessments" element={<AssessmentsPage />} />
              <Route path="question-bank" element={<QuestionBankPage />} />
              <Route path="questions" element={<AllQuestionsPage />} />
              <Route path="requests" element={<RequestsPage />} />
              <Route path="ai" element={<AiUsagePage />} />
              <Route path="storage" element={<StoragePage />} />
              <Route path="expenditure" element={<ExpenditurePage />} />
              <Route path="feature-flags" element={<FeatureFlagsPage />} />
              <Route path="feature-flags/:id" element={<FeatureFlagsDetailPage />} />
              <Route path="system" element={<SystemHealthPage />} />

              {/* Billing routes — gated by session */}
              <Route
                path="billing/centers"
                element={
                  <RequireBillingSession>
                    <BillingCentersPage />
                  </RequireBillingSession>
                }
              />
              <Route
                path="billing/centers/:slug"
                element={
                  <RequireBillingSession>
                    <BillingCenterDetailPage />
                  </RequireBillingSession>
                }
              />
              <Route
                path="billing/inbox"
                element={
                  <RequireBillingSession>
                    <BillingInboxPage />
                  </RequireBillingSession>
                }
              />
              <Route
                path="billing/audit"
                element={
                  <RequireBillingSession>
                    <BillingAuditPage />
                  </RequireBillingSession>
                }
              />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthGate>
  );
}
