import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { adminApi, casesApi } from '@/api';
import type { CaseFilters } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Badge, Button, EmptyState, ErrorState, Field, Select, TableSkeleton } from '@/components/ui';
import { SearchIcon } from '@/components/icons';
import { formatDate, t } from '@/lib/format';

const STATUSES = ['REGISTERED', 'PRIMARY_CHECK', 'PRIMARY_CHECK_DONE', 'IN_ACCOUNTING', 'WAITING_PAYMENT',
  'IN_EXECUTION', 'FINAL_REVIEW', 'ON_SIGNING', 'COMPLETED', 'RETURNED', 'REJECTED'];

export default function Cases() {
  const navigate = useNavigate();
  const { hasRole } = useAuth();
  const [filters, setFilters] = useState<CaseFilters>({ page: 0 });
  const set = (patch: Partial<CaseFilters>) => setFilters((f) => ({ ...f, ...patch, page: 0 }));
  const hasActiveFilters = !!(filters.q || filters.status || filters.serviceId || filters.mode || filters.overdue !== undefined);

  const services = useQuery({
    queryKey: ['admin', 'services'], queryFn: () => adminApi.services(), retry: false,
    enabled: hasRole('ADMIN', 'OPERATOR', 'ACCOUNTANT', 'HEAD_OF_CERTIFICATION_BODY', 'DEPARTMENT_HEAD'),
  });
  const q = useQuery({ queryKey: ['cases', filters], queryFn: () => casesApi.list(filters), placeholderData: keepPreviousData });
  const rows = q.data?.content ?? [];

  return (
    <>
      <TopBar crumbs={[{ label: 'Дела' }]} />
      <Page>
        <PageHeader title="Дела" description="Каждое зарегистрированное заявление становится одним электронным делом. Фильтры учитывают ваше подразделение." />

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="w-[260px] max-w-full">
            <Field label="Поиск">
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
                <input
                  className="h-8.5 w-full rounded-md border border-line-strong bg-surface pl-8 pr-2.5 text-sm text-ink-1 outline-none transition-shadow placeholder:text-ink-4 focus:border-accent-400 focus:shadow-focus"
                  placeholder="Номер дела, заявитель…" defaultValue={filters.q ?? ''}
                  onKeyDown={(e) => { if (e.key === 'Enter') set({ q: (e.target as HTMLInputElement).value }); }}
                />
              </div>
            </Field>
          </div>
          <div className="w-[170px]">
            <Field label="Статус">
              <Select value={filters.status ?? ''} onChange={(e) => set({ status: e.target.value || undefined })}>
                <option value="">Любой статус</option>
                {STATUSES.map((s) => <option key={s} value={s}>{t(s)}</option>)}
              </Select>
            </Field>
          </div>
          <div className="w-[190px]">
            <Field label="Услуга">
              <Select value={filters.serviceId ?? ''} onChange={(e) => set({ serviceId: e.target.value || undefined })}>
                <option value="">Любая услуга</option>
                {(services.data?.content ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="w-[150px]">
            <Field label="Режим">
              <Select value={filters.mode ?? ''} onChange={(e) => set({ mode: e.target.value || undefined })}>
                <option value="">Любой режим</option>
                <option value="TRADITIONAL">Обычный</option>
                <option value="EXPEDITED">Ускоренный</option>
              </Select>
            </Field>
          </div>
          <div className="w-[150px]">
            <Field label="Срок">
              <Select value={filters.overdue === undefined ? '' : String(filters.overdue)}
                onChange={(e) => set({ overdue: e.target.value === '' ? undefined : e.target.value === 'true' })}>
                <option value="">Все</option>
                <option value="true">Просроченные</option>
                <option value="false">В срок</option>
              </Select>
            </Field>
          </div>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={() => setFilters({ page: 0 })}>Сбросить</Button>
          )}
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {q.isError ? (
            <div className="p-5"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-2xs font-medium uppercase tracking-wide text-ink-4">
                      <th className="px-5 py-2.5 font-medium">Дело</th>
                      <th className="px-3.5 py-2.5 font-medium">Заявитель</th>
                      <th className="px-3.5 py-2.5 font-medium">Услуга</th>
                      <th className="px-3.5 py-2.5 font-medium">Статус</th>
                      <th className="px-3.5 py-2.5 font-medium">Этап</th>
                      <th className="px-3.5 py-2.5 font-medium">Режим</th>
                      <th className="px-5 py-2.5 text-right font-medium">Срок</th>
                    </tr>
                  </thead>
                  {q.isLoading ? <TableSkeleton cols={7} /> : (
                    <tbody>
                      {rows.map((c) => (
                        <tr key={c.id} onClick={() => navigate(`/cases/${c.id}`)}
                          className="cursor-pointer border-b border-line-soft transition-colors last:border-0 hover:bg-surface-sunk">
                          <td className="px-5 py-3">
                            <div className="font-mono text-xs font-medium text-ink-1">{c.caseNumber}</div>
                            <div className="mt-0.5 text-2xs text-ink-4">{c.applicationNumber ?? '—'}</div>
                          </td>
                          <td className="px-3.5 py-3"><div className="max-w-[200px] truncate">{c.applicantName ?? '—'}</div></td>
                          <td className="px-3.5 py-3"><div className="max-w-[170px] truncate text-ink-3">{c.serviceName ?? '—'}</div></td>
                          <td className="px-3.5 py-3"><Badge value={c.status} kind="case" /></td>
                          <td className="px-3.5 py-3">
                            <div className="text-xs">{c.currentStageName ?? (c.parallelStages > 1 ? 'Параллельная работа' : '—')}</div>
                            {c.parallelStages > 1 && <div className="mt-0.5 text-2xs text-ink-4">{c.parallelStages} этапа параллельно</div>}
                          </td>
                          <td className="px-3.5 py-3 text-xs text-ink-3">{c.processingMode ? t(c.processingMode) : '—'}</td>
                          <td className="px-5 py-3 text-right">
                            <div className="num text-xs">{formatDate(c.dueAt)}</div>
                            {c.dueAt && (
                              <div className={['mt-0.5 text-2xs', c.overdue ? 'text-red-600' : 'text-ink-4'].join(' ')}>
                                {c.overdue ? 'Просрочено' : ''}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  )}
                </table>
              </div>

              {!q.isLoading && rows.length === 0 && (
                <EmptyState title="Нет дел, соответствующих фильтрам" body="Ослабьте фильтр или очистите поиск. Новые зарегистрированные заявления появляются здесь сразу." />
              )}

              {(q.data?.totalPages ?? 0) > 1 && (
                <div className="flex items-center justify-between border-t border-line px-5 py-3">
                  <span className="num text-xs text-ink-4">
                    Стр. {(q.data!.page ?? 0) + 1} из {q.data!.totalPages} · {q.data!.totalElements} дел
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" disabled={(filters.page ?? 0) === 0}
                      onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) - 1 }))}>Назад</Button>
                    <Button size="sm" disabled={(q.data!.page ?? 0) + 1 >= q.data!.totalPages}
                      onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 0) + 1 }))}>Далее</Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Page>
    </>
  );
}
