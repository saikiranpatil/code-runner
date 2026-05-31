import api from "@/api/axios";
import type { ApiRoute } from "./types";
import { buildUrl } from "@/utils";

interface MutateOptions<TPathParams, TQueryParams> {
  pathParams?: TPathParams;
  queryParams?: TQueryParams;
  silent?: boolean;
}

export function mutate<
  TResponse,
  TBody,
  TPathParams extends Record<string, any> | void = void,
  TQueryParams extends Record<string, any> | void = void,
>(
  route: ApiRoute<TResponse, TBody, TPathParams, TQueryParams>,
  options?: MutateOptions<TPathParams, TQueryParams>,
) {
  return async (body: TBody): Promise<TResponse> => {
    const url = buildUrl(route.path, options?.pathParams, options?.queryParams);

    const res = await api.request<TResponse>({
      url,
      method: route.method,
      headers: { "Content-Type": "application/json" },
      data: body,
    });

    return res.data;
  };
}