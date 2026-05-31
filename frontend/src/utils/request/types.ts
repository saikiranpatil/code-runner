export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiRoute<
  TResponse = unknown,
  TBody = void,
  TPathParams = void,
  TQueryParams = void,
> {
  path: string;
  method: HttpMethod;
  _response?: TResponse;
  _body?: TBody;
  _pathParams?: TPathParams;
  _queryParams?: TQueryParams;
}