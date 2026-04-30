'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export interface UseDebounceFnOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  options: UseDebounceFnOptions = {}
): T {
  const { delay = 300, leading = false, trailing = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leadingRef = useRef(true);

  const debouncedFn = useCallback(
    (...args: unknown[]) => {
      if (leading && leadingRef.current) {
        leadingRef.current = false;
        fn(...args);
        return;
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (trailing) {
          fn(...args);
        }
        leadingRef.current = true;
      }, delay);
    },
    [fn, delay, leading, trailing]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedFn;
}

export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdateRef = useRef<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastUpdateRef.current >= interval) {
      lastUpdateRef.current = now;
      setThrottledValue(value);
      return;
    } else {
      const timer = setTimeout(() => {
        lastUpdateRef.current = Date.now();
        setThrottledValue(value);
      }, interval - (now - lastUpdateRef.current));

      return () => clearTimeout(timer);
    }
  }, [value, interval]);

  return throttledValue;
}