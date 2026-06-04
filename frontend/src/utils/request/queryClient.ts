import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { parseApiError } from '@/utils/errorHandler';
import { toast } from 'sonner';

const onError = (error: unknown, meta?: Record<string, unknown>) => {
  // Gracefully handles both silent flags embedded within HTTPError wrappers or custom React Query metadata
  if (meta?.silent === true || (error as any)?.silent === true) return;

  const { message } = parseApiError(error);
  toast.error(message);
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        const status = error?.status || error?.response?.status;
        if (status >= 400 && status < 500) {
          return false; // Stop repeating invalid client-side actions
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },

  mutationCache: new MutationCache({
    onSuccess: (data: any, _vars, _ctx, mutation) => {
      if (mutation.meta?.silent) return;
      // Captures the formatting declared within ResponseTransformInterceptor
      if (data?.success && data?.message && data.message !== 'OK') {
        toast.success(data.message);
      }
    },
    onError: (error, _vars, _ctx, mutation) => {
      onError(error, mutation.meta as Record<string, unknown>);
    },
  }),

  queryCache: new QueryCache({
    onError: (error, query) => {
      onError(error, query.meta as Record<string, unknown>);
    },
  }),
});

export default queryClient;