export type QueryParamValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean | null | undefined>;

export type QueryParams = Record<string, QueryParamValue>;

type ExtractRouteParams<T extends string> =
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
  ? Param | ExtractRouteParams<Rest>
  : T extends `${infer _Start}:${infer Param}`
  ? Param
  : never;

export type PathParams<T extends string> = {
  [K in ExtractRouteParams<T>]: string;
};

export interface ApiRoute<TData, TBody = unknown> {
  path: string;
  method: HttpMethod;
  TRes: TData;
  TBody?: TBody;
  noAuth?: boolean;
  defaultQueryParams?: QueryParams;
}

export interface ApiCallOptions<Route extends ApiRoute<unknown, unknown>> {
  pathParams?: PathParams<Route["path"]>;
  queryParams?: QueryParams;
  body?: Route["TBody"];
  silent?: boolean | ((response: Response) => boolean);
  signal?: AbortSignal;
}

export class HTTPError extends Error {
  status: number;
  silent: boolean;
  cause?: Record<string, unknown>;

  constructor({
    message,
    status,
    silent,
    cause,
  }: {
    message: string;
    status: number;
    silent: boolean;
    cause?: Record<string, unknown>;
  }) {
    super(message, { cause });
    this.status = status;
    this.silent = silent;
    this.cause = cause;
  }
}

/**
 * A fake function that returns an empty object casted to type T
 * @returns Empty object as type T
 */
export function Type<T>(): T {
  return {} as T;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export function defineRoute<TRes, TBody = void>(
  config: Omit<ApiRoute<TRes, TBody>, 'TRes' | 'TBody'> & {
    TRes?: TRes;
    TBody?: TBody;
  }
): ApiRoute<TRes, TBody> {
  return config as ApiRoute<TRes, TBody>;
}