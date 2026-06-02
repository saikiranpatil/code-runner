import Navbar from '@/components/layout/Navbar';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import PublicRoute from '@/components/layout/PublicRoute';
import Login from '@/module/auth/components/Login';
import Register from '@/module/auth/components/Register';
import Problem from '@/module/problem/Problem';
import NotFoundPage from '@/pages/NotFoundPage';
import OAuthCallback from '@/pages/OAuthCallback';
import { URLs } from '@/shared/urls';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';

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
                <Route path={URLs.login} element={<Login />} />
                <Route path={URLs.register} element={<Register />} />
            </Route>

            <Route path={URLs.oauthCallback} element={<OAuthCallback />} />

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                    <Route path={URLs.home} element={<Navigate to={URLs.problems} replace />} />
                    <Route path={URLs.problems} element={<Problem />} />
                </Route>
            </Route>
            
            {/* 404 */}
            <Route path={URLs.notFound} element={<NotFoundPage />} />
        </Routes>
    );
}