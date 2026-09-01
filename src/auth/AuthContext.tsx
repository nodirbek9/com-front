import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { authApi } from '@/api/auth';
import { setUnauthorizedHandler, tokenStore } from '@/api/client';
import type { CurrentUser, RoleCode } from '@/types/api';

interface AuthState {
  user: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Always checks the live `/api/auth/me` permissions array — never the role name. This backend
   *  resolves permissions per request, not from JWT claims, and the frontend must mirror that:
   *  never assume what a role "should" be able to do. */
  can: (permission: string) => boolean;
  canAny: (...permissions: string[]) => boolean;
  hasRole: (...roles: RoleCode[]) => boolean;
  isApplicantOnly: boolean;
}

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
    if (!tokenStore.read()?.accessToken) { setLoading(false); return; }
    authApi.me().then(setUser).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    tokenStore.write({ accessToken: res.accessToken, refreshToken: res.refreshToken });
    setUser(await authApi.me());
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(() => {
    const perms = new Set(user?.permissions ?? []);
    const roles = new Set(user?.roles ?? []);
    return {
      user, loading, login, logout,
      can: (p) => perms.has(p),
      canAny: (...ps) => ps.some((p) => perms.has(p)),
      hasRole: (...rs) => rs.some((r) => roles.has(r)),
      isApplicantOnly: roles.has('APPLICANT') && roles.size === 1,
    };
  }, [user, loading, login, logout]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
