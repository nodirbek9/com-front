import { newIdempotencyKey, normalizePage, request } from './client';
import type {
  ApplicantTracking, AuditEntry, CaseItem, CaseResponse, CaseSummary, CommentResponse,
  Page, PrimaryCheckCategory, PrimaryCheckDecision, StageTimelineItem, UUID,
} from '@/types/api';

export interface CaseFilters {
  status?: string; serviceId?: string; departmentId?: string; mode?: string;
  overdue?: boolean; q?: string; page?: number; size?: number; sort?: string;
}

export const casesApi = {
  list: (f: CaseFilters = {}) =>
    request<unknown>('/api/cases', { query: { ...f, sort: f.sort ?? 'createdAt,desc', size: f.size ?? 20 } })
      .then((r) => normalizePage<CaseSummary>(r)),
  get: (id: UUID) => request<CaseResponse>(`/api/cases/${id}`),
  timeline: (id: UUID) => request<StageTimelineItem[]>(`/api/cases/${id}/timeline`),
  tracking: (id: UUID) => request<ApplicantTracking>(`/api/cases/${id}/tracking`),
  items: (id: UUID) => request<CaseItem[]>(`/api/cases/${id}/items`),
  saveItems: (id: UUID, items: CaseItem[]) =>
    request<CaseItem[]>(`/api/cases/${id}/items`, { method: 'PUT', body: items }),
  comments: (id: UUID) => request<CommentResponse[]>(`/api/cases/${id}/comments`),
  addComment: (id: UUID, body: string, documentVersionId?: UUID) =>
    request<CommentResponse>(`/api/cases/${id}/comments`, { method: 'POST', body: { body, documentVersionId } }),
  primaryCheck: (id: UUID, payload: {
    category: PrimaryCheckCategory; decision: PrimaryCheckDecision; reason?: string; newWorkflowId?: string;
  }) =>
    request<CaseResponse>(`/api/cases/${id}/primary-check`, {
      method: 'POST', body: payload, idempotencyKey: newIdempotencyKey(),
    }),
  audit: (id: UUID, page = 0, size = 100) =>
    request<unknown>(`/api/cases/${id}/audit`, { query: { page, size, sort: 'createdAt,desc' } })
      .then((r) => normalizePage<AuditEntry>(r)),
};

export type { Page };
