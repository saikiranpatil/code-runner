import { QueryClient, MutationCache, QueryCache } from '@tanstack/react-query';
import { parseApiError } from '@/utils/errorHandler';
import { toast } from 'sonner';

/**
 * Global error handler for queries and mutations.
 *
 * Components that set `meta.silent = true` on their useMutation / useQuery
 * opt out of the global toast so they can show their own inline error UI.
 */
const onError = (error: unknown, meta?: Record<string, unknown>) => {
  if (meta?.silent) return;
  try {
    const { message } = parseApiError(error);
    toast.error(message);
  } catch {
    // parseApiError re-throws real Errors so ErrorBoundary catches them.
    // If it did throw, the ErrorBoundary handles it — nothing to do here.
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 2;
      },
      staleTime: 30_000,
    },
  },

  mutationCache: new MutationCache({
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