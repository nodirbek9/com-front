import type { ErrorBody, Page } from '@/types/api';

const BASE = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

export class ApiError extends Error {
  status: number;
  code: string;
  traceId?: string;
  details: { field?: string; issue?: string }[];

  constructor(status: number, body: Partial<ErrorBody> | null, fallback: string) {
    super(body?.message || fallback);
    this.status = status;
    this.code = body?.code || (status === 0 ? 'NETWORK_ERROR' : 'UNKNOWN');
    this.traceId = body?.traceId;
    this.details = body?.details ?? [];
  }
  get isAuth() { return this.status === 401; }
  get isForbidden() { return this.status === 403; }
}

interface Tokens { accessToken: string; refreshToken: string }
const STORAGE_KEY = 'crm.auth.tokens';

export const tokenStore = {
  read(): Tokens | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch { return null; }
  },
  write(t: Tokens) { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); },
  clear() { localStorage.removeItem(STORAGE_KEY); },
};

let onUnauthorized: () => void = () => {};
export function setUnauthorizedHandler(fn: () => void) { onUnauthorized = fn; }

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const current = tokenStore.read();
  if (!current?.refreshToken) return null;
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${BASE}/api/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: current.refreshToken }),
        });
        if (!res.ok) return null;
        const body = (await res.json()) as { accessToken: string; refreshToken?: string };
        tokenStore.write({ accessToken: body.accessToken, refreshToken: body.refreshToken ?? current.refreshToken });
        return body.accessToken;
      } catch { return null; } finally { setTimeout(() => { refreshInFlight = null; }, 0); }
    })();
  }
  return refreshInFlight;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  idempotencyKey?: string;
  skipAuth?: boolean;
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, idempotencyKey, skipAuth } = opts;
  const qs = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') qs.append(k, String(v));
  });
  const url = `${BASE}${path}${qs.toString() ? `?${qs}` : ''}`;

  const send = async (token?: string | null): Promise<Response> => {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
    return fetch(url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  };

  let res: Response;
  const token = skipAuth ? null : tokenStore.read()?.accessToken;
  try {
    res = await send(token);
  } catch {
    throw new ApiError(0, null, 'Не удаётся связаться с сервером. Проверьте, что backend запущен.');
  }

  // Access tokens are short-lived (15 min) — refresh once, transparently, then retry.
  if (res.status === 401 && !skipAuth && tokenStore.read()?.refreshToken) {
    const fresh = await refreshAccessToken();
    if (fresh) {
      try { res = await send(fresh); } catch {
        throw new ApiError(0, null, 'Не удаётся связаться с сервером.');
      }
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;

  if (!res.ok) {
    if (res.status === 401 && !skipAuth) { tokenStore.clear(); onUnauthorized(); }
    throw new ApiError(res.status, parsed as ErrorBody, res.statusText || 'Ошибка запроса');
  }
  return parsed as T;
}

function safeJson(text: string): unknown {
  try { return JSON.parse(text); } catch { return { message: text }; }
}

/** Reconciles the two page shapes this backend actually returns: the custom PageResponse
 *  {content, page, size, totalElements, totalPages} most endpoints use, and the raw Spring Data
 *  Page (field `number` instead of `page`) that /api/audit and /api/approvals/my return. */
export function normalizePage<T>(raw: unknown): Page<T> {
  const r = raw as Record<string, unknown> | null | undefined;
  if (!r) return { content: [], page: 0, size: 0, totalElements: 0, totalPages: 0 };
  const content = (r.content as T[] | undefined) ?? [];
  return {
    content,
    page: (r.page as number | undefined) ?? (r.number as number | undefined) ?? 0,
    size: (r.size as number | undefined) ?? content.length,
    totalElements: (r.totalElements as number | undefined) ?? content.length,
    totalPages: (r.totalPages as number | undefined) ?? 1,
  };
}

export const newIdempotencyKey = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
