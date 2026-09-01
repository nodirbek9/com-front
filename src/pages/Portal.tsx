import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { applicationsApi, casesApi } from '@/api';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import {
  Badge, Button, EmptyState, ErrorState, Facts, Panel, Skeleton,
} from '@/components/ui';
import { PlusIcon } from '@/components/icons';
import { formatDate, formatMoney, t } from '@/lib/format';

export function PortalList() {
  const navigate = useNavigate();
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['portal', 'applications'], queryFn: () => applicationsApi.list(0, 50) });

  const submit = useMutation({
    mutationFn: (id: string) => applicationsApi.submit(id),
    onSuccess: () => { toast.ok('Заявление отправлено'); qc.invalidateQueries({ queryKey: ['portal', 'applications'] }); },
    onError: (e) => toast.fail(e),
  });

  const rows = q.data?.content ?? [];

  return (
    <>
      <TopBar crumbs={[{ label: 'Мои заявления' }]} />
      <Page>
        <PageHeader
          title="Мои заявления"
          description="Заявления, поданные вами через личный кабинет."
          actions={<Button variant="primary" onClick={() => navigate('/portal/new')}><PlusIcon className="h-3.5 w-3.5" />Новое заявление</Button>}
        />

        {q.isLoading ? <Skeleton rows={4} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
          rows.length === 0 ? (
            <EmptyState title="У вас пока нет заявлений" body="Начните с подачи нового заявления на сертификацию."
              action={<Button variant="primary" onClick={() => navigate('/portal/new')}>Подать заявление</Button>} />
          ) : (
            <div className="overflow-hidden rounded-lg border border-line bg-surface">
              <ul className="divide-y divide-line-soft">
                {rows.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-surface-sunk">
                    <button className="min-w-0 flex-1 text-left" onClick={() => navigate(`/portal/${a.id}`)}>
                      <div className="text-sm font-medium text-ink-1">{a.number}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-4">
                        <Badge value={a.status} />
                        <span>{a.submittedAt ? `подано ${formatDate(a.submittedAt)}` : 'черновик'}</span>
                      </div>
                    </button>
                    {a.status === 'DRAFT' && (
                      <Button size="sm" variant="primary" loading={submit.isPending} onClick={() => submit.mutate(a.id)}>Отправить</Button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )
        )}
      </Page>
    </>
  );
}

export function PortalTracking() {
  const { id = '' } = useParams();

  const trackingQ = useQuery({ queryKey: ['portal', 'tracking', id], queryFn: () => casesApi.tracking(id), retry: false });
  const appQ = useQuery({
    queryKey: ['portal', 'application', id], queryFn: () => applicationsApi.get(id),
    retry: false, enabled: trackingQ.isError,
  });

  if (trackingQ.isLoading || (trackingQ.isError && appQ.isLoading)) {
    return (
      <>
        <TopBar crumbs={[{ label: 'Мои заявления', to: '/portal' }, { label: '…' }]} />
        <Page><Skeleton rows={5} /></Page>
      </>
    );
  }

  if (trackingQ.data) {
    const tr = trackingQ.data;
    return (
      <>
        <TopBar crumbs={[{ label: 'Мои заявления', to: '/portal' }, { label: tr.applicationNumber }]} />
        <Page>
          <PageHeader title={tr.applicationNumber} description={tr.serviceName ?? undefined} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Статус рассмотрения">
              <Facts entries={[
                ['Подано', formatDate(tr.submittedAt)],
                ['Текущий этап', tr.externalStage?.nameForApplicant ?? 'Обрабатывается'],
              ]} />
              {tr.returnedForCorrection && (
                <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
                  <strong className="font-semibold">Возвращено на доработку.</strong> {tr.returnedForCorrection.reason}
                  {tr.returnedForCorrection.remarks && <div className="mt-1">{tr.returnedForCorrection.remarks}</div>}
                  {tr.returnedForCorrection.dueDate && <div className="mt-1">Срок исправления: {formatDate(tr.returnedForCorrection.dueDate)}</div>}
                </div>
              )}
              {tr.finalDocument && (
                <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-3.5 py-2.5 text-xs text-green-800">
                  <strong className="font-semibold">Готово: {tr.finalDocument.name}</strong>
                  <div className="mt-0.5">выдано {formatDate(tr.finalDocument.issuedAt)}</div>
                </div>
              )}
            </Panel>

            <div>
              {tr.contract && (
                <Panel title="Договор" tight>
                  <div className="px-5 py-1">
                    <Facts entries={[
                      ['Номер', tr.contract.number ?? '—'],
                      ['Дата', formatDate(tr.contract.date)],
                      ['Сумма', formatMoney(tr.contract.actualAmount, tr.contract.currency)],
                    ]} />
                  </div>
                </Panel>
              )}
              {tr.payment && (
                <Panel title="Оплата" tight>
                  <div className="px-5 py-1">
                    <Facts entries={[
                      ['Статус', <Badge value={tr.payment.status} />],
                      ['Подтверждено', formatMoney(tr.payment.confirmedAmount)],
                      ['Задолженность', formatMoney(tr.payment.debtAmount)],
                    ]} />
                  </div>
                </Panel>
              )}
            </div>
          </div>

          {tr.notifications.length > 0 && (
            <Panel title="Уведомления" tight>
              <ul className="divide-y divide-line-soft">
                {tr.notifications.map((n, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                    <span className="text-ink-2">{n.message}</span>
                    <span className="shrink-0 text-xs text-ink-4">{formatDate(n.sentAt, true)}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </Page>
      </>
    );
  }

  if (appQ.data) {
    const a = appQ.data;
    return (
      <>
        <TopBar crumbs={[{ label: 'Мои заявления', to: '/portal' }, { label: a.number }]} />
        <Page>
          <PageHeader title={a.number} actions={<Badge value={a.status} size="lg" />} />
          <Panel title="Сведения о заявлении">
            <Facts entries={[
              ['Канал подачи', t(a.submissionChannel)],
              ['Подано', formatDate(a.submittedAt)],
              ['Зарегистрировано', formatDate(a.registeredAt)],
            ]} />
            {!a.registeredAt && (
              <p className="mt-4 text-xs leading-relaxed text-ink-4">
                Заявление ожидает регистрации сотрудником органа сертификации. Подробное отслеживание появится
                после того, как по заявлению будет открыто дело.
              </p>
            )}
          </Panel>
        </Page>
      </>
    );
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Мои заявления', to: '/portal' }, { label: '…' }]} />
      <Page><ErrorState error={appQ.error ?? trackingQ.error} /></Page>
    </>
  );
}
