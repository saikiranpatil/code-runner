import { QueryClient, MutationCache, QueryCache } from "@tanstack/react-query";
import { parseApiError } from "@/utils/errorHandler";
import { toast } from "sonner";

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) => {
      mutation.meta;
      const { message } = parseApiError(error);
      if (message) toast.error(message);
    },
    onSuccess: (_data, _variables, _context, mutation) => {
      if (mutation.meta?.successMessage) {
        toast.success(mutation.meta.successMessage as string);
      }
    },
  }),
  queryCache: new QueryCache({
    onError: (error) => {
      const { message } = parseApiError(error);
      toast.error(message || "Failed to fetch data");
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        const { statusCode } = parseApiError(error);
        if (statusCode >= 400 && statusCode < 500) return false;
        return failureCount < 2;
      },
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});

export default queryClient;