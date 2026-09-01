import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api';
import { useToast } from '@/components/Toast';
import { Page, PageHeader, TopBar } from '@/components/Page';
import {
  Badge, Button, EmptyState, ErrorState, Field, Input, Panel, Select, SectionLabel,
  Skeleton, TabBar,
} from '@/components/ui';
import { PlusIcon, XIcon } from '@/components/icons';
import { t } from '@/lib/format';
import type { RoleCode } from '@/types/api';

const ROLES: RoleCode[] = ['ADMIN', 'OPERATOR', 'SPECIALIST', 'DEPARTMENT_HEAD', 'ACCOUNTANT', 'HEAD_OF_CERTIFICATION_BODY', 'APPLICANT'];

type Tab = 'users' | 'departments' | 'positions' | 'catalogues' | 'permissions';

export default function Admin() {
  const [tab, setTab] = useState<Tab>('users');
  const tabs: [Tab, string][] = [
    ['users', 'Пользователи'], ['departments', 'Подразделения'], ['positions', 'Должности'],
    ['catalogues', 'Справочники'], ['permissions', 'Права ролей'],
  ];

  return (
    <>
      <TopBar crumbs={[{ label: 'Администрирование' }]} />
      <Page>
        <PageHeader title="Администрирование" description="Пользователи, организационная структура, справочники и права ролей." />
        <TabBar tabs={tabs} active={tab} onChange={setTab} />
        {tab === 'users' && <UsersTab />}
        {tab === 'departments' && <DepartmentsTab />}
        {tab === 'positions' && <PositionsTab />}
        {tab === 'catalogues' && <CataloguesTab />}
        {tab === 'permissions' && <PermissionsTab />}
      </Page>
    </>
  );
}

/* ───────────────────────── users ───────────────────────── */

function UsersTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'users'], queryFn: () => adminApi.users(0, 100) });
  const deptQ = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const posQ = useQuery({ queryKey: ['admin', 'positions'], queryFn: () => adminApi.positions() });

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', departmentId: '', positionId: '', roleCodes: [] as string[] });

  const create = useMutation({
    mutationFn: () => adminApi.createUser({
      ...form,
      departmentId: form.departmentId || undefined,
      positionId: form.positionId || undefined,
    }),
    onSuccess: () => {
      toast.ok('Пользователь создан');
      setShowForm(false);
      setForm({ email: '', password: '', fullName: '', departmentId: '', positionId: '', roleCodes: [] });
      qc.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (e) => toast.fail(e),
  });
  const block = useMutation({
    mutationFn: (id: string) => adminApi.blockUser(id),
    onSuccess: () => { toast.ok('Пользователь заблокирован'); qc.invalidateQueries({ queryKey: ['admin', 'users'] }); },
    onError: (e) => toast.fail(e),
  });

  function toggleRole(r: string) {
    setForm((f) => ({ ...f, roleCodes: f.roleCodes.includes(r) ? f.roleCodes.filter((x) => x !== r) : [...f.roleCodes, r] }));
  }
  function submit(e: FormEvent) { e.preventDefault(); create.mutate(); }

  const rows = q.data?.content ?? [];

  return (
    <Panel title="Пользователи" actions={<Button size="sm" onClick={() => setShowForm((s) => !s)}><PlusIcon className="h-3.5 w-3.5" />Новый пользователь</Button>} tight>
      {showForm && (
        <form onSubmit={submit} className="border-b border-line bg-surface-sunk px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} /></Field>
            <Field label="Пароль"><Input type="password" required value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} /></Field>
            <Field label="ФИО"><Input required value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} /></Field>
            <Field label="Подразделение">
              <Select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
                <option value="">—</option>
                {(deptQ.data?.content ?? []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>
            <Field label="Должность">
              <Select value={form.positionId} onChange={(e) => setForm((f) => ({ ...f, positionId: e.target.value }))}>
                <option value="">—</option>
                {(posQ.data?.content ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </Field>
          </div>
          <div className="mt-3">
            <SectionLabel>Роли</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {ROLES.map((r) => (
                <button key={r} type="button" onClick={() => toggleRole(r)}
                  className={['rounded-full border px-2.5 py-1 text-xs font-medium transition-colors',
                    form.roleCodes.includes(r) ? 'border-accent-500 bg-accent-50 text-accent-700' : 'border-line-strong text-ink-3 hover:bg-surface'].join(' ')}>
                  {t(r)}
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" variant="primary" className="mt-4" loading={create.isPending} disabled={!form.roleCodes.length}>Создать</Button>
        </form>
      )}

      {q.isLoading ? <div className="p-5"><Skeleton rows={4} /></div> : q.isError ? <div className="p-5"><ErrorState error={q.error} onRetry={() => q.refetch()} /></div> : (
        rows.length === 0 ? <div className="p-5"><EmptyState title="Пользователей нет" /></div> : (
          <ul className="divide-y divide-line-soft">
            {rows.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink-1">{u.fullName}</div>
                  <div className="mt-0.5 text-xs text-ink-4">{u.email} · {u.roles.map(t).join(', ')}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Badge value={u.status} />
                  {u.status !== 'BLOCKED' && (
                    <Button size="sm" variant="danger" loading={block.isPending} onClick={() => block.mutate(u.id)}>Заблокировать</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )
      )}
    </Panel>
  );
}

/* ───────────────────────── departments ───────────────────────── */

function DepartmentsTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'departments'], queryFn: () => adminApi.departments() });
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () => adminApi.createDepartment({ code, name }),
    onSuccess: () => { toast.ok('Подразделение создано'); setCode(''); setName(''); qc.invalidateQueries({ queryKey: ['admin', 'departments'] }); },
    onError: (e) => toast.fail(e),
  });

  return (
    <Panel title="Подразделения" tight>
      <form className="flex items-end gap-2.5 border-b border-line bg-surface-sunk px-5 py-4"
        onSubmit={(e) => { e.preventDefault(); if (code && name) create.mutate(); }}>
        <div className="w-40"><Field label="Код"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field></div>
        <div className="flex-1"><Field label="Название"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
        <Button type="submit" loading={create.isPending}>Добавить</Button>
      </form>
      {q.isLoading ? <div className="p-5"><Skeleton rows={3} /></div> : q.isError ? <div className="p-5"><ErrorState error={q.error} /></div> : (
        <ul className="divide-y divide-line-soft">
          {(q.data?.content ?? []).map((d) => (
            <li key={d.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-ink-1">{d.name}</span>
              <span className="font-mono text-xs text-ink-4">{d.code}</span>
            </li>
          ))}
          {(q.data?.content ?? []).length === 0 && <li className="p-5"><EmptyState title="Подразделений нет" /></li>}
        </ul>
      )}
    </Panel>
  );
}

/* ───────────────────────── positions ───────────────────────── */

function PositionsTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['admin', 'positions'], queryFn: () => adminApi.positions() });
  const [code, setCode] = useState('');
  const [name, setName] = useState('');

  const create = useMutation({
    mutationFn: () => adminApi.createPosition({ code, name }),
    onSuccess: () => { toast.ok('Должность создана'); setCode(''); setName(''); qc.invalidateQueries({ queryKey: ['admin', 'positions'] }); },
    onError: (e) => toast.fail(e),
  });

  return (
    <Panel title="Должности" tight>
      <form className="flex items-end gap-2.5 border-b border-line bg-surface-sunk px-5 py-4"
        onSubmit={(e) => { e.preventDefault(); if (code && name) create.mutate(); }}>
        <div className="w-40"><Field label="Код"><Input value={code} onChange={(e) => setCode(e.target.value)} /></Field></div>
        <div className="flex-1"><Field label="Название"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field></div>
        <Button type="submit" loading={create.isPending}>Добавить</Button>
      </form>
      {q.isLoading ? <div className="p-5"><Skeleton rows={3} /></div> : q.isError ? <div className="p-5"><ErrorState error={q.error} /></div> : (
        <ul className="divide-y divide-line-soft">
          {(q.data?.content ?? []).map((p) => (
            <li key={p.id} className="flex items-center justify-between px-5 py-2.5 text-sm">
              <span className="text-ink-1">{p.name}</span>
              <span className="font-mono text-xs text-ink-4">{p.code}</span>
            </li>
          ))}
          {(q.data?.content ?? []).length === 0 && <li className="p-5"><EmptyState title="Должностей нет" /></li>}
        </ul>
      )}
    </Panel>
  );
}

