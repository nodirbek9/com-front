// The backend's enum/status codes are English (the wire contract); the UI is Russian throughout.
// Every code the app ever displays is translated here, once, so a new status added to the backend
// only needs one new dictionary entry rather than a hunt through every component that renders it.
const RU: Record<string, string> = {
  // case status
  REGISTERED: 'Зарегистрировано', PRIMARY_CHECK: 'Первичная проверка',
  PRIMARY_CHECK_DONE: 'Первичная проверка завершена', IN_ACCOUNTING: 'В бухгалтерии',
  WAITING_PAYMENT: 'Ожидается оплата', IN_EXECUTION: 'В работе', FINAL_REVIEW: 'Итоговая проверка',
  ON_SIGNING: 'На подписании', COMPLETED: 'Завершено', RETURNED: 'Возвращено', REJECTED: 'Отклонено',
  // task / case-stage status
  CREATED: 'Создано', ASSIGNED: 'Назначено', IN_PROGRESS: 'В процессе',
  SUBMITTED_FOR_REVIEW: 'Отправлено на проверку', RETURNED_FOR_REVISION: 'На доработке',
  CANCELLED: 'Отменено', PENDING: 'Ожидает', ACTIVE: 'Активно', SKIPPED: 'Пропущено',
  // task result / approval / document / payment / generic
  DRAFT: 'Черновик', SUBMITTED: 'Отправлено', APPROVED: 'Одобрено', SUPERSEDED: 'Заменено',
  ENDORSED: 'Согласовано', SIGNED: 'Подписано', PAID: 'Оплачено', NOT_APPROVED: 'Не одобрено',
  DEBT: 'Задолженность', BLOCKED: 'Заблокировано', BROKEN: 'Нарушена', SENT: 'Отправлено',
  IN_REVIEW: 'На рассмотрении', PARTIALLY_PAID: 'Частично оплачено', NOT_CONFIRMED: 'Не подтверждено',
  CONFIRMED: 'Подтверждено',
  // price calculation trigger
  INITIAL: 'Первичный расчёт', MODE_CHANGED: 'Изменён режим', ITEMS_CHANGED: 'Изменены позиции',
  MANUAL_RECALC: 'Ручной пересчёт',
  // comment visibility
  INTERNAL: 'Внутреннее',
  ACCEPTED: 'Принято', UNDER_ENDORSEMENT: 'На согласовании', COMPLETED_APPROVED: 'Одобрено',
  COMPLETED_REJECTED: 'Отклонено',
  // primary-check category
  GREEN: 'Зелёная', YELLOW: 'Жёлтая', RED: 'Красная',
  // primary-check decisions
  RETURNED_TO_APPLICANT: 'Возвращено заявителю',
  NON_APPLICABILITY_OPINION: 'Заключение о неприменимости', ROUTE_CHANGED: 'Маршрут изменён',
  // processing mode
  TRADITIONAL: 'Обычный режим', EXPEDITED: 'Ускоренный режим',
  // submission channel
  PERSONAL_CABINET: 'Личный кабинет', SINGLE_WINDOW: 'Единое окно', PAPER: 'На бумаге',
  OTHER_SERVICE: 'Другой канал',
  // stage types
  ACCOUNTING: 'Бухгалтерия', EXECUTION: 'Исполнение', ENDORSEMENT: 'Согласование',
  SIGNING: 'Подписание', COMPLETION: 'Завершение', PAYMENT_CONTROL: 'Контроль оплаты',
  ROUTING: 'Маршрутизация',
  // roles
  ADMIN: 'Администратор', APPLICANT: 'Заявитель', ACCOUNTANT: 'Бухгалтер',
  HEAD_OF_CERTIFICATION_BODY: 'Руководитель органа сертификации',
  DEPARTMENT_HEAD: 'Руководитель подразделения', SPECIALIST: 'Специалист', OPERATOR: 'Оператор',
  // approval mode
  PARALLEL: 'Параллельно', SEQUENTIAL: 'Последовательно',
  // document types
  CERTIFICATE: 'Сертификат', CONCLUSION: 'Заключение', PROTOCOL: 'Протокол', ACT: 'Акт',
  LETTER: 'Письмо', REFUSAL: 'Отказ', NON_APPLICABILITY: 'Неприменимость',
  TECHNICAL_SPEC: 'Технические условия', DECISION: 'Решение',
  // misc
  DIDOX: 'Didox', OTHER: 'Другое', USER: 'Пользователь', DEPARTMENT: 'Подразделение',
  INDIVIDUAL: 'Физическое лицо', LEGAL_ENTITY: 'Юридическое лицо',
};

export const t = (code?: string | null): string => {
  if (!code) return '';
  return RU[code] ?? code.replace(/_/g, ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase());
};

// The backend's error `message` field is always English (API_SPEC.md 9's wire contract). Only the
// handful of structural codes every request can hit (GlobalExceptionHandler) are translated here -
// business-specific DomainException codes are too numerous to enumerate safely, so errorMessage()
// returns null for anything unmapped and callers fall back to the Russian status title alone
// (never the raw English sentence).
const ERROR_RU: Record<string, string> = {
  PERMISSION_DENIED: 'У вас нет прав для выполнения этого действия.',
  VALIDATION_FAILED: 'Проверьте правильность заполнения формы.',
  CONCURRENT_MODIFICATION: 'Запись была изменена другим пользователем. Обновите страницу и повторите попытку.',
  DATA_INTEGRITY_VIOLATION: 'Действие конфликтует с существующей записью или бизнес-правилом.',
  INTERNAL_ERROR: 'Произошла непредвиденная ошибка на сервере.',
  RESOURCE_NOT_FOUND: 'Запись не найдена.',
  NETWORK_ERROR: 'Не удаётся связаться с сервером. Проверьте, что backend запущен.',
};

export function errorMessage(code?: string | null): string | null {
  if (!code) return null;
  return ERROR_RU[code] ?? null;
}

export function formatDate(iso?: string | null, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
  if (!withTime) return date;
  return `${date}, ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
}

export function formatMoney(v?: string | number | null, currency?: string | null): string {
  if (v === null || v === undefined || v === '') return '—';
  const n = typeof v === 'string' ? Number(v) : v;
  if (Number.isNaN(n)) return String(v);
  const formatted = n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return currency ? `${formatted} ${currency}` : formatted;
}

export function relativeDeadline(iso?: string | null): string | null {
  if (!iso) return null;
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return `просрочено на ${Math.abs(days)} дн.`;
  if (days === 0) return 'срок сегодня';
  return `осталось ${days} дн.`;
}

export async function sha256Hex(input: Blob | string): Promise<string> {
  const data = typeof input === 'string' ? new TextEncoder().encode(input) : new Uint8Array(await input.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function initials(fullName?: string | null): string {
  if (!fullName) return '?';
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}
