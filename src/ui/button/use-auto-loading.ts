'use client';

import { useState, useCallback } from 'react';

/** 加载动画最小显示时长 */
export const MIN_LOADING_DURATION_MS = 400;

export function runWithMinLoadingDuration(
  setLoading: (loading: boolean) => void,
  action: () => void | Promise<unknown>,
  minMs: number = MIN_LOADING_DURATION_MS,
): void {
  setLoading(true);
  const start = Date.now();
  let released = false;

  const release = () => {
    if (released) return;
    released = true;
    const elapsed = Date.now() - start;
    const remaining = Math.max(0, minMs - elapsed);
    if (remaining === 0) {
      setLoading(false);
    } else {
      setTimeout(() => { setLoading(false); }, remaining);
    }
  };

  try {
    const result = action();
    if (result && typeof result.then === 'function') {
      void result.finally(release);
    } else {
      release();
    }
  } catch (err) {
    release();
    throw err;
  }
}

export function useAutoLoading(
  loading: boolean | undefined,
  autoLoading: boolean,
  disabled: boolean | undefined,
  onClick: React.MouseEventHandler<HTMLButtonElement> | undefined,
) {
  const [internalLoading, setInternalLoading] = useState(false);
  const isControlled = loading !== undefined;
  const isLoading = isControlled ? loading : internalLoading;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (isLoading || disabled) return;
      if (!autoLoading || isControlled) {
        onClick?.(e);
        return;
      }
      runWithMinLoadingDuration(setInternalLoading, () => onClick?.(e));
    },
    [isLoading, disabled, autoLoading, isControlled, onClick],
  );

  return { isLoading, handleClick, showLoading: loading || (autoLoading && internalLoading) };
}
