import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Badge, Button, EmptyState, ErrorState, Skeleton } from '@/components/ui';
import { relativeDeadline } from '@/lib/format';

export default function MyTasks() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ['tasks', 'my'], queryFn: () => tasksApi.mine(0, 100) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks', 'my'] });

  const start = useMutation({
    mutationFn: (id: string) => tasksApi.start(id),
    onSuccess: () => { toast.ok('Задача начата'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const complete = useMutation({
    mutationFn: ({ id, version }: { id: string; version: number }) => tasksApi.complete(id, version),
    onSuccess: () => { toast.ok('Задача завершена'); invalidate(); },
    onError: (e) => toast.fail(e),
  });

  const rows = q.data?.content ?? [];
  const open = rows.filter((r) => r.status !== 'COMPLETED' && r.status !== 'CANCELLED');
  const done = rows.filter((r) => r.status === 'COMPLETED' || r.status === 'CANCELLED');

  return (
    <>
      <TopBar crumbs={[{ label: 'Мои задачи' }]} />
      <Page>
        <PageHeader title="Мои задачи" description="Задачи, назначенные лично вам в рамках активных этапов дел." />

        {q.isLoading ? <Skeleton rows={5} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {open.length === 0 ? <EmptyState title="Открытых задач нет" body="Новые задачи появятся здесь по мере продвижения дел." /> : (
              <ul className="divide-y divide-line-soft">
                {open.map((task) => (
                  <li key={task.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunk">
                    <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/cases/${task.caseId}`)}>
                      <div className="truncate text-sm font-medium text-ink-1">{task.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs">
                        <Badge value={task.status} kind="task" />
                        {task.deadline && <span className={task.overdue ? 'text-red-600' : 'text-ink-4'}>{relativeDeadline(task.deadline)}</span>}
                      </div>
                    </button>
                    <div className="flex shrink-0 gap-2">
                      {task.status === 'ASSIGNED' && (
                        <Button size="sm" loading={start.isPending} onClick={() => start.mutate(task.id)}>Начать</Button>
                      )}
                      {(task.status === 'IN_PROGRESS' || task.status === 'SUBMITTED_FOR_REVIEW') && (
                        <Button size="sm" variant="primary" loading={complete.isPending}
                          onClick={() => complete.mutate({ id: task.id, version: task.version })}>Завершить</Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <details className="border-t border-line px-5 py-3">
                <summary className="cursor-pointer text-xs font-medium text-ink-4">Завершённые ({done.length})</summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {done.map((task) => (
                    <li key={task.id} className="flex items-center justify-between text-xs">
                      <span className="truncate text-ink-3">{task.title}</span>
                      <Badge value={task.status} kind="task" />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </Page>
    </>
  );
}
