import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { applicationsApi, serviceCatalogApi } from '@/api';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import { Button, Field, Input, Panel, Select, Skeleton } from '@/components/ui';
import { PlusIcon, XIcon } from '@/components/icons';
import { t } from '@/lib/format';
import type { CaseItemInput } from '@/types/api';

const CHANNELS = ['PERSONAL_CABINET', 'SINGLE_WINDOW', 'OTHER_SERVICE', 'PAPER'];

const emptyItem = (): CaseItemInput => ({ name: '', quantity: 1, unit: 'шт.', objectAddress: '' });

export default function NewApplication() {
  const navigate = useNavigate();
  const toast = useToast();
  const servicesQ = useQuery({ queryKey: ['services'], queryFn: () => serviceCatalogApi.list() });

  const [serviceId, setServiceId] = useState('');
  const [channel, setChannel] = useState('PERSONAL_CABINET');
  const [items, setItems] = useState<CaseItemInput[]>([emptyItem()]);

  const create = useMutation({
    mutationFn: async () => {
      const app = await applicationsApi.create({
        serviceId, submissionChannel: channel, formData: {},
        items: items.filter((i) => i.name.trim()).map((i) => ({ ...i, objectAddress: i.objectAddress || null })),
      });
      return applicationsApi.submit(app.id);
    },
    onSuccess: () => { toast.ok('Заявление подано'); navigate('/portal'); },
    onError: (e) => toast.fail(e),
  });

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!serviceId) { toast.fail(null, 'Выберите услугу'); return; }
    create.mutate();
  }

  function updateItem(i: number, patch: Partial<CaseItemInput>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  return (
    <>
      <TopBar crumbs={[{ label: 'Мои заявления', to: '/portal' }, { label: 'Новое заявление' }]} />
      <Page>
        <PageHeader title="Новое заявление" description="Заполните форму, чтобы подать заявление на сертификацию." />

        <form onSubmit={submit}>
          <Panel title="Услуга и канал подачи">
            {servicesQ.isLoading ? <Skeleton rows={2} /> : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Услуга">
                  <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
                    <option value="">Выберите услугу…</option>
                    {(servicesQ.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field label="Канал подачи">
                  <Select value={channel} onChange={(e) => setChannel(e.target.value)}>
                    {CHANNELS.map((c) => <option key={c} value={c}>{t(c)}</option>)}
                  </Select>
                </Field>
              </div>
            )}
          </Panel>

          <Panel
            title="Позиции заявления"
            subtitle="Объекты или единицы, к которым применяется услуга."
            actions={<Button type="button" size="sm" onClick={() => setItems((p) => [...p, emptyItem()])}><PlusIcon className="h-3.5 w-3.5" />Добавить позицию</Button>}
          >
            <div className="flex flex-col gap-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-1 gap-2.5 rounded-md border border-line-soft p-3 sm:grid-cols-[2fr_1fr_1fr_2fr_auto]">
                  <Field label="Наименование"><Input value={item.name} onChange={(e) => updateItem(i, { name: e.target.value })} placeholder="Название объекта" /></Field>
                  <Field label="Кол-во"><Input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 1 })} /></Field>
                  <Field label="Ед. изм."><Input value={item.unit} onChange={(e) => updateItem(i, { unit: e.target.value })} /></Field>
                  <Field label="Адрес объекта"><Input value={item.objectAddress ?? ''} onChange={(e) => updateItem(i, { objectAddress: e.target.value })} /></Field>
                  <div className="flex items-end">
                    {items.length > 1 && (
                      <button type="button" className="h-8.5 w-8.5 shrink-0 rounded-md text-ink-4 transition-colors hover:bg-red-50 hover:text-red-600"
                        onClick={() => setItems((p) => p.filter((_, idx) => idx !== i))}>
                        <XIcon className="mx-auto h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="ghost" onClick={() => navigate('/portal')}>Отмена</Button>
            <Button type="submit" variant="primary" loading={create.isPending}>Подать заявление</Button>
          </div>
        </form>
      </Page>
    </>
  );
}
