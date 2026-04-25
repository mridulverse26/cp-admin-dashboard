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

export interface AdminStudentRow {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  avatar: string | null;
  xp: number | null;
  level: number | null;
  currentStreak: number | null;
  targetExam: string | null;
  grade: string | null;
  lastActiveAt: string | null;
  createdAt: string;
}

export interface AdminCenterWithStudents {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  plan: string;
  isActive: boolean;
  logoUrl: string | null;
  primaryColor: string | null;
  createdAt: string;
  ownerName: string | null;
  ownerPhone: string | null;
  ownerEmail: string | null;
  ownerLastActiveAt: string | null;
  studentCount: number;
  students: AdminStudentRow[];
}

export function useCentersWithStudents() {
  return useQuery<AdminCenterWithStudents[]>({
    queryKey: ['admin-centers-with-students'],
    queryFn: () => api.get('/centers-with-students').then(r => r.data.data),
  });
}

export interface QuestionBankPdf {
  id: string;
  originalName: string;
  s3Bucket: string;
  s3Key: string;
  fileSizeBytes: number | null;
  pages: number | null;
  status: 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'FAILED';
  questionsFound: number;
  questionsParsed: number;
  questionsInserted: number;
  topic: string | null;
  processingError: string | null;
  createdAt: string;
}

export interface QuestionBankCenterGroup {
  centerId: string;
  centerName: string;
  centerSlug: string;
  pdfCount: number;
  totalQuestionsInserted: number;
  pdfs: QuestionBankPdf[];
}

export function useQuestionBankPdfs() {
  return useQuery<QuestionBankCenterGroup[]>({
    queryKey: ['admin-question-bank-pdfs'],
    queryFn: () => api.get('/question-bank').then(r => r.data.data),
  });
}

export function syncQuestionBank(): Promise<{ scanned: number; inserted: number; alreadyKnown: number }> {
  return api.post('/question-bank/sync').then(r => r.data.data);
}

export function fetchQuestionBankPdfUrl(id: string): Promise<{ url: string; expiresAt: string }> {
  return api.get(`/question-bank/${id}/url`).then(r => r.data.data);
}

export interface ParsedMcqOption {
  letter: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface ParsedMcqTags {
  subject: string | null;
  topic: string | null;
  subTopic: string | null;
  difficulty: string | null;
  board: string | null;
  competitiveExamRelevance: string[] | null;
  isPyq: boolean;
  pyqExam: string | null;
  pyqYear: string | null;
  nature: string | null;
  ncertOrigin: string | null;
  ncertChapter: string | null;
  ncertTopic: string | null;
  grade: number | null;
  appearanceCount: number | null;
  teacherRating: number | null;
  reviewStatus: string | null;
  confidenceScore: number | null;
}

export interface ParsedMcq {
  number: number;
  stem: string;
  options: ParsedMcqOption[];
  correctLetter: 'A' | 'B' | 'C' | 'D' | null;
  answerSource: 'key' | 'ai' | 'manual' | null;
  tags?: ParsedMcqTags;
}

export interface ParsedQuestionsResponse {
  file: string;
  topic: string | null;
  pages: number | null;
  status: string;
  totalBlocksFound: number;
  questions: ParsedMcq[];
  skipped: Array<{ number: number | null; reason: string }>;
}

export function fetchQuestionBankPdfQuestions(id: string): Promise<ParsedQuestionsResponse> {
  return api.get(`/question-bank/${id}/questions`).then(r => r.data.data);
}

export function useUsers(params?: { role?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['admin-users', params],
    queryFn: () => api.get('/users', { params }).then(r => r.data.data),
  });
}

export interface AdminOnlineUser {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  role: 'CENTER_OWNER' | 'TEACHER' | 'STUDENT' | 'PARENT';
  lastActiveAt: string;
  centerId: string | null;
  centerName: string | null;
  centerSlug: string | null;
  avatar: string | null;
  xp: number | null;
  currentStreak: number | null;
  targetExam: string | null;
  grade: string | null;
}

export function useOnlineUsers() {
  return useQuery<AdminOnlineUser[]>({
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
