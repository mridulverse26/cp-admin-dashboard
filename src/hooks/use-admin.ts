import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { broadcastFeatureFlagPatch, type EnvResult } from '@/lib/multi-env';

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
  status: 'UPLOADED' | 'PROCESSING' | 'PARSED' | 'NEEDS_REVIEW' | 'FAILED';
  questionsFound: number;
  questionsParsed: number;
  questionsInserted: number;
  topic: string | null;
  processingError: string | null;
  createdAt: string;
  // v2 — populated by the teacher upload flow; null/0 for legacy admin-S3 sync.
  subject?: string | null;
  grade?: number | null;
  board?: string | null;
  folderId?: string | null;
  folderName?: string | null;
  uploadedBy?: string | null;
  uploadedByName?: string | null;
  processingStep?: string | null;
  processingProgress?: number;
  duplicatesMerged?: number;
  needsReviewCount?: number;
  uploadSource?: 'admin' | 'teacher';
}

export interface QuestionBankCenterGroup {
  centerId: string;
  centerName: string;
  centerSlug: string;
  pdfCount: number;
  totalQuestionsInserted: number;
  totalStorageBytes?: number;
  pdfs: QuestionBankPdf[];
}

export function useQuestionBankPdfs() {
  return useQuery<QuestionBankCenterGroup[]>({
    queryKey: ['admin-question-bank-pdfs'],
    queryFn: () => api.get('/question-bank').then(r => r.data.data),
  });
}

export interface QuestionBankBreakdown {
  total: number;
  bySubject: Array<{ subject: string; count: number }>;
  byTopic: Array<{ subject: string; topic: string; count: number }>;
}

