import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/auth/AuthContext';
import AppShell from '@/components/AppShell';
import { SpinnerIcon } from '@/components/icons';
import Login from '@/pages/Login';
import Cases from '@/pages/Cases';
import CaseDetail from '@/pages/CaseDetail';
import Applications from '@/pages/Applications';
import MyTasks from '@/pages/MyTasks';
import MyApprovals from '@/pages/MyApprovals';
import Admin from '@/pages/Admin';
import AuditTrail from '@/pages/AuditTrail';
import { PortalList, PortalTracking } from '@/pages/Portal';
import NewApplication from '@/pages/NewApplication';

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center bg-surface-sunk">
      <SpinnerIcon className="h-6 w-6 text-accent-500" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function HomeRedirect() {
  const { isApplicantOnly } = useAuth();
  return <Navigate to={isApplicantOnly ? '/portal' : '/cases'} replace />;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return <FullScreenSpinner />;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AppShell /></RequireAuth>}>
        <Route index element={<HomeRedirect />} />
        <Route path="cases" element={<Cases />} />
        <Route path="cases/:id" element={<CaseDetail />} />
        <Route path="applications" element={<Applications />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="approvals" element={<MyApprovals />} />
        <Route path="admin" element={<Admin />} />
        <Route path="audit" element={<AuditTrail />} />
        <Route path="portal" element={<PortalList />} />
        <Route path="portal/new" element={<NewApplication />} />
        <Route path="portal/:id" element={<PortalTracking />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
