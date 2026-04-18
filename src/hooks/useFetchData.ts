'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

export interface UseFetchOptions<T> {
  immediate?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseFetchReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  execute: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const { immediate = true, onSuccess, onError } = options;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetcher();
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, execute, setData };
}

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginationState {
  page: number;
  pageSize: number;
}

export interface UsePaginationReturn {
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  resetPagination: () => void;
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const { defaultPage = 1, defaultPageSize = 10 } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: defaultPage,
    pageSize: defaultPageSize,
  });

  const setPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize }));
  }, []);

  const resetPagination = useCallback(() => {
    setPagination({ page: defaultPage, pageSize: defaultPageSize });
  }, [defaultPage, defaultPageSize]);

  return { pagination, setPage, setPageSize, resetPagination };
}

export interface UseSearchOptions<T> {
  defaultSearch?: string;
  debounceMs?: number;
  onSearch?: (value: string) => void;
}

export interface UseSearchReturn<T> {
  search: string;
  setSearch: (value: string) => void;
  debouncedSearch: string;
}

export function useSearch<T>(options: UseSearchOptions<T> = {}): UseSearchReturn<T> {
  const { defaultSearch = '', debounceMs = 300, onSearch } = options;
  const [search, setSearchState] = useState(defaultSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(defaultSearch);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setSearch = useCallback(
    (value: string) => {
      setSearchState(value);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setDebouncedSearch(value);
        onSearch?.(value);
      }, debounceMs);
    },
    [debounceMs, onSearch]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { search, setSearch, debouncedSearch };
}