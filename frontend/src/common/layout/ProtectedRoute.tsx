import { Navigate, Outlet } from "react-router-dom";
import { URLs } from "@/common/urls";
import {
    selectAuthStatus,
    selectIsAuthenticated,
    useAuthStore,
} from "@/store/auth.store";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";

const ProtectedRoute = () => {
    const init = useAuthStore((state) => state.init);
    const status = useAuthStore(selectAuthStatus);
    const isAuthenticated = useAuthStore(selectIsAuthenticated);

    useEffect(() => {
        if (status === "idle") init();
    }, [status, init]);

    if (status === "idle" || status === "loading") return <Spinner fullScreen size="lg" />
    if (!isAuthenticated) return <Navigate to={URLs.auth.login} replace />;
    return <Outlet />;
};

export default ProtectedRoute;