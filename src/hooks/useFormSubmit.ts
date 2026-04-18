'use client';

import { useState, useCallback } from 'react';
import { message } from 'antd';

export interface UseFormSubmitOptions<T> {
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
  successMsg?: string;
  errorMsg?: string;
  showSuccessMsg?: boolean;
  showErrorMsg?: boolean;
}

export interface UseFormSubmitReturn<T> {
  loading: boolean;
  submit: (values: T) => Promise<boolean>;
  setLoading: (loading: boolean) => void;
}

export function useFormSubmit<T>(
  submitFn: (values: T) => Promise<{ success: boolean; error?: { message: string }; data?: unknown }>,
  options: UseFormSubmitOptions<T> = {}
): UseFormSubmitReturn<T> {
  const {
    onSuccess,
    onError,
    successMsg = '操作成功',
    errorMsg = '操作失败',
    showSuccessMsg = true,
    showErrorMsg = true,
  } = options;

  const [loading, setLoadingState] = useState(false);

  const setLoading = useCallback((loading: boolean) => {
    setLoadingState(loading);
  }, []);

  const submit = useCallback(
    async (values: T): Promise<boolean> => {
      setLoadingState(true);
      try {
        const result = await submitFn(values);

        if (result.success) {
          if (showSuccessMsg) {
            message.success(successMsg);
          }
          onSuccess?.(result.data);
          return true;
        } else {
          const errorMessage = result.error?.message ?? errorMsg;
          if (showErrorMsg) {
            message.error(errorMessage);
          }
          const error = new Error(errorMessage);
          onError?.(error);
          return false;
        }
      } catch (err) {
        const errorMessage = errorMsg;
        if (showErrorMsg) {
          message.error(errorMessage);
        }
        const error = err instanceof Error ? err : new Error(String(err));
        onError?.(error);
        return false;
      } finally {
        setLoadingState(false);
      }
    },
    [submitFn, onSuccess, onError, successMsg, errorMsg, showSuccessMsg, showErrorMsg]
  );

  return { loading, submit, setLoading };
}