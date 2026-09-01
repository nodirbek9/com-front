import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Badge, Button, EmptyState, ErrorState, TableSkeleton } from '@/components/ui';
import { formatDate, t } from '@/lib/format';

export default function Applications() {
  const navigate = useNavigate();
  const { can } = useAuth();
  const toast = useToast();
  const qc = useQueryClient();
  const [page, setPage] = useState(0);

  const q = useQuery({ queryKey: ['applications', page], queryFn: () => applicationsApi.list(page) });

  const register = useMutation({
    mutationFn: (id: string) => applicationsApi.register(id),
    onSuccess: (res) => { toast.ok('Дело зарегистрировано', res.caseNumber); qc.invalidateQueries({ queryKey: ['applications'] }); navigate(`/cases/${res.id}`); },
    onError: (e) => toast.fail(e),
  });

  const rows = q.data?.content ?? [];

  return (
    <>
      <TopBar crumbs={[{ label: 'Заявления' }]} />
      <Page>
        <PageHeader title="Заявления" description="Поданные заявления ожидают регистрации в дело либо уже переведены в производство." />

        <div className="overflow-hidden rounded-lg border border-line bg-surface">
          {q.isError ? (
            <div className="p-5"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-line text-left text-2xs font-medium uppercase tracking-wide text-ink-4">
                    <th className="px-5 py-2.5 font-medium">№ заявления</th>
                    <th className="px-3.5 py-2.5 font-medium">Канал подачи</th>
                    <th className="px-3.5 py-2.5 font-medium">Статус</th>
                    <th className="px-3.5 py-2.5 font-medium">Подано</th>
                    <th className="px-5 py-2.5 text-right font-medium">Действие</th>
                  </tr>
                </thead>
                {q.isLoading ? <TableSkeleton cols={5} /> : (
                  <tbody>
                    {rows.map((a) => (
                      <tr key={a.id} className="border-b border-line-soft transition-colors last:border-0 hover:bg-surface-sunk">
                        <td className="px-5 py-3 font-mono text-xs font-medium text-ink-1">{a.number}</td>
                        <td className="px-3.5 py-3 text-xs text-ink-3">{t(a.submissionChannel)}</td>
                        <td className="px-3.5 py-3"><Badge value={a.status} /></td>
                        <td className="px-3.5 py-3 text-xs text-ink-4">{formatDate(a.submittedAt)}</td>
                        <td className="px-5 py-3 text-right">
                          {a.status === 'SUBMITTED' && can('APPLICATION:EDIT') && (
                            <Button size="sm" variant="primary" loading={register.isPending}
                              onClick={() => register.mutate(a.id)}>Зарегистрировать</Button>
                          )}
                          {a.registeredAt && <span className="text-2xs text-ink-4">Зарегистрировано {formatDate(a.registeredAt)}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                )}
              </table>
            </div>
          )}
          {!q.isLoading && rows.length === 0 && (
            <EmptyState title="Заявлений пока нет" body="Новые поданные заявления появятся здесь автоматически." />
          )}
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
