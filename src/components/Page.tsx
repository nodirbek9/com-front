import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from '@/components/icons';

export function TopBar({ crumbs }: { crumbs: { label: string; to?: string }[] }) {
  return (
    <div className="sticky top-0 z-10 flex h-11 items-center gap-1.5 border-b border-line bg-surface/85 px-6 text-sm backdrop-blur">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRightIcon className="h-3.5 w-3.5 text-ink-4" />}
          {c.to ? (
            <Link to={c.to} className="text-ink-3 transition-colors hover:text-ink-1">{c.label}</Link>
          ) : (
            <span className="font-mono text-ink-2">{c.label}</span>
          )}
        </span>
      ))}
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-1">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-relaxed text-ink-3">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1180px] px-6 py-7">{children}</div>;
}
