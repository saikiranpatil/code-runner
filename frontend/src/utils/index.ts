/**
 * Builds a full URL by interpolating path params and appending query params.
 */
export function buildUrl(
  path: string,
  pathParams?: Record<string, any> | void,
  queryParams?: Record<string, any> | void,
): string {
  let url = path;

  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  if (queryParams) {
    const entries = Object.entries(queryParams).filter(
      ([, v]) => v !== undefined && v !== null,
    );
    if (entries.length > 0) {
      const qs = new URLSearchParams(
        entries.map(([k, v]) => [k, String(v)]),
      ).toString();
      url = `${url}?${qs}`;
    }
  }

  return url;
}