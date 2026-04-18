import { useState, useCallback } from 'react';
import { message } from 'antd';
import { apiGet, apiPost, apiPut, apiDelete, type ApiResponse, type FetchOptions } from './fetchers';

export interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UseApiReturn<T> extends UseApiState<T> {
  get: (url: string, options?: FetchOptions) => Promise<ApiResponse<T>>;
  post: (url: string, body?: unknown, options?: FetchOptions) => Promise<ApiResponse<T>>;
  put: (url: string, body?: unknown, options?: FetchOptions) => Promise<ApiResponse<T>>;
  delete: (url: string, options?: FetchOptions) => Promise<ApiResponse<T>>;
  setData: (data: T | null) => void;
  clearError: () => void;
}

export function useApi<T = unknown>(initialData: T | null = null): UseApiReturn<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, defaultMessage: string) => {
    const errorMessage = err instanceof Error ? err.message : defaultMessage;
    setError(errorMessage);
    message.error(errorMessage);
    return { success: false, error: { message: errorMessage, code: 'UNKNOWN' } } as ApiResponse<T>;
  };

  const get = useCallback(
    async (url: string, options?: FetchOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiGet<T>(url, options);
        if (result.success && result.data !== undefined) {
          setData(result.data);
        } else if (!result.success) {
          const errorMsg = result.error?.message ?? '请求失败';
          setError(errorMsg);
          message.error(errorMsg);
        }
        return result;
      } catch (err) {
        return handleError(err, '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const post = useCallback(
    async (url: string, body?: unknown, options?: FetchOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiPost<T>(url, body, options);
        if (result.success && result.data !== undefined) {
          setData(result.data);
        } else if (!result.success) {
          const errorMsg = result.error?.message ?? '请求失败';
          setError(errorMsg);
          message.error(errorMsg);
        }
        return result;
      } catch (err) {
        return handleError(err, '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const put = useCallback(
    async (url: string, body?: unknown, options?: FetchOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiPut<T>(url, body, options);
        if (result.success && result.data !== undefined) {
          setData(result.data);
        } else if (!result.success) {
          const errorMsg = result.error?.message ?? '请求失败';
          setError(errorMsg);
          message.error(errorMsg);
        }
        return result;
      } catch (err) {
        return handleError(err, '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const del = useCallback(
    async (url: string, options?: FetchOptions) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiDelete<T>(url, options);
        if (result.success && result.data !== undefined) {
          setData(result.data);
        } else if (!result.success) {
          const errorMsg = result.error?.message ?? '请求失败';
          setError(errorMsg);
          message.error(errorMsg);
        }
        return result;
      } catch (err) {
        return handleError(err, '网络错误，请重试');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    data,
    loading,
    error,
    get,
    post,
    put,
    delete: del,
    setData,
    clearError,
  };
}