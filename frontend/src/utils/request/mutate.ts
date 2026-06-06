import { callApi } from './query';
import type { ApiRoute, ApiCallOptions } from './types';

/**
 * Creates a TanStack Query compatible mutation function.
 *
 * Example:
 * ```tsx
 * const { mutate: createJob } = useMutation({
 *   mutationFn: mutate(JobRoutes.createJob, { pathParams: { orgId } }),
 * });
 * ```
 */
export default function mutate<TRes, TBody>(
  route: ApiRoute<TRes, TBody>,
  options?: ApiCallOptions<ApiRoute<TRes, TBody>>,
) {
  return (variables: TBody) => {
    return callApi(route, { ...options, body: variables });
  };
}