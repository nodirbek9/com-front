import { request } from './client';
import type { ApprovalMode, ApprovalRound, DocumentResponse, DocumentSummary, DocumentVersion, UUID } from '@/types/api';

export const documentsApi = {
  listForCase: (caseId: UUID) => request<DocumentSummary[]>(`/api/cases/${caseId}/documents`),
  create: (caseId: UUID, body: { documentType: string; title: string; taskId?: UUID }) =>
    request<DocumentResponse>(`/api/cases/${caseId}/documents`, { method: 'POST', body }),
  get: (id: UUID) => request<DocumentResponse>(`/api/documents/${id}`),
  addVersion: (id: UUID, body: {
    contentRef: string; contentHash: string; fileName?: string; mimeType?: string;
    sizeBytes?: number; fields?: string; revisionReason?: string | null;
  }) => request<DocumentVersion>(`/api/documents/${id}/versions`, { method: 'POST', body }),
  getVersion: (id: UUID, versionNo: number) => request<DocumentVersion>(`/api/documents/${id}/versions/${versionNo}`),
  sign: (id: UUID, versionNo: number, note?: string) =>
    request<DocumentVersion>(`/api/documents/${id}/versions/${versionNo}/sign`, { method: 'POST', body: { note: note || null } }),
  startApproval: (id: UUID, versionNo: number, body: {
    mode: ApprovalMode;
    participants: { kind: 'USER' | 'DEPARTMENT'; userId?: UUID; departmentId?: UUID; required: boolean; sequenceNo: number }[];
  }) => request<ApprovalRound>(`/api/documents/${id}/versions/${versionNo}/approval-rounds`, { method: 'POST', body }),
};
