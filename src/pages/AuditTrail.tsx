import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/api';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Badge, Button, EmptyState, ErrorState, Field, Input, TableSkeleton } from '@/components/ui';
import { ShieldIcon } from '@/components/icons';
import { formatDate } from '@/lib/format';

export default function AuditTrail() {
  const [caseId, setCaseId] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(0);

  const integrity = useQuery({ queryKey: ['audit', 'integrity'], queryFn: () => auditApi.integrity() });
  const q = useQuery({
    queryKey: ['audit', 'search', caseId, action, page],
    queryFn: () => auditApi.search({ caseId: caseId || undefined, action: action || undefined, page }),
  });
  const rows = q.data?.content ?? [];

  return (
    <>
      <TopBar crumbs={[{ label: 'Журнал аудита' }]} />
      <Page>
        <PageHeader
          title="Журнал аудита"
          description="Полная, неизменяемая история действий по всем делам. Каждая запись защищена цепочкой хеширования."
          actions={integrity.data && (
            <span className={['inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium', integrity.data.intact ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'].join(' ')}>
              <ShieldIcon className="h-3.5 w-3.5" />
              {integrity.data.intact ? 'Цепочка не нарушена' : `Нарушение с записи #${integrity.data.firstBrokenSeq}`}
            </span>
          )}
        />

        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-line bg-surface p-4">
          <div className="w-[260px]">
            <Field label="ID дела">
              <Input value={caseId} onChange={(e) => { setCaseId(e.target.value); setPage(0); }} placeholder="UUID дела" />
            </Field>
          </div>
          <div className="w-[220px]">
            <Field label="Действие">
              <Input value={action} onChange={(e) => { setAction(e.target.value); setPage(0); }} placeholder="Например, CASE_CREATED" />
            </Field>
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {q.isError ? <div className="p-5"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs font-medium uppercase tracking-wide text-ink-4">
                    <th className="px-5 py-2.5 font-medium">#</th>
                    <th className="px-3.5 py-2.5 font-medium">Действие</th>
                    <th className="px-3.5 py-2.5 font-medium">Сущность</th>
                    <th className="px-3.5 py-2.5 font-medium">Роль</th>
                    <th className="px-5 py-2.5 text-right font-medium">Время</th>
                  </tr>
                </thead>
                {q.isLoading ? <TableSkeleton cols={5} /> : (
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id} className="border-b border-line-soft last:border-0">
                        <td className="px-5 py-2.5 num text-xs text-ink-4">{a.seq}</td>
                        <td className="px-3.5 py-2.5 text-xs font-medium text-ink-1">{a.action}</td>
                        <td className="px-3.5 py-2.5 text-xs text-ink-3">{a.entityType}</td>
                        <td className="px-3.5 py-2.5"><Badge value={a.actorRoleCode ?? undefined} /></td>
                        <td className="px-5 py-2.5 text-right text-xs text-ink-4">{formatDate(a.createdAt, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
          {!q.isLoading && rows.length === 0 && <EmptyState title="Записей не найдено" body="Измените фильтры поиска." />}
          {(q.data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between border-t border-line px-5 py-3">
              <span className="num text-xs text-ink-4">Стр. {page + 1} из {q.data!.totalPages}</span>
              <div className="flex gap-2">
                <Button size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Назад</Button>
                <Button size="sm" disabled={page + 1 >= q.data!.totalPages} onClick={() => setPage((p) => p + 1)}>Далее</Button>
              </div>
            </div>
          )}
        </div>
      </Page>
    </>
  );
}
