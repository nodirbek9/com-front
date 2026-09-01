import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import { ApiError } from '@/api/client';
import { Button, Field, Input } from '@/components/ui';
import { t } from '@/lib/format';

const DEMO: [string, string][] = [
  ['admin@example.com', 'Администратор'],
  ['operator@example.com', 'Оператор'],
  ['specialist1@example.com', 'Специалист, основное подразделение'],
  ['specialist2@example.com', 'Специалист, лаборатория'],
  ['depthead.main@example.com', 'Руководитель, основное подразделение'],
  ['depthead.lab@example.com', 'Руководитель, лаборатория'],
  ['accountant@example.com', 'Бухгалтерия'],
  ['head@example.com', 'Руководитель органа сертификации'],
  ['applicant@example.com', 'Заявитель'],
];
const DEMO_PASSWORD = 'Demo12345!';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [formError, setFormError] = useState<{ title: string; body: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    const errs: typeof fieldErrors = {};
    if (!email.trim()) errs.email = 'Введите email';
    else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) errs.email = 'Введите корректный email';
    if (!password) errs.password = 'Введите пароль';
    setFieldErrors(errs);
    if (Object.keys(errs).length) return;

    setBusy(true);
    try {
      await login(email.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      const e2 = err instanceof ApiError ? err : null;
      if (!e2 || e2.status === 0) {
        setFormError({ title: 'Не удаётся связаться с сервером', body: 'API не отвечает. Проверьте, что backend запущен.' });
      } else if (e2.status === 401) {
        setFormError({ title: 'Неверный email или пароль', body: 'Проверьте данные и попробуйте снова.' });
      } else if (e2.status === 403) {
        setFormError({ title: 'Учётная запись не активна', body: e2.message });
      } else {
        setFormError({ title: t(e2.code), body: e2.message });
      }
    } finally { setBusy(false); }
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1fr_440px]">
      {/* left: brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-1 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500 text-sm font-bold text-white">СБ</div>
          <span className="text-sm font-semibold text-white">Орган сертификации</span>
        </div>
        <div className="relative max-w-md">
          <p className="text-3xl font-semibold leading-tight tracking-tight text-white">
            Единая система управления делами сертификации.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-white/50">
            Приём заявлений, первичная проверка, расчёты, параллельное исполнение, согласование
            и подписание — с полным, неизменяемым журналом аудита на каждом шаге.
          </p>
        </div>
        <p className="relative text-2xs text-white/30">Демонстрационная версия — не для промышленной эксплуатации.</p>
      </div>

      {/* right: form */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-500 text-xs font-bold text-white">СБ</div>
            <span className="text-sm font-semibold text-ink-1">Орган сертификации</span>
          </div>

          <h1 className="text-xl font-semibold tracking-tight text-ink-1">Вход в систему</h1>
          <p className="mb-6 mt-1.5 text-sm text-ink-3">Используйте рабочую учётную запись. Доступ ограничен вашей ролью.</p>

          <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
            {formError && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs">
                <strong className="font-semibold text-red-700">{formError.title}</strong>
                <div className="mt-0.5 text-red-600/90">{formError.body}</div>
              </div>
            )}
            <Field label="Email" error={fieldErrors.email}>
              <Input type="email" autoComplete="username" value={email} aria-invalid={!!fieldErrors.email}
                onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </Field>
            <Field label="Пароль" error={fieldErrors.password}>
              <Input type="password" autoComplete="current-password" value={password} aria-invalid={!!fieldErrors.password}
                onChange={(e) => setPassword(e.target.value)} />
            </Field>
            <Button type="submit" variant="primary" loading={busy} className="mt-1 w-full">
              {busy ? 'Выполняется вход…' : 'Войти'}
            </Button>
          </form>

          <div className="mt-8 border-t border-line pt-5">
            <div className="mb-2 text-2xs font-medium uppercase tracking-wide text-ink-4">
              Демо-аккаунты · пароль {DEMO_PASSWORD}
            </div>
            <div className="flex max-h-64 flex-col gap-0.5 overflow-y-auto pr-1">
              {DEMO.map(([mail, role]) => (
                <button
                  key={mail} type="button"
                  onClick={() => { setEmail(mail); setPassword(DEMO_PASSWORD); }}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs transition-colors hover:bg-surface-sunk"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-ink-2">{role}</span>
                    <span className="block truncate font-mono text-2xs text-ink-4">{mail}</span>
                  </span>
                  <span className="shrink-0 text-2xs font-medium text-accent-600">заполнить</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
