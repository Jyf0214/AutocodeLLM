'use client';

import { useState, useCallback, useEffect } from 'react';
import { message } from 'antd';

export interface UseFetchDataOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  errorMsg?: string;
}

export interface UseFetchDataReturn<T> {
  data: T | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useFetchData<T>(
  apiPath: string,
  options: UseFetchDataOptions<T> = {}
): UseFetchDataReturn<T> {
  const { immediate = true, onSuccess, onError, errorMsg = '请求失败' } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiPath);
      const result = await res.json();
      if (result.success) {
        setData(result.data);
        onSuccess?.(result.data);
      } else {
        message.error(result.error?.message ?? errorMsg);
        onError?.(new Error(result.error?.message ?? errorMsg));
      }
    } catch (err) {
      message.error(errorMsg);
      onError?.(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [apiPath, errorMsg, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      refresh();
    }
  }, [immediate, refresh]);

  return { data, loading, refresh, setData };
}