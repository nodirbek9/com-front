import { normalizePage, request } from './client';
import type { AuditEntry, AuditIntegrity, PerformedWork, UUID } from '@/types/api';

export const auditApi = {
  search: (q: { caseId?: UUID; userId?: UUID; action?: string; entityType?: string; page?: number } = {}) =>
    request<unknown>('/api/audit', { query: { ...q, size: 50, sort: 'createdAt,desc' } })
      .then((r) => normalizePage<AuditEntry>(r)),
  integrity: () => request<AuditIntegrity>('/api/audit/integrity'),
};

export const performedWorkApi = {
  forCase: (caseId: UUID) => request<PerformedWork[]>(`/api/cases/${caseId}/performed-works`),
};
