import { Outlet } from "react-router-dom";
import { useAuthStore } from "@/store/auth.store";
import { Spinner } from "@/components/ui/spinner";

const PublicRoute = () => {
  const { status } = useAuthStore();

  if (status === "idle" || status === "loading") return <Spinner fullScreen size="lg" />;
  return <Outlet />;
};

export default PublicRoute;