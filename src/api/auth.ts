import { request } from './client';
import type { CurrentUser, TokenResponse } from '@/types/api';

export const authApi = {
  login: (email: string, password: string) =>
    request<TokenResponse>('/api/auth/login', { method: 'POST', body: { email, password }, skipAuth: true }),
  me: () => request<CurrentUser>('/api/auth/me'),
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }).catch(() => undefined),
};
