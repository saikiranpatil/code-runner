// src/components/layout/PublicRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import useAuthStore from "@/store/authStore";
import Spinner from "@/components/ui/spinner";

const PublicRoute = () => {
  const { isAuthenticated, isInitializing } = useAuthStore();

  if (isInitializing) return <Spinner />;
  if (isAuthenticated) return <Navigate to="/problem" replace />;
  return <Outlet />;
};

export default PublicRoute;