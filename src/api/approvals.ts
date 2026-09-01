import { normalizePage, request } from './client';
import type { ApprovalRound, ApprovalTaskResponse, ApprovalTaskSummary, UUID } from '@/types/api';

export const approvalsApi = {
  mine: (page = 0, size = 50) =>
    request<unknown>('/api/approvals/my', { query: { page, size } }).then((r) => normalizePage<ApprovalTaskSummary>(r)),
  round: (id: UUID) => request<ApprovalRound>(`/api/approval-rounds/${id}`),
  approve: (taskId: UUID, comment?: string) =>
    request<ApprovalTaskResponse>(`/api/approval-tasks/${taskId}/approve`, { method: 'POST', body: { comment: comment || null } }),
  reject: (taskId: UUID, comment: string) =>
    request<ApprovalTaskResponse>(`/api/approval-tasks/${taskId}/reject`, { method: 'POST', body: { comment } }),
};
