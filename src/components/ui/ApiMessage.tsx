import { message } from 'antd';
import type { AxiosError } from 'axios';

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: {
    message?: string;
  };
}

export interface ApiMessageOptions {
  successMsg?: string;
  errorMsg?: string;
  duration?: number;
}

export const showApiMessage = {
  success: (content: string, duration = 3) => {
    message.success({ content, duration });
  },

  error: (content: string, duration = 4) => {
    message.error({ content, duration });
  },

  info: (content: string, duration = 3) => {
    message.info({ content, duration });
  },

  warning: (content: string, duration = 4) => {
    message.warning({ content, duration });
  },
};

export const handleApiResponse = <T,>(
  result: { data?: T; error?: { message?: string } },
  options: ApiMessageOptions
): { data?: T; error?: Error } => {
  if (result.error) {
    const msg = result.error.message || options.errorMsg || '操作失败';
    showApiMessage.error(msg);
    return { error: new Error(msg) };
  }

  if (options.successMsg && result.data) {
    showApiMessage.success(options.successMsg);
  }

  return { data: result.data };
};

export const handleAxiosError = (
  error: unknown,
  fallbackMsg = '网络错误，请重试'
): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.data
      ? (axiosError.response.data as { message?: string }).message || fallbackMsg
      : fallbackMsg;
  }
  return fallbackMsg;
};

export const handleApiError = (
  error: unknown,
  options: ApiMessageOptions
): Error => {
  const msg = handleAxiosError(error, options.errorMsg || '操作失败');
  showApiMessage.error(msg);
  return new Error(msg);
};