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

/**
 * 默认请求超时时间（毫秒）
 */
const DEFAULT_TIMEOUT_MS = 30_000;

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(finalUrl, {
      ...fetchOptions,
      signal: controller.signal,
      credentials: 'include',
    });

    clearTimeout(timeoutId);
    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('请求超时');
    }
    throw error;
  }
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