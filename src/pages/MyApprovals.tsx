import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { approvalsApi } from '@/api';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Badge, Button, EmptyState, ErrorState, Skeleton, Textarea } from '@/components/ui';
import { formatDate } from '@/lib/format';

export default function MyApprovals() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const [commentFor, setCommentFor] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const q = useQuery({ queryKey: ['approvals', 'my'], queryFn: () => approvalsApi.mine(0, 100) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['approvals', 'my'] });

  const approve = useMutation({
    mutationFn: (taskId: string) => approvalsApi.approve(taskId),
    onSuccess: () => { toast.ok('Согласовано'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const reject = useMutation({
    mutationFn: ({ taskId, comment: c }: { taskId: string; comment: string }) => approvalsApi.reject(taskId, c),
    onSuccess: () => { toast.ok('Отклонено'); setCommentFor(null); setComment(''); invalidate(); },
    onError: (e) => toast.fail(e),
  });

  const rows = q.data?.content ?? [];
  const open = rows.filter((r) => r.status === 'SENT' || r.status === 'IN_REVIEW');
  const done = rows.filter((r) => r.status !== 'SENT' && r.status !== 'IN_REVIEW');

  return (
    <>
      <TopBar crumbs={[{ label: 'Мои согласования' }]} />
      <Page>
        <PageHeader title="Мои согласования" description="Документы, направленные вам на согласование или подписание." />

        {q.isLoading ? <Skeleton rows={5} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          <div className="overflow-hidden rounded-lg border border-line bg-surface">
            {open.length === 0 ? <EmptyState title="Ожидающих решений нет" body="Новые согласования появятся здесь, когда документ будет направлен вам." /> : (
              <ul className="divide-y divide-line-soft">
                {open.map((a) => (
                  <li key={a.id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/cases/${a.caseId}`)}>
                        <div className="text-sm font-medium text-ink-1">Дело #{a.caseId.slice(0, 8)}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-4">
                          <Badge value={a.status} />
                          <span>направлено {formatDate(a.createdAt)}</span>
                        </div>
                      </button>
                      <div className="flex shrink-0 gap-2">
                        <Button size="sm" variant="primary" loading={approve.isPending} onClick={() => approve.mutate(a.id)}>Согласовать</Button>
                        <Button size="sm" variant="danger" onClick={() => setCommentFor(commentFor === a.id ? null : a.id)}>Отклонить</Button>
                      </div>
                    </div>
                    {commentFor === a.id && (
                      <div className="mt-3 flex items-start gap-2">
                        <div className="flex-1">
                          <Textarea rows={2} className="font-sans" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Причина отклонения…" />
                        </div>
                        <Button size="sm" variant="danger" disabled={!comment.trim()} loading={reject.isPending}
                          onClick={() => reject.mutate({ taskId: a.id, comment })}>Подтвердить отказ</Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {done.length > 0 && (
              <details className="border-t border-line px-5 py-3">
                <summary className="cursor-pointer text-xs font-medium text-ink-4">Решённые ({done.length})</summary>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {done.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-xs">
                      <span className="text-ink-3">Дело #{a.caseId.slice(0, 8)}</span>
                      <Badge value={a.status} />
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
