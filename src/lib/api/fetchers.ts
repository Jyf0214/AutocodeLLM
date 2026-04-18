export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
  };
}

export interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const { params, ...fetchOptions } = options;

  let finalUrl = url;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, String(value));
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      finalUrl = `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
    }
  }

  const response = await fetch(finalUrl, {
    ...fetchOptions,
    credentials: 'include',
  });

  return response.json();
}

export async function apiGet<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'GET' });
}

export async function apiPost<T = unknown>(
  url: string,
  body?: unknown,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function apiPut<T = unknown>(
  url: string,
  body?: unknown,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, {
    ...options,
    method: 'PUT',
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
}

export async function apiDelete<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiFetch<T>(url, { ...options, method: 'DELETE' });
}