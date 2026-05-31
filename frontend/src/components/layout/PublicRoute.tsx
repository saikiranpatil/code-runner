import { Navigate, Outlet } from "react-router-dom";
import Spinner from "@/components/ui/spinner";
import { useAuthStore } from "@/module/auth/auth.store";

const PublicRoute = () => {
  const { isAuthenticated, status } = useAuthStore();

  if (status === "loading") return <Spinner />;
  if (isAuthenticated) return <Navigate to="/problem" replace />;
  return <Outlet />;
};

export default PublicRoute;