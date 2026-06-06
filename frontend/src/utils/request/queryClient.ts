import { QueryClient } from '@tanstack/react-query';

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

  // mutationCache: new MutationCache({
  //   onError: (error, _vars, _ctx, mutation) => {
  //     onError(error, mutation.meta as Record<string, unknown>);
  //   },
  // }),

  // queryCache: new QueryCache({
  //   onError: (error, query) => {
  //     onError(error, query.meta as Record<string, unknown>);
  //   },
  // }),
});

declare global {
  interface Window {
    __TANSTACK_QUERY_CLIENT__:
    import('@tanstack/query-core')
    .QueryClient
  }
}

window.__TANSTACK_QUERY_CLIENT__ = queryClient

export default queryClient;