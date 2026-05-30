/**
 * 认证配置模块
 * 统一管理和检查所有认证方式的启用状态
 */

export interface AuthMethods {
  local: boolean;
  github: boolean;
  githubApp: boolean;
}

export interface AuthConfig {
  availableMethods: AuthMethods;
  github?: {
    clientId: string;
    redirectUri: string;
  };
  githubApp?: {
    appId: string;
    clientId: string;
    redirectUri: string;
  };
}

/**
 * 获取认证配置
 * 检查所有认证方式的启用状态
 */
export function getAuthConfig(): AuthConfig {
  const methods: AuthMethods = {
    local: true, // 本地登录始终可用
    github: !!(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    githubApp: process.env.GITHUB_APP_ENABLED === 'true' &&
               !!(process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY),
  };

  const config: AuthConfig = {
    availableMethods: methods,
  };

  // GitHub OAuth 配置
  if (methods.github) {
    config.github = {
      clientId: process.env.GITHUB_CLIENT_ID!,
      // 修复: GitHub OAuth 启用时, redirectUri 应为必需配置
      redirectUri: process.env.GITHUB_REDIRECT_URI || (() => { throw new Error('GitHub OAuth 已启用但 GITHUB_REDIRECT_URI 未配置'); })(),
    };
  }

  // GitHub App 配置
  if (methods.githubApp) {
    config.githubApp = {
      appId: process.env.GITHUB_APP_ID!,
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      // 修复: GitHub App 启用时, redirectUri 应为必需配置
      redirectUri: process.env.GITHUB_APP_REDIRECT_URI || (() => { throw new Error('GitHub App 已启用但 GITHUB_APP_REDIRECT_URI 未配置'); })(),
    };
  }

  return config;
}
