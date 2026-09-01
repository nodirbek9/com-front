import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { approvalsApi, auditApi, tasksApi } from '@/api';
import { useAuth } from '@/auth/AuthContext';
import { initials, t } from '@/lib/format';
import {
  FolderIcon, InboxIcon, CheckSquareIcon, StampIcon, ShieldIcon, SettingsIcon, LogOutIcon,
} from '@/components/icons';
import type { ReactNode } from 'react';

function NavItem({ to, label, icon, count }: { to: string; label: string; icon: ReactNode; count?: number }) {
  return (
    <NavLink
      to={to}
      end={to === '/' || to === '/portal'}
      className={({ isActive }) => [
        'group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors',
        isActive ? 'bg-accent-50 text-accent-700' : 'text-ink-2 hover:bg-ink-1/5',
      ].join(' ')}
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span className={isActive ? 'text-accent-600' : 'text-ink-4 group-hover:text-ink-3'}>{icon}</span>
          <span className="min-w-0 flex-1 truncate">{label}</span>
          {!!count && (
            <span className={[
              'rounded-full px-1.5 py-0.5 text-2xs font-semibold tabular-nums',
              isActive ? 'bg-accent-100 text-accent-700' : 'bg-ink-1/[0.06] text-ink-3',
            ].join(' ')}
            >{count}</span>
          )}
        </>
      )}
    </NavLink>
  );
}

function NavGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1.5 px-2.5 text-2xs font-semibold uppercase tracking-wide text-ink-4">{label}</div>
      <div className="flex flex-col gap-0.5">{children}</div>
    </div>
  );
}

export default function AppShell() {
  const { user, logout, can, hasRole, isApplicantOnly } = useAuth();
  const navigate = useNavigate();

  const myTasks = useQuery({ queryKey: ['tasks', 'my', 'count'], queryFn: () => tasksApi.mine(), enabled: !isApplicantOnly, retry: false });
  const myApprovals = useQuery({ queryKey: ['approvals', 'my', 'count'], queryFn: () => approvalsApi.mine(), retry: false });
  const integrity = useQuery({
    queryKey: ['audit', 'integrity'], queryFn: () => auditApi.integrity(),
    enabled: can('AUDIT:VIEW'), retry: false, refetchInterval: 120_000,
  });

  const openTasks = myTasks.data?.content.filter((x) => x.status !== 'COMPLETED' && x.status !== 'CANCELLED').length;
  const openApprovals = myApprovals.data?.content.filter((x) => x.status === 'SENT' || x.status === 'IN_REVIEW').length;

  return (
    <div className="flex h-screen overflow-hidden bg-surface-sunk">
      <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-500 text-xs font-bold text-white">СБ</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-ink-1">Орган сертификации</div>
            <div className="truncate text-2xs text-ink-4">Система управления делами</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-2.5 pt-2">
          {isApplicantOnly ? (
            <NavGroup label="Мои заявления">
              <NavItem to="/portal" label="Заявления" icon={<InboxIcon className="h-4 w-4" />} />
              <NavItem to="/portal/new" label="Новое заявление" icon={<FolderIcon className="h-4 w-4" />} />
              <NavItem to="/approvals" label="Ожидает решения" icon={<StampIcon className="h-4 w-4" />} count={openApprovals} />
            </NavGroup>
          ) : (
            <>
              <NavGroup label="Работа">
                <NavItem to="/cases" label="Дела" icon={<FolderIcon className="h-4 w-4" />} />
                <NavItem to="/my-tasks" label="Мои задачи" icon={<CheckSquareIcon className="h-4 w-4" />} count={openTasks} />
                <NavItem to="/approvals" label="Мои согласования" icon={<StampIcon className="h-4 w-4" />} count={openApprovals} />
              </NavGroup>
              <NavGroup label="Приём заявлений">
                <NavItem to="/applications" label="Заявления" icon={<InboxIcon className="h-4 w-4" />} />
              </NavGroup>
              {(can('AUDIT:VIEW') || hasRole('ADMIN')) && (
                <NavGroup label="Контроль">
                  {can('AUDIT:VIEW') && <NavItem to="/audit" label="Журнал аудита" icon={<ShieldIcon className="h-4 w-4" />} />}
                  {hasRole('ADMIN') && <NavItem to="/admin" label="Администрирование" icon={<SettingsIcon className="h-4 w-4" />} />}
                </NavGroup>
              )}
            </>
          )}
        </nav>

        <div className="border-t border-line p-3">
          {can('AUDIT:VIEW') && integrity.data && (
            <div className="mb-2.5 flex items-center gap-1.5 rounded-md bg-surface-sunk px-2.5 py-1.5 text-2xs font-medium">
              <span className={['h-1.5 w-1.5 rounded-full', integrity.data.intact ? 'bg-green-500' : 'bg-red-500'].join(' ')} />
              <span className={integrity.data.intact ? 'text-green-700' : 'text-red-700'}>
                {integrity.data.intact ? 'Журнал аудита не нарушен' : `Нарушение в записи #${integrity.data.firstBrokenSeq}`}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2.5 rounded-md px-1 py-1">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-1/[0.07] text-2xs font-semibold text-ink-3">
              {initials(user?.fullName)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-ink-1">{user?.fullName}</div>
              <div className="truncate text-2xs text-ink-4">{(user?.roles ?? []).map(t).join(', ')}</div>
            </div>
            <button
              aria-label="Выйти"
              className="shrink-0 rounded-md p-1.5 text-ink-4 transition-colors hover:bg-ink-1/5 hover:text-ink-2"
              onClick={async () => { await logout(); navigate('/login'); }}
            >
              <LogOutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
