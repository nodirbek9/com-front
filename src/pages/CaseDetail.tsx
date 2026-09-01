import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  casesApi, documentsApi, financeApi, performedWorkApi, tasksApi,
} from '@/api';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import {
  Badge, Button, EmptyState, ErrorState, Facts, Field, Input, Panel, Select, SectionLabel,
  Skeleton, TabBar, Textarea,
} from '@/components/ui';
import { formatDate, formatMoney, relativeDeadline, t } from '@/lib/format';
import type { CaseItem, CaseResponse, PrimaryCheckCategory, PrimaryCheckDecision } from '@/types/api';

type Tab = 'overview' | 'tasks' | 'finance' | 'documents' | 'items' | 'discussion' | 'audit';

export default function CaseDetail() {
  const { id = '' } = useParams();
  const [tab, setTab] = useState<Tab>('overview');
  const toast = useToast();
  const qc = useQueryClient();
  const { can } = useAuth();

  const caseQ = useQuery({ queryKey: ['case', id], queryFn: () => casesApi.get(id) });

  if (caseQ.isLoading) {
    return (
      <>
        <TopBar crumbs={[{ label: 'Дела', to: '/cases' }, { label: '…' }]} />
        <Page><Skeleton rows={6} /></Page>
      </>
    );
  }
  if (caseQ.isError || !caseQ.data) {
    return (
      <>
        <TopBar crumbs={[{ label: 'Дела', to: '/cases' }, { label: '…' }]} />
        <Page><ErrorState error={caseQ.error} onRetry={() => caseQ.refetch()} /></Page>
      </>
    );
  }
  const c = caseQ.data;
  const refetchCase = () => qc.invalidateQueries({ queryKey: ['case', id] });

  const tabs: [Tab, string][] = [
    ['overview', 'Обзор'],
    ...(can('TASK:VIEW') ? ([['tasks', 'Задачи']] as [Tab, string][]) : []),
    ...(can('FINANCE:VIEW') ? ([['finance', 'Финансы']] as [Tab, string][]) : []),
    ...(can('DOCUMENT:VIEW') ? ([['documents', 'Документы']] as [Tab, string][]) : []),
    ['items', 'Позиции'], ['discussion', 'Обсуждение'],
    ...(can('AUDIT:VIEW') ? ([['audit', 'Аудит']] as [Tab, string][]) : []),
  ];

  return (
    <>
      <TopBar crumbs={[{ label: 'Дела', to: '/cases' }, { label: c.caseNumber }]} />
      <Page>
        <PageHeader
          title={c.caseNumber}
          description={`${c.service?.name ?? 'Услуга не указана'} · ${c.applicant?.displayName ?? 'Заявитель не указан'}`}
          actions={<Badge value={c.status} kind="case" size="lg" />}
        />

        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'overview' && <Overview c={c} onChanged={refetchCase} toast={toast} />}
        {tab === 'tasks' && <TasksTab caseId={id} toast={toast} />}
        {tab === 'finance' && <FinanceTab caseId={id} currency={c.finance?.paymentStatus ? 'UZS' : 'UZS'} toast={toast} onChanged={refetchCase} />}
        {tab === 'documents' && <DocumentsTab caseId={id} toast={toast} />}
        {tab === 'items' && <ItemsTab caseId={id} toast={toast} />}
        {tab === 'discussion' && <DiscussionTab caseId={id} toast={toast} />}
        {tab === 'audit' && <AuditTab caseId={id} />}
      </Page>
    </>
  );
}

/* ───────────────────────── overview ───────────────────────── */

