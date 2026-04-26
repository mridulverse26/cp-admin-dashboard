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
import { RequestsPage } from '@/pages/requests';
import { AiUsagePage } from '@/pages/ai-usage';
import { SystemHealthPage } from '@/pages/system-health';

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
          <Route element={<Shell />}>
            <Route index element={<OverviewPage />} />
            <Route path="centers" element={<CentersPage />} />
            <Route path="centers/:id" element={<CenterDetailPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="assessments" element={<AssessmentsPage />} />
            <Route path="question-bank" element={<QuestionBankPage />} />
            <Route path="requests" element={<RequestsPage />} />
            <Route path="ai" element={<AiUsagePage />} />
            <Route path="system" element={<SystemHealthPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </AuthGate>
  );
}
