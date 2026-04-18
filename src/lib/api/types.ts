/**
 * 认证与账户 API 类型定义
 */

/**
 * 登录响应
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

/**
 * 修改密码响应
 */
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

/**
 * 用户信息
 */
export interface UserInfo {
  id: string;
  username: string;
  forceChangePassword: boolean;
  isInitialPassword: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * 账户响应
 */
export interface AccountResponse {
  success: boolean;
  data?: UserInfo;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * 更新账户请求
 */
export interface UpdateAccountRequest {
  oldPassword?: string;
  newPassword?: string;
  forceChangePassword?: boolean;
  isInitialPassword?: boolean;
}

/**
 * 验证码请求
 */
export interface VerificationCodeRequest {
  username: string;
}

/**
 * 验证码响应
 */
export interface VerificationCodeResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: {
    message: string;
    code: string;
  };
}
