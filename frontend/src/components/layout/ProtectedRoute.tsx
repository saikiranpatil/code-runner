import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import Spinner from "@/components/ui/spinner";
import { URLs } from "@/shared/urls";

const ProtectedRoute = () => {
    const { isAuthenticated, isInitializing } = useAuthStore();

    if (isInitializing) return <Spinner />;
    if (!isAuthenticated) return <Navigate to={URLs.auth.login} replace />;
    return <Outlet />;
};

export default ProtectedRoute;