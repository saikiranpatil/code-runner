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
export default function mutate<Route extends ApiRoute<unknown, unknown>>(
  route: Route,
  options?: ApiCallOptions<Route>,
) {
  return (variables: Route["TBody"]) => {
    return callApi(route, { ...options, body: variables });
  };
}