export function useQuestionBankBreakdown(centerId: string | null) {
  return useQuery<QuestionBankBreakdown>({
    queryKey: ['admin-question-bank-breakdown', centerId],
    queryFn: () =>
      api.get(`/question-bank/centers/${centerId}/breakdown`).then(r => r.data.data),
    enabled: !!centerId,
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

// ── Marketing — Leads + Applications ──────────────────────────────

export type MarketingLeadStatus = 'NEW' | 'CONTACTED' | 'CLOSED';
export type InternApplicationStatus = 'NEW' | 'SHORTLISTED' | 'REJECTED' | 'CLOSED';

export interface MarketingLead {
  id: string;
  name: string;
  phone: string;
  whatsappOk: boolean;
  instituteName: string;
  studentCount: string;
  classes: string[];
  competitiveExams: string[] | null;
  message: string | null;
  source: string;
  ipAddress: string | null;
  userAgent: string | null;
  status: MarketingLeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface InternApplication {
  id: string;
  name: string;
  phone: string;
  whatsappOk: boolean;
  email: string;
  area: string;
  areaCustom: string | null;
  hasVehicle: boolean;
  education: string;
  startDate: string;
  weeklyHours: string;
  linkedinUrl: string | null;
  gatekeeperStory: string;
  whyClasspulse: string;
  audioS3Key: string | null;
  audioDurationSec: number | null;
  ipAddress: string | null;
  userAgent: string | null;
  status: InternApplicationStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function useLeads(status?: MarketingLeadStatus) {
  return useQuery<MarketingLead[]>({
    queryKey: ['admin-leads', status ?? 'all'],
    queryFn: () => api.get('/leads', { params: status ? { status } : {} }).then(r => r.data.data),
  });
}

export function useApplications(status?: InternApplicationStatus) {
  return useQuery<InternApplication[]>({
    queryKey: ['admin-applications', status ?? 'all'],
    queryFn: () => api.get('/applications', { params: status ? { status } : {} }).then(r => r.data.data),
  });
}

export function patchLead(id: string, body: { status?: MarketingLeadStatus; notes?: string | null }) {
  return api.patch(`/leads/${id}`, body).then(r => r.data.data as MarketingLead);
}

export function patchApplication(id: string, body: { status?: InternApplicationStatus; notes?: string | null }) {
  return api.patch(`/applications/${id}`, body).then(r => r.data.data as InternApplication);
}

export function fetchApplicationAudioUrl(id: string) {
  return api.get(`/applications/${id}/audio-url`).then(r => r.data.data as { url: string; expiresAt: string } | null);
}

// ── AWS Monitoring (Storage + Spend) ──────────────────────────────

export interface AwsBucketSnapshot {
  name: string;
  sizeBytes: number;
  objectCount: number;
  lastUpdated: string | null;
}

export interface AwsStorageReport {
  buckets: AwsBucketSnapshot[];
  totalBytes: number;
  totalObjects: number;
  lastUpdated: string;
  cached: boolean;
}

export interface AwsSpendByDay {
  date: string;
  amount: number;
}

export interface AwsSpendByService {
  service: string;
  amount: number;
}

export interface AwsSpendReport {
  daily: AwsSpendByDay[];
  byService: AwsSpendByService[];
  mtdTotal: number;
  rangeTotal: number;
  currency: string;
  days: number;
  lastUpdated: string;
  cached: boolean;
}

export function useAwsStorage() {
  return useQuery<AwsStorageReport>({
    queryKey: ['admin-aws-storage'],
    queryFn: () => api.get('/aws/storage').then(r => r.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

export function useAwsSpend(days: number) {
  return useQuery<AwsSpendReport>({
    queryKey: ['admin-aws-spend', days],
    queryFn: () => api.get('/aws/spend', { params: { days } }).then(r => r.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

export interface AwsCenterStorage {
  id: string;
  name: string;
  slug: string;
  plan: string;
  usedBytes: number;
  quotaBytes: number;
  fileCount: number;
  percentUsed: number;
}

export interface AwsStorageByCenterReport {
  centers: AwsCenterStorage[];
  totals: {
    trackedBytes: number;
    totalQuotaBytes: number;
    utilizationPct: number;
    centerCount: number;
    bucketBytes: number;
    untrackedBytes: number;
  };
}

export function useAwsStorageByCenter() {
  return useQuery<AwsStorageByCenterReport>({
    queryKey: ['admin-aws-storage-by-center'],
    queryFn: () => api.get('/aws/storage/by-center').then(r => r.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

// ── Admin: cross-tenant Question Bank browse ──────────────────────────

export type AdminQuestionScope = 'all' | 'global' | 'center';
export type AdminReviewStatus = 'AUTO_APPROVED' | 'NEEDS_REVIEW' | 'REJECTED';
export type AdminQuestionNature = 'CONCEPTUAL' | 'NUMERICAL' | 'FACTUAL' | 'APPLICATION';

export interface AdminQuestionFilters {
  scope?: AdminQuestionScope;
  centerId?: string;
  subject?: string;
  topic?: string;
  subTopic?: string;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  questionType?: 'mcq' | 'subjective';
  board?: string;
  grade?: number;
  nature?: AdminQuestionNature;
  source?: string;
  reviewStatus?: AdminReviewStatus;
  isPyq?: boolean;
  pyqExam?: string;
  pyqYear?: string;
  competitiveExam?: string;
  ncertOrigin?: string;
  ncertChapter?: string;
  hasImages?: boolean;
  sourcePdfId?: string;
  search?: string;
  limit?: number;
}

export interface AdminBankQuestion {
  id: string;
  questionText: string;
  questionType: 'mcq' | 'subjective';
  options: { id: string; text: string; isCorrect: boolean }[] | null;
  correctOption: string | null;
  answerSource: 'key' | 'ai' | 'manual' | null;
  marks: number;
  difficulty: string;
  subject: string;
  topic: string | null;
  subTopic: string | null;
  board: string | null;
  competitiveExamRelevance: string[] | null;
  isPyq: boolean;
  pyqExam: string | null;
  pyqYear: string | null;
  pyqSource: string | null;
  source: string;
  ncertChapter: string | null;
  ncertTopic: string | null;
  ncertOrigin: string | null;
  nature: AdminQuestionNature | null;
  grade: number | null;
  estimatedTimeSec: number | null;
  requiresFigure: boolean;
  figureS3Url: string | null;
  appearanceCount: number;
  teacherRating: number;
  reviewStatus: AdminReviewStatus;
  confidenceScore: number | null;
  sourcePdfId: string | null;
  sourcePage: number | null;
  isDuplicate: boolean;
  coachingCenterId: string | null;
  createdAt: string;
  updatedAt: string;
  // hydrated by the admin endpoint
  centerName: string | null;
  centerSlug: string | null;
  sourcePdfName: string | null;
}

export interface AdminQuestionsPage {
  items: AdminBankQuestion[];
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface AdminQuestionsStats {
  filteredTotal: number;
  totalAll: number;
  totalGlobal: number;
  bySubject: Array<{ subject: string; count: number }>;
  byDifficulty: Array<{ difficulty: string; count: number }>;
  byBoard: Array<{ board: string; count: number }>;
  byCenter: Array<{ centerId: string | null; centerName: string; count: number }>;
}

export interface AdminQuestionFilterOptions {
  subjects: string[];
  topics: Array<{ subject: string; topic: string }>;
  boards: string[];
  pyqExams: string[];
  pyqYears: string[];
  ncertChapters: Array<{ subject: string; chapter: string }>;
}

function adminQuestionsParams(filters: AdminQuestionFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(filters)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'boolean') out[k] = v ? 'true' : 'false';
    else out[k] = String(v);
  }
  return out;
}

export function useAdminQuestions(filters: AdminQuestionFilters) {
  return useInfiniteQuery<AdminQuestionsPage>({
    queryKey: ['admin-bank-questions', filters],
    queryFn: ({ pageParam }) =>
      api
        .get('/question-bank/all', {
          params: { ...adminQuestionsParams(filters), cursor: pageParam || undefined },
        })
        .then(r => r.data.data),
    initialPageParam: '' as string,
    getNextPageParam: last => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
}

export function useAdminQuestionsStats(filters: AdminQuestionFilters) {
  return useQuery<AdminQuestionsStats>({
    queryKey: ['admin-bank-questions-stats', filters],
    queryFn: () =>
      api
        .get('/question-bank/all/stats', { params: adminQuestionsParams(filters) })
        .then(r => r.data.data),
  });
}

export function useAdminQuestionsFilterOptions() {
  return useQuery<AdminQuestionFilterOptions>({
    queryKey: ['admin-bank-questions-filter-options'],
    queryFn: () => api.get('/question-bank/all/filter-options').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePatchAdminQuestionReview() {
  const queryClient = useQueryClient();
  return async (id: string, reviewStatus: AdminReviewStatus) => {
    const result = await api
      .patch(`/question-bank/questions/${id}/review-status`, { reviewStatus })
      .then(r => r.data.data as { id: string; reviewStatus: AdminReviewStatus });
    queryClient.invalidateQueries({ queryKey: ['admin-bank-questions'] });
    queryClient.invalidateQueries({ queryKey: ['admin-bank-questions-stats'] });
    return result;
  };
}

/* ────────────────── Per-tenant feature flags ────────────────── */

export type FeatureFlagModuleKey =
  | 'teachingPlan'
  | 'resources'
  | 'mcq'
  | 'theory'
  | 'dpp'
  | 'homework'
  | 'questionBank'
  | 'doubts'
  | 'parentReports'
  | 'fees'
  | 'leaderboard';

export type FeatureFlagKey = `module.${FeatureFlagModuleKey}`;

export interface FeatureFlagModuleDefinition {
  key: FeatureFlagModuleKey;
  flagKey: FeatureFlagKey;
  label: string;
  description: string;
  group: 'daily' | 'assessments' | 'manage' | 'student';
  defaultEnabled: boolean;
  legacyKeys?: string[];
}

export interface CenterFeatureFlagsResponse {
  centerId: string;
  centerName: string;
  centerSlug: string;
  flags: Record<FeatureFlagKey, boolean>;
  catalog: {
    modules: FeatureFlagModuleDefinition[];
    groups: { key: string; label: string; order: number }[];
  };
  lastChange: { changedBy: string; changedKeys: string[]; createdAt: string } | null;
}

export interface CenterFlagsSummary {
  centerId: string;
  centerName: string;
  centerSlug: string;
  enabledCount: number;
  totalCount: number;
  disabledModules: FeatureFlagModuleKey[];
  lastChange: { changedBy: string; createdAt: string } | null;
}

export function useFeatureFlagSummaries() {
  return useQuery<CenterFlagsSummary[]>({
    queryKey: ['admin-feature-flags-summary'],
    queryFn: () => api.get('/feature-flags').then(r => r.data.data),
    staleTime: 60_000,
  });
}

export function useCenterFeatureFlags(centerId: string | undefined) {
  return useQuery<CenterFeatureFlagsResponse>({
    queryKey: ['admin-center-feature-flags', centerId],
    queryFn: () =>
      api.get(`/centers/${centerId}/feature-flags`).then(r => r.data.data),
    enabled: !!centerId,
  });
}

// Broadcast feature-flag PATCHes across prod/uat/demo with all-or-nothing
// semantics. The error this throws on partial failure carries a `results`
// field so the UI can show per-env status without reparsing the message.
export class BroadcastError extends Error {
  results: EnvResult<CenterFeatureFlagsResponse>[];
  constructor(message: string, results: EnvResult<CenterFeatureFlagsResponse>[]) {
    super(message);
    this.name = 'BroadcastError';
    this.results = results;
  }
}

export function usePatchCenterFeatureFlags() {
  const queryClient = useQueryClient();
  return async (centerId: string, flags: Record<string, boolean>, changedBy?: string) => {
    const { allOk, results, primaryResponse } = await broadcastFeatureFlagPatch(
      centerId,
      flags,
      changedBy,
    );
    if (!allOk || !primaryResponse) {
      const failures = results.filter((r) => !r.ok).map((r) => `${r.env}: ${r.error ?? 'failed'}`);
      throw new BroadcastError(
        `Broadcast failed (reverted where possible). ${failures.join(' | ')}`,
        results,
      );
    }
    queryClient.invalidateQueries({ queryKey: ['admin-center-feature-flags', centerId] });
    queryClient.invalidateQueries({ queryKey: ['admin-feature-flags-summary'] });
    return primaryResponse;
  };
}
