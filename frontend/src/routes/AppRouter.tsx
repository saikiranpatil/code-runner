import AuthFormLayout from "@/components/layout/AuthFormLayout";
import Navbar from "@/components/layout/Navbar";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import PublicRoute from "@/components/layout/PublicRoute";
import Login from "@/module/auth/components/Login";
import Register from "@/module/auth/components/Register";
import Problem from "@/module/problem/Problem";
import NotFoundPage from "@/pages/NotFoundPage";
import { URLs } from "@/shared/urls";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";

const AppLayout = () => (
    <>
        <Navbar />
        <Outlet />
    </>
);

const AppRouter = () => {
    return (
        <div className="h-screen overflow-hidden bg-background text-foreground">
            <Routes>
                {/* Default redirect */}
                <Route path="/" element={<Navigate to={URLs.home.base} replace />} />

                {/* Public routes */}
                <Route element={<PublicRoute />}>
                    <Route path={URLs.auth.login} element={<Login />} />
                    <Route path={URLs.auth.register} element={<Register />} />
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
    )
}

export default AppRouter