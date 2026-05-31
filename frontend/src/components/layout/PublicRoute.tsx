import { useEffect, useRef } from "react";
import { Outlet } from "react-router-dom";
import useAuth from "@/hooks/useAuth";
import Spinner from "@/components/ui/spinner";

const PublicRoute = () => {
    const { isInitializing, restoreSession } = useAuth();
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

    return <Outlet />;
};

export default PublicRoute;