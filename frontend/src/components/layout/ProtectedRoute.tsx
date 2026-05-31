import { useEffect, useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";

import useAuth from "@/hooks/useAuth";
import Spinner from "@/components/ui/spinner";
import { ENDPOINTS } from "@/api/endpoints";

const ProtectedRoute = () => {
    const { isAuthenticated, isInitializing, restoreSession } = useAuth();
    const hasChecked = useRef(false);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;
        void restoreSession();
    }, [restoreSession]);

    if (isInitializing) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to={ENDPOINTS.auth.login} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;