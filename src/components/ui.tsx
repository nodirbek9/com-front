import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ApiError } from '@/api/client';
import { errorMessage, t } from '@/lib/format';
import { AlertTriangleIcon, SpinnerIcon } from '@/components/icons';

/* ── status dot + label — the one consistent way this app communicates state ─────────────── */
type Tone = 'green' | 'amber' | 'red' | 'accent' | 'plain';

const TONE_DOT: Record<Tone, string> = {
  green: 'bg-green-500', amber: 'bg-amber-500', red: 'bg-red-500',
  accent: 'bg-accent-500', plain: 'bg-ink-4',
};
const TONE_TEXT: Record<Tone, string> = {
  green: 'text-green-600', amber: 'text-amber-600', red: 'text-red-600',
  accent: 'text-accent-700', plain: 'text-ink-3',
};

const CASE_TONE: Record<string, Tone> = {
  REGISTERED: 'plain', PRIMARY_CHECK: 'accent', PRIMARY_CHECK_DONE: 'accent', IN_ACCOUNTING: 'accent',
  WAITING_PAYMENT: 'amber', IN_EXECUTION: 'accent', FINAL_REVIEW: 'accent', ON_SIGNING: 'amber',
  COMPLETED: 'green', RETURNED: 'amber', REJECTED: 'red',
};
const TASK_TONE: Record<string, Tone> = {
  CREATED: 'plain', ASSIGNED: 'accent', IN_PROGRESS: 'accent', SUBMITTED_FOR_REVIEW: 'amber',
  COMPLETED: 'green', RETURNED_FOR_REVISION: 'red', CANCELLED: 'plain',
};
const STAGE_TONE: Record<string, Tone> = { PENDING: 'plain', ACTIVE: 'accent', COMPLETED: 'green', SKIPPED: 'plain' };
const GENERIC_TONE: Record<string, Tone> = {
  APPROVED: 'green', ENDORSED: 'green', SIGNED: 'green', PAID: 'green', COMPLETED: 'green',
  COMPLETED_APPROVED: 'green', REJECTED: 'red', COMPLETED_REJECTED: 'red', NOT_APPROVED: 'red',
  DEBT: 'red', BLOCKED: 'red', BROKEN: 'red', PENDING: 'amber', IN_REVIEW: 'amber', SENT: 'amber',
  WAITING_PAYMENT: 'amber', PARTIALLY_PAID: 'amber', NOT_CONFIRMED: 'amber', UNDER_ENDORSEMENT: 'amber',
  SUPERSEDED: 'plain', DRAFT: 'plain', ACTIVE: 'accent', GREEN: 'green', YELLOW: 'amber', RED: 'red',
};

export function Badge({ value, kind = 'generic', size = 'md' }: {
  value?: string | null; kind?: 'case' | 'task' | 'stage' | 'generic'; size?: 'md' | 'lg';
}) {
  if (!value) return <span className="text-ink-4">—</span>;
  const map = kind === 'case' ? CASE_TONE : kind === 'task' ? TASK_TONE : kind === 'stage' ? STAGE_TONE : GENERIC_TONE;
  const tone = map[value] ?? GENERIC_TONE[value] ?? 'plain';
  return (
    <span className={['inline-flex items-center gap-1.5 font-medium', size === 'lg' ? 'text-sm' : 'text-xs', TONE_TEXT[tone]].join(' ')}>
      <span className={['h-1.5 w-1.5 shrink-0 rounded-full', TONE_DOT[tone]].join(' ')} aria-hidden />
      {t(value)}
    </span>
  );
}

export function CategoryBadge({ value }: { value?: string | null }) {
  if (!value) return <span className="text-xs text-ink-4">Не классифицировано</span>;
  const tone: Tone = value === 'GREEN' ? 'green' : value === 'YELLOW' ? 'amber' : 'red';
  return (
    <span className={['inline-flex items-center gap-1.5 text-xs font-medium', TONE_TEXT[tone]].join(' ')}>
      <span className={['h-1.5 w-1.5 rounded-full', TONE_DOT[tone]].join(' ')} aria-hidden />
      {t(value)} категория
    </span>
  );
}

/* ── buttons ───────────────────────────────────────────────────────────────────────────── */
type ButtonVariant = 'primary' | 'default' | 'ghost' | 'danger';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant; size?: 'sm' | 'md'; loading?: boolean;
}
const VARIANT_CLS: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 text-white border-transparent hover:bg-accent-600 active:bg-accent-700 shadow-xs disabled:hover:bg-accent-500',
  default: 'bg-surface text-ink-1 border-line-strong hover:bg-surface-sunk active:bg-line-soft shadow-xs',
  ghost: 'bg-transparent text-ink-2 border-transparent hover:bg-ink-1/5 active:bg-ink-1/10',
  danger: 'bg-white text-red-600 border-red-200 hover:bg-red-50 active:bg-red-100',
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'default', size = 'md', loading, disabled, className = '', children, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={[
        'inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md border font-medium',
        'transition-colors duration-100 disabled:cursor-not-allowed disabled:opacity-45',
        size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8.5 px-3.5 text-sm',
        VARIANT_CLS[variant], className,
      ].join(' ')}
      {...rest}
    >
      {loading && <SpinnerIcon className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
});

