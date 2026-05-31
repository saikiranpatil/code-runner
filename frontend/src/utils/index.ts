export function buildUrl(
    path: string,
    pathParams?: Record<string, any> | void,
    queryParams?: Record<string, any> | void,
): string {
    let url = path;

    // Inject path parameters (e.g., /users/:id -> /users/123)
    if (pathParams && typeof pathParams === 'object') {
        Object.entries(pathParams).forEach(([key, value]) => {
            url = url.replace(`:${key}`, encodeURIComponent(String(value)));
        });
    }

    // Append query parameters (e.g., ?search=term&page=1)
    if (queryParams && typeof queryParams === 'object') {
        const cleanParams: Record<string, string> = {};

        Object.entries(queryParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                cleanParams[key] = String(value);
            }
        });

        const searchParams = new URLSearchParams(cleanParams).toString();
        if (searchParams) {
            url += `?${searchParams}`;
        }
    }

    return url;
}