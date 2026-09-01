import { newIdempotencyKey, normalizePage, request } from './client';
import type { Page, TaskResponse, TaskResult, TaskSummary, UUID } from '@/types/api';

// TaskController is the one controller mapped outside the /api prefix — /tasks, not /api/tasks.
export const tasksApi = {
  list: (q: { caseId?: string; status?: string; departmentId?: string; page?: number; size?: number } = {}) =>
    request<unknown>('/tasks', { query: { ...q, size: q.size ?? 50 } }).then((r) => normalizePage<TaskSummary>(r)),
  mine: (page = 0, size = 50) =>
    request<unknown>('/tasks/my', { query: { page, size } }).then((r) => normalizePage<TaskSummary>(r)),
  get: (id: UUID) => request<TaskResponse>(`/tasks/${id}`),
  assign: (id: UUID, userId: UUID) => request<TaskResponse>(`/tasks/${id}/assign`, { method: 'POST', body: { userId } }),
  reassign: (id: UUID, userId: UUID, reason: string) =>
    request<TaskResponse>(`/tasks/${id}/reassign`, { method: 'POST', body: { userId, reason } }),
  start: (id: UUID) => request<TaskResponse>(`/tasks/${id}/start`, { method: 'POST' }),
  results: (id: UUID) => request<TaskResult[]>(`/tasks/${id}/results`),
  submitResult: (id: UUID, body: { payload: string; summary?: string; revisionReason?: string }) =>
    request<TaskResult>(`/tasks/${id}/results`, { method: 'POST', body }),
  complete: (id: UUID, version: number) =>
    request<TaskResponse>(`/tasks/${id}/complete`, {
      method: 'POST', body: { version }, idempotencyKey: newIdempotencyKey(),
    }),
  approveResult: (id: UUID, comment?: string) =>
    request<TaskResponse>(`/tasks/${id}/approve-result`, { method: 'POST', body: { comment: comment || null } }),
  returnTask: (id: UUID, reason: string) =>
    request<TaskResponse>(`/tasks/${id}/return`, { method: 'POST', body: { reason } }),
};

export type { Page };
