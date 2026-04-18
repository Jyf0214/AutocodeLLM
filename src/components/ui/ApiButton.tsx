import { Button, ButtonProps } from 'antd';
import { useState, useCallback } from 'react';
import { showApiMessage, showApiMessage as message, handleAxiosError } from './ApiMessage';

export interface ApiButtonOptions<T = unknown> {
  api: () => Promise<{ data?: T; error?: { message?: string } }>;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  successMsg?: string;
  errorMsg?: string;
  loadingText?: string;
}

export interface ApiButtonProps extends Omit<ButtonProps, 'onClick' | 'loading'> {
  api: () => Promise<unknown>;
  onSuccessMsg?: string;
  onErrorMsg?: string;
  loadingText?: string;
  onSuccess?: (data?: unknown) => void;
  onError?: (error: Error) => void;
}

export const ApiButton = ({
  api,
  onSuccessMsg,
  onErrorMsg,
  loadingText,
  onSuccess,
  onError,
  disabled,
  children,
  ...props
}: ApiButtonProps) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api();
      if (result.error) {
        const msg = result.error.message || onErrorMsg || '操作失败';
        message.error(msg);
        onError?.(new Error(msg));
      } else {
        if (onSuccessMsg && result.data) {
          message.success(onSuccessMsg);
        }
        onSuccess?.(result.data);
      }
    } catch (err) {
      const msg = handleAxiosError(err, onErrorMsg || '操作失败');
      message.error(msg);
      onError?.(new Error(msg));
    } finally {
      setLoading(false);
    }
  }, [api, onSuccessMsg, onErrorMsg, onSuccess, onError]);

  return (
    <Button
      loading={loading}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {loadingText && loading ? loadingText : children}
    </Button>
  );
};

export const createApiButton = <T,>(options: ApiButtonOptions<T>) => {
  return (buttonProps: ButtonProps) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
      setLoading(true);
      try {
        const result = await options.api();
        if (result.error) {
          const msg = result.error.message || options.errorMsg || '操作失败';
          showApiMessage.error(msg);
          options.onError?.(new Error(msg));
        } else {
          if (options.successMsg && result.data) {
            showApiMessage.success(options.successMsg);
          }
          options.onSuccess?.(result.data!);
        }
      } catch (err) {
        const msg = handleAxiosError(err, options.errorMsg || '操作失败');
        showApiMessage.error(msg);
        options.onError?.(new Error(msg));
      } finally {
        setLoading(false);
      }
    };

    return (
      <Button loading={loading} disabled={buttonProps.disabled || loading} onClick={handleClick} {...buttonProps} />
    );
  };
};