/* ───────────────────────── catalogues (read-only reference data) ───────────────────────── */

function CataloguesTab() {
  const services = useQuery({ queryKey: ['admin', 'services'], queryFn: () => adminApi.services() });
  const workTypes = useQuery({ queryKey: ['admin', 'work-types'], queryFn: () => adminApi.workTypes() });
  const externalStages = useQuery({ queryKey: ['admin', 'external-stages'], queryFn: () => adminApi.externalStages() });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Panel title="Услуги" tight>
        {services.isLoading ? <div className="p-5"><Skeleton rows={3} /></div> : (
          <ul className="divide-y divide-line-soft">
            {(services.data?.content ?? []).map((s) => (
              <li key={s.id} className="px-5 py-2.5 text-sm text-ink-1">{s.name}</li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Виды работ" tight>
        {workTypes.isLoading ? <div className="p-5"><Skeleton rows={3} /></div> : (
          <ul className="divide-y divide-line-soft">
            {(workTypes.data?.content ?? []).map((w) => (
              <li key={w.id} className="px-5 py-2.5 text-sm text-ink-1">{w.name}</li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="Внешние этапы" tight>
        {externalStages.isLoading ? <div className="p-5"><Skeleton rows={3} /></div> : (
          <ul className="divide-y divide-line-soft">
            {(externalStages.data?.content ?? []).map((e) => (
              <li key={e.id} className="px-5 py-2.5 text-sm text-ink-1">{e.nameForApplicant}</li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

/* ───────────────────────── role permissions ───────────────────────── */

function PermissionsTab() {
  const toast = useToast();
  const qc = useQueryClient();
  const [role, setRole] = useState<RoleCode>('OPERATOR');
  const [newPerm, setNewPerm] = useState('');
  const q = useQuery({ queryKey: ['admin', 'role-permissions', role], queryFn: () => adminApi.rolePermissions(role) });

  const save = useMutation({
    mutationFn: (codes: string[]) => adminApi.setRolePermissions(role, codes),
    onSuccess: () => { toast.ok('Права роли обновлены'); qc.invalidateQueries({ queryKey: ['admin', 'role-permissions', role] }); },
    onError: (e) => toast.fail(e),
  });

  const codes = q.data?.permissionCodes ?? [];

  return (
    <Panel
      title="Права роли"
      subtitle="Права заданы в формате РАЗДЕЛ:ДЕЙСТВИЕ (например, CASE:EDIT). Это лишь один из двух слоёв авторизации — объектный доступ проверяется отдельно на бэкенде."
      actions={
        <Select value={role} onChange={(e) => setRole(e.target.value as RoleCode)} className="w-56">
          {ROLES.map((r) => <option key={r} value={r}>{t(r)}</option>)}
        </Select>
      }
    >
      {q.isLoading ? <Skeleton rows={4} /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <>
          <div className="flex flex-wrap gap-1.5">
            {codes.map((code) => (
              <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface-sunk px-2.5 py-1 font-mono text-xs text-ink-2">
                {code}
                <button type="button" className="text-ink-4 hover:text-red-600" onClick={() => save.mutate(codes.filter((c) => c !== code))}>
                  <XIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
            {codes.length === 0 && <span className="text-xs text-ink-4">У этой роли нет прав.</span>}
          </div>
          <div className="mt-4 flex items-end gap-2">
            <div className="flex-1">
              <Field label="Добавить право" hint="Формат: РАЗДЕЛ:ДЕЙСТВИЕ">
                <Input value={newPerm} onChange={(e) => setNewPerm(e.target.value.toUpperCase())} placeholder="CASE:EDIT" />
              </Field>
            </div>
            <Button
              size="sm" loading={save.isPending} disabled={!newPerm.includes(':')}
              onClick={() => { save.mutate([...codes, newPerm]); setNewPerm(''); }}
            >Добавить</Button>
          </div>
        </>
      )}
    </Panel>
  );
}
