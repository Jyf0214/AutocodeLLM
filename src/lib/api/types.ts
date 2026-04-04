/**
 * API 类型定义
 */

export interface LoginResponse {
  success: boolean;
  data?: {
    userId: string;
    username: string;
    forceChangePassword: boolean;
  };
  error?: {
    message: string;
    code: string;
  };
}

export interface ChangePasswordResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
