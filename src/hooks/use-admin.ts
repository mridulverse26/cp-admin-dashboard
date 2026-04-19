import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function useOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => api.get('/overview').then(r => r.data.data),
    refetchInterval: 30000,
  });
}

export function useCenters() {
  return useQuery({
    queryKey: ['admin-centers'],
    queryFn: () => api.get('/centers').then(r => r.data.data),
  });
}

export function useCenterDetail(id: string) {
  return useQuery({
    queryKey: ['admin-center', id],
    queryFn: () => api.get(`/centers/${id}`).then(r => r.data.data),
    enabled: !!id,
  });
}

export function useUsers(params?: { role?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get('/users', { params }).then(r => r.data.data),
  });
}

export function useOnlineUsers() {
  return useQuery({
    queryKey: ['admin-online'],
    queryFn: () => api.get('/users/online').then(r => r.data.data),
    refetchInterval: 15000,
  });
}

export function useEngagement() {
  return useQuery({
    queryKey: ['admin-engagement'],
    queryFn: () => api.get('/engagement').then(r => r.data.data),
  });
}

export function useAssessmentAnalytics() {
  return useQuery({
    queryKey: ['admin-assessments'],
    queryFn: () => api.get('/assessments').then(r => r.data.data),
  });
}

export function useGrowth() {
  return useQuery({
    queryKey: ['admin-growth'],
    queryFn: () => api.get('/growth').then(r => r.data.data),
  });
}

export function useQuestionBank() {
  return useQuery({
    queryKey: ['admin-qbank'],
    queryFn: () => api.get('/questions').then(r => r.data.data),
  });
}

export function useAIUsage() {
  return useQuery({
    queryKey: ['admin-ai-usage'],
    queryFn: () => api.get('/ai-usage').then(r => r.data.data),
  });
}

export function useMonitor() {
  return useQuery({
    queryKey: ['admin-monitor'],
    queryFn: () => api.get('/monitor').then(r => r.data.data),
    refetchInterval: 30000,
    refetchIntervalInBackground: true,
  });
}
