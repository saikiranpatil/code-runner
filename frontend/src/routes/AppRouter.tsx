import Navbar from '@/common/layout/Navbar';
import ProtectedRoute from '@/common/layout/ProtectedRoute';
import PublicRoute from '@/common/layout/PublicRoute';
import Login from '@/components/auth/Login';
import Register from '@/components/auth/Register';
import NotFoundPage from '@/pages/NotFoundPage';
import OAuthCallback from '@/pages/OAuthCallback';
import { URLs } from '@/common/urls';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import ProblemsPage from '@/components/problems/Problems';
import ProblemDescription from '@/components/problems/ProblemDetails';

function AppLayout() {
    return (
        <>
            <Navbar />
            <main>
                <Outlet />
            </main>
        </>
    );
}

export default function AppRouter() {
    return (
        <Routes>
            <Route element={<PublicRoute />}>
                <Route path={URLs.auth.login} element={<Login />} />
                <Route path={URLs.auth.register} element={<Register />} />
            </Route>

            <Route path={URLs.oauthCallback} element={<OAuthCallback />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path={URLs.home} element={<Navigate to={URLs.problems.list} replace />} />
                    <Route path={URLs.problems.list} element={<ProblemsPage />} />
                    <Route path={URLs.problems.details} element={<ProblemDescription />} />
                </Route>
            </Route>

            {/* 404 */}
            <Route path={URLs.notFound} element={<NotFoundPage />} />
        </Routes>
    );
}