/* ── form primitives ──────────────────────────────────────────────────────────────────── */
const fieldBase = 'h-8.5 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm text-ink-1 outline-none transition-shadow placeholder:text-ink-4 focus:border-accent-400 focus:shadow-focus disabled:bg-surface-sunk disabled:text-ink-4';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...rest }, ref) {
    return <input ref={ref} className={[fieldBase, className].join(' ')} {...rest} />;
  },
);
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', ...rest }, ref) {
    return <textarea ref={ref} rows={4} className={[fieldBase, 'h-auto resize-y py-2 font-mono text-xs leading-relaxed', className].join(' ')} {...rest} />;
  },
);
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={[
          fieldBase, 'appearance-none bg-no-repeat pr-8',
          "bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%234A5062%22 stroke-width=%221.75%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[right_0.6rem_center] bg-[length:16px]",
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-ink-3">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-2xs text-ink-4">{hint}</span>}
      {error && <span className="mt-1 block text-2xs text-red-600">{error}</span>}
    </label>
  );
}

/* ── panel / card ──────────────────────────────────────────────────────────────────────── */
export function Panel({ title, subtitle, actions, children, note, tight }: {
  title?: string; subtitle?: string; actions?: ReactNode; children: ReactNode; note?: string | null; tight?: boolean;
}) {
  return (
    <section className="mb-4 overflow-hidden rounded-lg border border-line bg-surface">
      {(title || actions) && (
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            {title && <h3 className="text-sm font-semibold text-ink-1">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-xs leading-relaxed text-ink-3">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={tight ? '' : 'p-5'}>{children}</div>
      {note && (
        <div className="flex items-start gap-2 border-t border-line bg-amber-50 px-5 py-2.5 text-xs text-amber-700">
          <AlertTriangleIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span><strong className="font-semibold">Демо-данные.</strong> {note}</span>
        </div>
      )}
    </section>
  );
}

/* ── states ────────────────────────────────────────────────────────────────────────────── */
export function Skeleton({ rows = 4, height = 13 }: { rows?: number; height?: number }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="animate-shimmer rounded bg-[linear-gradient(90deg,theme(colors.line.soft)_25%,theme(colors.line.DEFAULT)_37%,theme(colors.line.soft)_63%)] bg-[length:200%_100%]"
          style={{ height, width: `${94 - (i % 3) * 16}%` }}
        />
      ))}
    </div>
  );
}

export function TableSkeleton({ cols, rows = 6 }: { cols: number; rows?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-line-soft last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-3.5 py-3">
              <div className="h-3 animate-shimmer rounded bg-[linear-gradient(90deg,theme(colors.line.soft)_25%,theme(colors.line.DEFAULT)_37%,theme(colors.line.soft)_63%)] bg-[length:200%_100%]" style={{ width: c === 0 ? '70%' : '48%' }} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <h3 className="text-sm font-medium text-ink-2">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-xs leading-relaxed text-ink-4">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const e = error instanceof ApiError ? error : null;
  const title = e?.status === 403 ? 'Доступ запрещён' : e?.status === 404 ? 'Не найдено' : 'Ошибка запроса';
  const message = e ? errorMessage(e.code) : error instanceof Error ? 'Что-то пошло не так' : null;
  return (
    <div className="flex flex-col items-center gap-3 rounded-md border border-red-200 bg-red-50 px-6 py-8 text-center">
      <AlertTriangleIcon className="h-5 w-5 text-red-500" />
      <div>
        <div className="flex items-center justify-center gap-2 text-sm font-semibold text-red-700">
          {title}
          {e?.code && <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-2xs font-normal text-red-600">{e.code}</span>}
        </div>
        {message && <p className="mt-1 text-xs text-red-600/90">{message}</p>}
        {!!e?.details?.length && (
          <ul className="mt-2 space-y-0.5 text-2xs text-red-600/80">
            {e.details.map((d, i) => <li key={i}>{d.field ? `${d.field}: ` : ''}{d.issue}</li>)}
          </ul>
        )}
      </div>
      {onRetry && <Button size="sm" onClick={onRetry}>Повторить</Button>}
    </div>
  );
}

/* ── key/value facts list ─────────────────────────────────────────────────────────────── */
export function Facts({ entries }: { entries: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line-soft">
      {entries.map(([k, v]) => (
        <div key={k} className="flex items-center justify-between gap-4 py-2 text-sm">
          <dt className="text-ink-3">{k}</dt>
          <dd className="text-right font-medium text-ink-1">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ── tabs ──────────────────────────────────────────────────────────────────────────────── */
export function TabBar<T extends string>({ tabs, active, onChange }: {
  tabs: [T, string][]; active: T; onChange: (v: T) => void;
}) {
  return (
    <div role="tablist" className="mb-4 flex gap-1 border-b border-line">
      {tabs.map(([key, label]) => (
        <button
          key={key} role="tab" aria-selected={active === key}
          onClick={() => onChange(key)}
          className={[
            'relative -mb-px whitespace-nowrap px-3 py-2.5 text-sm font-medium transition-colors',
            active === key ? 'text-ink-1' : 'text-ink-4 hover:text-ink-2',
          ].join(' ')}
        >
          {label}
          {active === key && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-500" />}
        </button>
      ))}
    </div>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-2 text-2xs font-semibold uppercase tracking-wide text-ink-4">{children}</div>;
}
