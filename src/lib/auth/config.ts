/**
 * 认证配置模块
 * 统一管理和检查所有认证方式的启用状态
 */

export interface AuthMethods {
  local: boolean;
  github: boolean;
  githubApp: boolean;
  clerk: boolean;
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
  clerk?: {
    publishableKey: string;
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
    clerk: process.env.CLERK_ENABLED === 'true' && 
           !!(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY),
  };

  const config: AuthConfig = {
    availableMethods: methods,
  };

  // GitHub OAuth 配置
  if (methods.github) {
    config.github = {
      clientId: process.env.GITHUB_CLIENT_ID!,
      redirectUri: process.env.GITHUB_REDIRECT_URI || '',
    };
  }

  // GitHub App 配置
  if (methods.githubApp) {
    config.githubApp = {
      appId: process.env.GITHUB_APP_ID!,
      clientId: process.env.GITHUB_APP_CLIENT_ID!,
      redirectUri: process.env.GITHUB_APP_REDIRECT_URI || '',
    };
  }

  // Clerk 配置
  if (methods.clerk) {
    config.clerk = {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    };
  }

  return config;
}
