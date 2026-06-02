import api from '@/api/axios';
import { buildUrl } from '@/utils';
import { HTTPError, type ApiRoute, type ApiCallOptions } from './types';

export async function callApi<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
): Promise<Route["TRes"]> {
  const url = buildUrl(
    route.path,
    options?.pathParams as Record<string, any> | undefined,
    options?.queryParams as Record<string, any> | undefined,
  );

  try {
    const response = await api.request<Route["TRes"]>({
      method: route.method,
      url,
      data: options?.body,
      signal: options?.signal,
    });

    return response.data;
  } catch (error: any) {
    const isSilent =
      typeof options?.silent === 'boolean' ? options.silent : false;

    throw new HTTPError({
      message: error.message ?? 'Request Failed',
      status: error.response?.status ?? 0,
      silent: isSilent,
      cause: error.response?.data,
    });
  }
}

/**
 * Creates a TanStack Query compatible query function.
 *
 * Example:
 * ```tsx
 * const { data } = useQuery({
 *   queryKey: ['job', jobId],
 *   queryFn: query(JobRoutes.getJob, { pathParams: { jobId } }),
 * });
 * ```
 */
export default function query<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  return ({ signal }: { signal: AbortSignal }) => {
    return callApi(route, { ...options, signal });
  };
}