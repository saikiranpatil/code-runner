import api from '@/api/axios';
import { buildUrl } from '@/utils';
import { HTTPError, type ApiRoute, type ApiCallOptions } from './types';

export async function callApi<TRes, TBody>(
  route: ApiRoute<TRes, TBody>,
  options?: ApiCallOptions<ApiRoute<TRes, TBody>>,
): Promise<TRes> {
  const url = buildUrl(
    route.path,
    options?.pathParams as Record<string, any> | undefined,
    options?.queryParams as Record<string, any> | undefined,
  );

  try {
    const response = await api.request<TRes>({
      method: route.method,
      url,
      data: options?.body,
      signal: options?.signal,
    });

    return response.data;
  } catch (error: any) {
    const isSilent =
      typeof options?.silent === 'boolean' ? options.silent : false;

    const responseErrorMessage = error.response?.data?.message;

    throw new HTTPError({
      message: responseErrorMessage || error.message || 'Request Failed',
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
export default function query<TRes, TBody>(
  route: ApiRoute<TRes, TBody>,
  options?: ApiCallOptions<ApiRoute<TRes, TBody>>,
) {
  return ({ signal }: { signal: AbortSignal }) => {
    return callApi(route, { ...options, signal });
  };
}