import { request } from './client';
import type { ApplicantResponse, UUID } from '@/types/api';

export const applicantsApi = {
  get: (id: UUID) => request<ApplicantResponse>(`/api/applicants/${id}`),
};
