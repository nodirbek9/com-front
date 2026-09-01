import { newIdempotencyKey, normalizePage, request } from './client';
import type { ApplicationResponse, ApplicationSummary, CaseItemInput, CaseResponse, ServiceSummary, UUID } from '@/types/api';

export const applicationsApi = {
  list: (page = 0, size = 20) =>
    request<unknown>('/api/applications', { query: { page, size, sort: 'createdAt,desc' } })
      .then((r) => normalizePage<ApplicationSummary>(r)),
  get: (id: UUID) => request<ApplicationResponse>(`/api/applications/${id}`),
  create: (payload: { serviceId: UUID; submissionChannel: string; formData: Record<string, unknown>; items: CaseItemInput[] }) =>
    request<ApplicationResponse>('/api/applications', { method: 'POST', body: payload }),
  submit: (id: UUID) => request<ApplicationResponse>(`/api/applications/${id}/submit`, { method: 'POST' }),
  register: (id: UUID, note?: string) =>
    request<CaseResponse>(`/api/applications/${id}/register`, {
      method: 'POST', body: { note: note ?? null }, idempotencyKey: newIdempotencyKey(),
    }),
};

/** GET /api/services — the public catalog any authenticated user (including APPLICANT) may read.
 *  Distinct from admin.services(), which is REFERENCE_DATA:VIEW-gated (ADMIN only). */
export const serviceCatalogApi = {
  list: () => request<ServiceSummary[]>('/api/services'),
};
