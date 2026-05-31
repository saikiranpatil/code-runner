import api from "@/api/axios";
import { buildUrl } from "..";
import type { ApiRoute } from "./types";

interface QueryOptions<TPathParams, TQueryParams> {
  pathParams?: TPathParams;
  queryParams?: TQueryParams;
  silent?: boolean;
}

export function query<
  TResponse,
  TPathParams extends Record<string, any> | void = void,
  TQueryParams extends Record<string, any> | void = void,
>(
  route: ApiRoute<TResponse, void, TPathParams, TQueryParams>,
  options?: QueryOptions<TPathParams, TQueryParams>,
) {
  return async (): Promise<TResponse> => {
    const url = buildUrl(route.path, options?.pathParams, options?.queryParams);
    
    // Axios automatically handles GET requests and parses JSON responses
    const res = await api.get<TResponse>(url, {
      headers: { "Content-Type": "application/json" }
    });

    return res.data;
  };
}
