import { normalizePage, request } from './client';
import type {
  AdminUser, DepartmentRef, ExternalStageRef, Page, RoleCode, ServiceRef, UUID, WorkflowSummary, WorkTypeRef,
} from '@/types/api';

export const adminApi = {
  users: (page = 0, size = 50) =>
    request<unknown>('/api/admin/users', { query: { page, size } }).then((r) => normalizePage<AdminUser>(r)),
  createUser: (body: { email: string; password: string; fullName: string; departmentId?: UUID; positionId?: UUID; roleCodes: string[] }) =>
    request<AdminUser>('/api/admin/users', { method: 'POST', body }),
  updateUser: (id: UUID, body: { fullName: string; departmentId?: UUID; positionId?: UUID; roleCodes: string[]; version: number }) =>
    request<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body }),
  blockUser: (id: UUID) => request<AdminUser>(`/api/admin/users/${id}/block`, { method: 'POST' }),

  departments: (page = 0, size = 100) =>
    request<unknown>('/api/admin/departments', { query: { page, size } }).then((r) => normalizePage<DepartmentRef>(r)),
  createDepartment: (body: { code: string; name: string; parentId?: UUID; headUserId?: UUID }) =>
    request<DepartmentRef>('/api/admin/departments', { method: 'POST', body }),
  updateDepartment: (id: UUID, body: { name: string; parentId?: UUID; headUserId?: UUID; active: boolean }) =>
    request<DepartmentRef>(`/api/admin/departments/${id}`, { method: 'PATCH', body }),

  positions: (page = 0, size = 100) =>
    request<unknown>('/api/admin/positions', { query: { page, size } }).then((r) => normalizePage<DepartmentRef>(r)),
  createPosition: (body: { code: string; name: string }) =>
    request<DepartmentRef>('/api/admin/positions', { method: 'POST', body }),
  updatePosition: (id: UUID, body: { name: string; active: boolean }) =>
    request<DepartmentRef>(`/api/admin/positions/${id}`, { method: 'PATCH', body }),

  services: (page = 0, size = 100) =>
    request<unknown>('/api/admin/services', { query: { page, size } }).then((r) => normalizePage<ServiceRef>(r)),
  workTypes: (page = 0, size = 100) =>
    request<unknown>('/api/admin/work-types', { query: { page, size } }).then((r) => normalizePage<WorkTypeRef>(r)),
  externalStages: (page = 0, size = 100) =>
    request<unknown>('/api/admin/external-stages', { query: { page, size } }).then((r) => normalizePage<ExternalStageRef>(r)),

  rolePermissions: (code: RoleCode) =>
    request<{ roleCode: string; permissionCodes: string[] }>(`/api/admin/roles/${code}/permissions`),
  setRolePermissions: (code: RoleCode, permissionCodes: string[]) =>
    request<{ roleCode: string; permissionCodes: string[] }>(`/api/admin/roles/${code}/permissions`, {
      method: 'PATCH', body: { permissionCodes },
    }),
};

export const workflowsApi = {
  list: () => request<WorkflowSummary[]>('/api/workflows'),
};

export type { Page };
