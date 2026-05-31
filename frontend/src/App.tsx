import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import PublicRoute from '@/components/layout/PublicRoute';
import ProtectedRoute from '@/components/layout/ProtectedRoute';

import AuthPage from '@/pages/Auth/AuthPage';
import Problem from '@/pages/Problem';
import NotFoundPage from '@/pages/NotFoundPage';

import { URLs } from '@/shared/urls';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';

const AppLayout = () => (
  <>
    <Navbar />
    <Outlet />
  </>
);

export default function App() {
  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <Routes>
        {/* Default redirect */}
        <Route path="/" element={<Navigate to={URLs.home.base} replace />} />

        {/* Public routes */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthPage />}>
            <Route path={URLs.auth.login}    element={<LoginPage />} />
            <Route path={URLs.auth.register} element={<RegisterPage />} />
          </Route>
        </Route>

        {/* Protected routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={URLs.home.base} element={<>Home</>} />

            <Route path={URLs.problems.base}>
              <Route index element={<Problem />} />
              <Route path={URLs.problems.problem} element={<>ProblemDetails</>} />
            </Route>
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}