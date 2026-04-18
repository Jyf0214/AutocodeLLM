import { useState, useEffect, useCallback } from 'react';
import { message } from 'antd';
import { apiGet, type ApiResponse, type FetchOptions } from './fetchers';

export interface UseFetchOptions<T> extends Omit<FetchOptions, 'method'> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  defaultData?: T | null;
}

export interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: () => Promise<ApiResponse<T> | null>;
  refresh: () => Promise<void>;
  setData: (data: T | null) => void;
}

export function useFetch<T = unknown>(url: string, options: UseFetchOptions<T> = {}): UseFetchReturn<T> {
  const {
    immediate = true,
    onSuccess,
    onError,
    defaultData = null,
    ...fetchOptions
  } = options;

  const [data, setData] = useState<T | null>(defaultData);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<T>(url, fetchOptions);
      if (result.success && result.data !== undefined) {
        setData(result.data);
        onSuccess?.(result.data);
        return result;
      } else {
        const errorMsg = result.error?.message ?? '请求失败';
        setError(errorMsg);
        onError?.(errorMsg);
        message.error(errorMsg);
        return result;
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : '网络错误，请重试';
      setError(errorMsg);
      onError?.(errorMsg);
      message.error(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [url, fetchOptions, onSuccess, onError]);

  const refresh = useCallback(async () => {
    await execute();
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]);

  return {
    data,
    loading,
    error,
    execute,
    refresh,
    setData,
  };
}

export function useListFetch<T = unknown>(
  url: string,
  options: UseFetchOptions<T[]> = {}
): UseFetchReturn<T[]> & { setList: (list: T[]) => void } {
  const fetchReturn = useFetch<T[]>(url, options);

  const setList = useCallback((list: T[]) => {
    fetchReturn.setData(list as T);
  }, [fetchReturn]);

  return {
    ...fetchReturn,
    setList,
  };
}