function Overview({ c, onChanged, toast }: { c: CaseResponse; onChanged: () => void; toast: ReturnType<typeof useToast> }) {
  const { can } = useAuth();
  const timelineQ = useQuery({ queryKey: ['case', c.id, 'timeline'], queryFn: () => casesApi.timeline(c.id) });
  const [category, setCategory] = useState<PrimaryCheckCategory>('GREEN');
  const [decision, setDecision] = useState<PrimaryCheckDecision>('ACCEPTED');
  const [reason, setReason] = useState('');

  const primaryCheck = useMutation({
    mutationFn: () => casesApi.primaryCheck(c.id, { category, decision, reason: reason || undefined }),
    onSuccess: () => { toast.ok('Первичная проверка сохранена'); onChanged(); },
    onError: (e) => toast.fail(e),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
      <div>
        <Panel title="Этапы дела" tight>
          {timelineQ.isLoading ? <div className="p-5"><Skeleton rows={4} /></div> : (
            <ul className="divide-y divide-line-soft">
              {(timelineQ.data ?? []).map((s) => (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-medium text-ink-1">
                      {s.sequence}. {s.stageName}
                      {s.parallelGroup && <span className="rounded bg-ink-1/[0.06] px-1.5 py-0.5 text-2xs font-normal text-ink-4">параллельно</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-ink-4">{t(s.stageType)}{s.internalStatusLabel ? ` · ${s.internalStatusLabel}` : ''}</div>
                  </div>
                  <div className="shrink-0 text-right">
                    <Badge value={s.status} kind="stage" />
                    {s.dueAt && <div className={['mt-0.5 text-2xs', s.overdue ? 'text-red-600' : 'text-ink-4'].join(' ')}>{relativeDeadline(s.dueAt)}</div>}
                  </div>
                </li>
              ))}
              {timelineQ.data?.length === 0 && <li className="px-5 py-8"><EmptyState title="Этапы ещё не созданы" /></li>}
            </ul>
          )}
        </Panel>

        {c.status === 'PRIMARY_CHECK' && can('PRIMARY_CHECK:CREATE') && (
          <Panel title="Первичная проверка" subtitle="Классифицируйте заявление и примите решение о дальнейшем маршруте.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Категория">
                <Select value={category} onChange={(e) => setCategory(e.target.value as PrimaryCheckCategory)}>
                  <option value="GREEN">Зелёная</option>
                  <option value="YELLOW">Жёлтая</option>
                  <option value="RED">Красная</option>
                </Select>
              </Field>
              <Field label="Решение">
                <Select value={decision} onChange={(e) => setDecision(e.target.value as PrimaryCheckDecision)}>
                  <option value="ACCEPTED">Принято</option>
                  <option value="RETURNED_TO_APPLICANT">Вернуть заявителю</option>
                  <option value="NON_APPLICABILITY_OPINION">Заключение о неприменимости</option>
                  <option value="ROUTE_CHANGED">Изменить маршрут</option>
                  <option value="REJECTED">Отклонить</option>
                </Select>
              </Field>
            </div>
            {decision !== 'ACCEPTED' && (
              <div className="mt-3">
                <Field label="Комментарий / причина">
                  <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} className="font-sans" />
                </Field>
              </div>
            )}
            <Button variant="primary" className="mt-4" loading={primaryCheck.isPending} onClick={() => primaryCheck.mutate()}>
              Сохранить решение
            </Button>
          </Panel>
        )}
      </div>

      <div>
        <Panel title="Сведения" tight>
          <div className="px-5 py-1">
            <Facts entries={[
              ['Заявление', c.applicationNumber],
              ['Заявитель', c.applicant?.displayName ?? '—'],
              ['ИНН', c.applicant?.tin ?? '—'],
              ['Телефон', c.applicant?.phone ?? '—'],
              ['Услуга', c.service?.name ?? '—'],
              ['Режим', c.processingMode ? t(c.processingMode) : '—'],
              ['Категория проверки', c.primaryCheckCategory ? t(c.primaryCheckCategory) : '—'],
              ['Основное подразделение', c.mainResponsibleDepartment?.name ?? '—'],
              ['Рабочий процесс', c.workflow ? `${c.workflow.code} v${c.workflow.version}` : '—'],
              ['Срок', formatDate(c.dueAt)],
              ['Создано', formatDate(c.createdAt)],
            ]} />
          </div>
        </Panel>
        {c.finance && (
          <Panel title="Финансы кратко" tight>
            <div className="px-5 py-1">
              <Facts entries={[
                ['Договор', c.finance.contractNumber ?? '—'],
                ['Сумма', formatMoney(c.finance.totalAmount)],
                ['Подтверждено', formatMoney(c.finance.confirmedAmount)],
                ['Задолженность', formatMoney(c.finance.debtAmount)],
                ['Статус оплаты', c.finance.paymentStatus ? <Badge value={c.finance.paymentStatus} /> : '—'],
              ]} />
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

/* ───────────────────────── tasks ───────────────────────── */

function TasksTab({ caseId, toast }: { caseId: string; toast: ReturnType<typeof useToast> }) {
  const { can, user } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['tasks', 'case', caseId], queryFn: () => tasksApi.list({ caseId, size: 100 }) });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tasks', 'case', caseId] });

  const assign = useMutation({
    mutationFn: (id: string) => tasksApi.assign(id, user!.id),
    onSuccess: () => { toast.ok('Задача назначена вам'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
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
  const submitResult = useMutation({
    // TaskResult.payload is stored as jsonb on the backend — a plain free-text string is invalid
    // JSON and the insert fails with a raw Postgres "invalid input syntax for type json" error, so
    // the free-text the user enters here is wrapped into a minimal JSON document before sending.
    mutationFn: ({ id, summary, payload }: { id: string; summary: string; payload: string }) =>
      tasksApi.submitResult(id, { payload: JSON.stringify({ note: payload }), summary }),
    onSuccess: () => { toast.ok('Результат отправлен'); invalidate(); },
    onError: (e) => toast.fail(e),
  });

  if (q.isLoading) return <Panel title="Задачи"><Skeleton rows={4} /></Panel>;
  if (q.isError) return <Panel title="Задачи"><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const rows = q.data?.content ?? [];

  return (
    <Panel title="Задачи по делу" subtitle="Параллельные этапы порождают несколько активных задач одновременно." tight>
      {rows.length === 0 ? <div className="p-5"><EmptyState title="Задач пока нет" /></div> : (
        <ul className="divide-y divide-line-soft">
          {rows.map((task) => (
            <li key={task.id} className="px-5 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-1">{task.title}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-4">
                    <Badge value={task.status} kind="task" />
                    {task.deadline && <span className={task.overdue ? 'text-red-600' : ''}>{relativeDeadline(task.deadline)}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {task.status === 'CREATED' && !task.assignedUserId && can('TASK:EDIT') && (
                    <Button size="sm" loading={assign.isPending} onClick={() => assign.mutate(task.id)}>Назначить себе</Button>
                  )}
                  {task.status === 'ASSIGNED' && can('TASK:EDIT') && (
                    <Button size="sm" loading={start.isPending} onClick={() => start.mutate(task.id)}>Начать</Button>
                  )}
                  {(task.status === 'IN_PROGRESS' || task.status === 'SUBMITTED_FOR_REVIEW') && can('TASK:EDIT') && (
                    <Button size="sm" variant="primary" loading={complete.isPending}
                      onClick={() => complete.mutate({ id: task.id, version: task.version })}>Завершить</Button>
                  )}
                </div>
              </div>
              {task.status === 'IN_PROGRESS' && can('TASK:EDIT') && (
                <TaskResultForm taskId={task.id} loading={submitResult.isPending}
                  onSubmit={(summary, payload) => submitResult.mutate({ id: task.id, summary, payload })} />
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TaskResultForm({ taskId, loading, onSubmit }: { taskId: string; loading: boolean; onSubmit: (summary: string, payload: string) => void }) {
  const [summary, setSummary] = useState('');
  const [payload, setPayload] = useState('');
  return (
    <div className="mt-3 rounded-md border border-line-soft bg-surface-sunk p-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Field label="Краткое резюме">
          <input className="h-8.5 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-accent-400 focus:shadow-focus"
            value={summary} onChange={(e) => setSummary(e.target.value)} placeholder={`Итог по задаче ${taskId.slice(0, 8)}`} />
        </Field>
        <Field label="Результат (ссылка / текст)">
          <input className="h-8.5 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-accent-400 focus:shadow-focus"
            value={payload} onChange={(e) => setPayload(e.target.value)} placeholder="Описание выполненной работы" />
        </Field>
      </div>
      <Button className="mt-2" size="sm" disabled={!payload.trim()} loading={loading}
        onClick={() => onSubmit(summary, payload)}>
        Отправить результат
      </Button>
    </div>
  );
}

/* ───────────────────────── finance ───────────────────────── */

function FinanceTab({ caseId, toast, onChanged }: { caseId: string; currency: string; toast: ReturnType<typeof useToast>; onChanged: () => void }) {
  const { can } = useAuth();
  const priceQ = useQuery({ queryKey: ['finance', caseId, 'price'], queryFn: () => financeApi.price(caseId), retry: false });
  const paymentQ = useQuery({ queryKey: ['finance', caseId, 'payment'], queryFn: () => financeApi.payment(caseId), retry: false });
  const priceNotFound = priceQ.error instanceof ApiError && priceQ.error.status === 404;
  const paymentNotFound = paymentQ.error instanceof ApiError && paymentQ.error.status === 404;
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['finance', caseId] });
    onChanged();
  };

  const [mode, setModeValue] = useState<'TRADITIONAL' | 'EXPEDITED'>('TRADITIONAL');
  const setMode = useMutation({
    mutationFn: () => financeApi.setMode(caseId, mode),
    onSuccess: () => { toast.ok('Режим обработки сохранён'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const calculate = useMutation({
    mutationFn: () => financeApi.calculate(caseId),
    onSuccess: () => { toast.ok('Расчёт стоимости выполнен'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const confirmPrice = useMutation({
    mutationFn: () => financeApi.confirmPrice(caseId),
    onSuccess: () => { toast.ok('Стоимость подтверждена'); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const [contractNumber, setContractNumber] = useState('');
  const [contractDate, setContractDate] = useState('');
  const [sentChannel, setSentChannel] = useState('DIDOX');
  const recordContract = useMutation({
    mutationFn: () => financeApi.recordContract(caseId, {
      contractNumber, contractDate, sentChannel, sentAt: new Date().toISOString(),
    }),
    onSuccess: () => { toast.ok('Договор зарегистрирован'); setContractNumber(''); setContractDate(''); invalidate(); },
    onError: (e) => toast.fail(e),
  });
  const [amount, setAmount] = useState('');
  const confirmPayment = useMutation({
    mutationFn: () => financeApi.confirmPayment(caseId, { amount }),
    onSuccess: () => { toast.ok('Оплата подтверждена'); setAmount(''); invalidate(); },
    onError: (e) => toast.fail(e),
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div>
        <Panel title="Стоимость" actions={can('FINANCE:CREATE') && (
          <Button size="sm" loading={calculate.isPending} onClick={() => calculate.mutate()}>Пересчитать</Button>
        )}>
          {can('FINANCE:EDIT') && (
            <div className="mb-4 flex items-end gap-2 border-b border-line-soft pb-4">
              <div className="flex-1">
                <Field label="Режим обработки">
                  <Select value={mode} onChange={(e) => setModeValue(e.target.value as 'TRADITIONAL' | 'EXPEDITED')}>
                    <option value="TRADITIONAL">Обычный режим</option>
                    <option value="EXPEDITED">Ускоренный режим</option>
                  </Select>
                </Field>
              </div>
              <Button size="sm" loading={setMode.isPending} onClick={() => setMode.mutate()}>Сохранить режим</Button>
            </div>
          )}
          {priceQ.isLoading ? <Skeleton rows={3} /> : priceQ.isError ? (
            priceNotFound
              ? <EmptyState title="Расчёт ещё не выполнялся" body="Нажмите «Пересчитать», чтобы получить первый расчёт стоимости." />
              : <ErrorState error={priceQ.error} onRetry={() => priceQ.refetch()} />
          ) : priceQ.data && (
            <>
              <Facts entries={[
                ['№ расчёта', `#${priceQ.data.calculationNo}`],
                ['Режим', t(priceQ.data.processingMode)],
                ['Сумма', formatMoney(priceQ.data.calculatedTotal, priceQ.data.currency)],
                ['Статус', <Badge value={priceQ.data.status} />],
                ['Рассчитано', formatDate(priceQ.data.calculatedAt, true)],
              ]} />
              {priceQ.data.status === 'ACTIVE' && can('FINANCE:APPROVE') && (
                <Button className="mt-3" variant="primary" size="sm" loading={confirmPrice.isPending} onClick={() => confirmPrice.mutate()}>
                  Подтвердить стоимость
                </Button>
              )}
              {priceQ.data.lines.length > 0 && (
                <div className="mt-4">
                  <SectionLabel>Позиции расчёта</SectionLabel>
                  <ul className="divide-y divide-line-soft text-xs">
                    {priceQ.data.lines.map((l) => (
                      <li key={l.lineNo} className="flex items-center justify-between py-1.5">
                        <span className="text-ink-3">{l.description}</span>
                        <span className="num font-medium text-ink-1">{formatMoney(l.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </Panel>

        {priceQ.data?.status === 'CONFIRMED' && can('FINANCE:EDIT') && (
          <Panel title="Договор" subtitle="Зафиксируйте номер и дату договора после подтверждения стоимости.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Номер договора">
                <Input value={contractNumber} onChange={(e) => setContractNumber(e.target.value)} placeholder="Д-2026-001" />
              </Field>
              <Field label="Дата договора">
                <Input type="date" value={contractDate} onChange={(e) => setContractDate(e.target.value)} />
              </Field>
              <Field label="Канал отправки">
                <Select value={sentChannel} onChange={(e) => setSentChannel(e.target.value)}>
                  <option value="DIDOX">Didox</option>
                  <option value="OTHER">Другое</option>
                </Select>
              </Field>
            </div>
            <Button className="mt-3" size="sm" variant="primary" disabled={!contractNumber || !contractDate}
              loading={recordContract.isPending} onClick={() => recordContract.mutate()}>
              Зарегистрировать договор
            </Button>
          </Panel>
        )}
      </div>

      <Panel title="Оплата">
        {paymentQ.isLoading ? <Skeleton rows={3} /> : paymentQ.isError ? (
          paymentNotFound
            ? <EmptyState title="Данные об оплате пока недоступны" body="Появятся после подтверждения стоимости и выставления договора." />
            : <ErrorState error={paymentQ.error} onRetry={() => paymentQ.refetch()} />
        ) : paymentQ.data && (
          <>
            <Facts entries={[
              ['Статус', <Badge value={paymentQ.data.status} />],
              ['Сумма договора', formatMoney(paymentQ.data.contractAmount)],
              ['Подтверждено', formatMoney(paymentQ.data.confirmedAmount)],
              ['Задолженность', formatMoney(paymentQ.data.debtAmount)],
              ['Срок оплаты', formatDate(paymentQ.data.dueAt)],
            ]} />
            {paymentQ.data.status !== 'PAID' && can('FINANCE:APPROVE') && (
              <div className="mt-4 flex items-end gap-2">
                <div className="flex-1">
                  <Field label="Сумма подтверждения">
                    <input className="h-8.5 w-full rounded-md border border-line-strong bg-surface px-2.5 text-sm outline-none focus:border-accent-400 focus:shadow-focus num"
                      value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </Field>
                </div>
                <Button variant="primary" size="sm" disabled={!amount} loading={confirmPayment.isPending} onClick={() => confirmPayment.mutate()}>
                  Подтвердить
                </Button>
              </div>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}

/* ───────────────────────── documents ───────────────────────── */

function DocumentsTab({ caseId, toast }: { caseId: string; toast: ReturnType<typeof useToast> }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['documents', caseId], queryFn: () => documentsApi.listForCase(caseId) });
  const sign = useMutation({
    mutationFn: async (docId: string) => {
      const doc = await documentsApi.get(docId);
      const latest = doc.versions.reduce((a, b) => (b.versionNo > a.versionNo ? b : a));
      return documentsApi.sign(docId, latest.versionNo);
    },
    onSuccess: () => { toast.ok('Документ подписан'); qc.invalidateQueries({ queryKey: ['documents', caseId] }); },
    onError: (e) => toast.fail(e),
  });

  if (q.isLoading) return <Panel title="Документы"><Skeleton rows={4} /></Panel>;
  if (q.isError) return <Panel title="Документы"><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const docs = q.data ?? [];

  return (
    <Panel title="Документы дела" tight>
      {docs.length === 0 ? <div className="p-5"><EmptyState title="Документы ещё не созданы" /></div> : (
        <ul className="divide-y divide-line-soft">
          {docs.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-4 px-5 py-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink-1">{d.title}</div>
                <div className="mt-0.5 text-xs text-ink-4">{t(d.documentType)} · обновлён {formatDate(d.updatedAt)}</div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge value={d.status} />
                {d.status === 'ENDORSED' && d.currentVersionId && can('DOCUMENT:SIGN') && (
                  <Button size="sm" variant="primary" loading={sign.isPending}
                    onClick={() => sign.mutate(d.id)}>Подписать</Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

/* ───────────────────────── items ───────────────────────── */

function ItemsTab({ caseId, toast }: { caseId: string; toast: ReturnType<typeof useToast> }) {
  const { can } = useAuth();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['case', caseId, 'items'], queryFn: () => casesApi.items(caseId) });
  const save = useMutation({
    mutationFn: (items: CaseItem[]) => casesApi.saveItems(caseId, items),
    onSuccess: () => { toast.ok('Позиции сохранены'); qc.invalidateQueries({ queryKey: ['case', caseId, 'items'] }); },
    onError: (e) => toast.fail(e),
  });

  if (q.isLoading) return <Panel title="Позиции"><Skeleton rows={4} /></Panel>;
  if (q.isError) return <Panel title="Позиции"><ErrorState error={q.error} onRetry={() => q.refetch()} /></Panel>;
  const items = q.data ?? [];

  return (
    <Panel title="Позиции дела" subtitle="Объекты / единицы, к которым применяется услуга. Изменение позиций может вызвать пересчёт стоимости.">
      {items.length === 0 ? <EmptyState title="Позиции не указаны" /> : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-left text-2xs font-medium uppercase tracking-wide text-ink-4">
                <th className="py-2 pr-3 font-medium">Наименование</th>
                <th className="py-2 pr-3 font-medium">Кол-во</th>
                <th className="py-2 pr-3 font-medium">Ед.</th>
                <th className="py-2 font-medium">Адрес объекта</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={it.id ?? i} className="border-b border-line-soft last:border-0">
                  <td className="py-2.5 pr-3">{it.itemName}</td>
                  <td className="py-2.5 pr-3 num">{it.quantity}</td>
                  <td className="py-2.5 pr-3">{it.unit}</td>
                  <td className="py-2.5 text-ink-3">{it.objectAddress ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {items.length > 0 && can('CASE:EDIT') && (
        <Button className="mt-4" size="sm" loading={save.isPending} onClick={() => save.mutate(items)}>
          Пересохранить (пересчитать стоимость)
        </Button>
      )}
    </Panel>
  );
}

/* ───────────────────────── discussion ───────────────────────── */

function DiscussionTab({ caseId, toast }: { caseId: string; toast: ReturnType<typeof useToast> }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['case', caseId, 'comments'], queryFn: () => casesApi.comments(caseId) });
  const [body, setBody] = useState('');
  const add = useMutation({
    mutationFn: () => casesApi.addComment(caseId, body),
    onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['case', caseId, 'comments'] }); },
    onError: (e) => toast.fail(e),
  });

  function submit(e: FormEvent) { e.preventDefault(); if (body.trim()) add.mutate(); }

  return (
    <Panel title="Внутреннее обсуждение" subtitle="Видно только сотрудникам органа сертификации.">
      <form onSubmit={submit} className="mb-5 flex items-start gap-2.5">
        <div className="flex-1">
          <Textarea rows={2} className="font-sans" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Написать комментарий…" />
        </div>
        <Button type="submit" variant="primary" loading={add.isPending} disabled={!body.trim()}>Отправить</Button>
      </form>
      {q.isLoading ? <Skeleton rows={3} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        (q.data ?? []).length === 0 ? <EmptyState title="Комментариев пока нет" /> : (
          <ul className="flex flex-col gap-3">
            {(q.data ?? []).map((cm) => (
              <li key={cm.id} className="rounded-md border border-line-soft bg-surface-sunk px-3.5 py-2.5">
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-ink-2">{cm.authorName ?? 'Сотрудник'}</span>
                  <span className="text-ink-4">{formatDate(cm.createdAt, true)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-ink-1">{cm.body}</p>
              </li>
            ))}
          </ul>
        )
      )}
    </Panel>
  );
}

/* ───────────────────────── audit ───────────────────────── */

function AuditTab({ caseId }: { caseId: string }) {
  const q = useQuery({ queryKey: ['case', caseId, 'audit'], queryFn: () => casesApi.audit(caseId) });
  const worksQ = useQuery({ queryKey: ['case', caseId, 'works'], queryFn: () => performedWorkApi.forCase(caseId) });
  const rows = useMemo(() => q.data?.content ?? [], [q.data]);

  return (
    <div className="flex flex-col gap-4">
      <Panel title="Журнал аудита дела" tight>
        {q.isLoading ? <div className="p-5"><Skeleton rows={4} /></div> : q.isError ? <div className="p-5"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div> : (
          rows.length === 0 ? <div className="p-5"><EmptyState title="Записей аудита пока нет" /></div> : (
            <ul className="divide-y divide-line-soft">
              {rows.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                  <div className="min-w-0">
                    <span className="font-mono text-2xs text-ink-4">#{a.seq}</span>{' '}
                    <span className="font-medium text-ink-1">{a.action}</span>{' '}
                    <span className="text-ink-4">на {a.entityType}</span>
                  </div>
                  <span className="shrink-0 text-xs text-ink-4">{formatDate(a.createdAt, true)}</span>
                </li>
              ))}
            </ul>
          )
        )}
      </Panel>
      {(worksQ.data?.length ?? 0) > 0 && (
        <Panel title="Выполненные работы" tight>
          <ul className="divide-y divide-line-soft">
            {(worksQ.data ?? []).map((w) => (
              <li key={w.id} className="flex items-center justify-between gap-4 px-5 py-2.5 text-sm">
                <span className="text-ink-2">{t(w.processingMode)}</span>
                <span className="text-xs text-ink-4">{formatDate(w.performedAt)}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
