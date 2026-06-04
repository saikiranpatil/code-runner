import { Outlet } from "react-router-dom";
import Spinner from "@/components/ui/spinner";
import { useAuthStore } from "@/store/auth.store";

const PublicRoute = () => {
  const { status } = useAuthStore();

  if (status === "loading") return <Spinner />;
  return <Outlet />;
};

export default PublicRoute;