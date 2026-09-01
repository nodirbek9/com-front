import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { ApiError } from '@/api/client';
import { errorMessage, t } from '@/lib/format';
import { CheckCircleIcon, XCircleIcon } from '@/components/icons';

interface ToastItem { id: number; title: string; body?: string; tone: 'ok' | 'bad' }
const ToastCtx = createContext<{ push: (t: Omit<ToastItem, 'id'>) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 5000);
  }, []);
  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex w-[380px] max-w-[calc(100vw-2.5rem)] flex-col gap-2">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={[
              'pointer-events-auto animate-toast-in rounded-lg border bg-surface px-4 py-3 shadow-popover',
              item.tone === 'ok' ? 'border-green-500/25' : 'border-red-500/25',
            ].join(' ')}
          >
            <div className="flex items-start gap-2.5">
              {item.tone === 'ok'
                ? <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                : <XCircleIcon className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />}
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-1">{item.title}</div>
                {item.body && <div className="mt-0.5 text-xs text-ink-3">{item.body}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  const push = ctx?.push ?? (() => {});
  return {
    ok: (title: string, body?: string) => push({ title, body, tone: 'ok' }),
    fail: (error: unknown, fallback = 'Действие не выполнено') => {
      const e = error instanceof ApiError ? error : null;
      const title = e?.status === 403 ? 'Доступ запрещён' : e?.status === 404 ? 'Не найдено' : e?.code ? t(e.code) : fallback;
      push({ title, body: e ? (errorMessage(e.code) ?? undefined) : fallback, tone: 'bad' });
    },
  };
}
