/**
 * GitHub OAuth 认证模块
 * 支持通过 GitHub 账号登录/注册
 */
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import { isGitHubAppEnabled, getGitHubAppConfig } from './github-app-config';

// 修复: 不提供默认空值回退, 使用前会检查并抛出明确错误
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI;

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

/**
 * 生成 GitHub OAuth 授权 URL
 */
export function getGitHubAuthUrl(state?: string): string {
  // 修复: 检查必需配置, 避免使用缺少的关键参数生成授权 URL
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID 未配置');
  }
  if (!GITHUB_REDIRECT_URI) {
    throw new Error('GITHUB_REDIRECT_URI 未配置');
  }
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
    ...(state && { state }),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * 生成 GitHub App 授权 URL
 * GitHub App 使用安装流程，需要特殊处理
 */
export function getGitHubAppAuthUrl(state?: string): string {
  const config = getGitHubAppConfig();
  if (!config) {
    throw new Error('GitHub App 未配置');
  }

  // GitHub App 的安装授权 URL
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: 'read:user user:email',
    ...(state && { state }),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * 用 authorization code 换取 access token (普通 OAuth)
 */
export async function getGitHubAccessToken(code: string): Promise<string> {
  // 修复: 检查必需配置, 避免使用空密钥发送请求
  if (!GITHUB_CLIENT_ID) {
    throw new Error('GITHUB_CLIENT_ID 未配置');
  }
  if (!GITHUB_CLIENT_SECRET) {
    throw new Error('GITHUB_CLIENT_SECRET 未配置');
  }
  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error || '获取 access token 失败');
  }
  return data.access_token;
}

/**
 * 用 authorization code 换取 access token (GitHub App)
 */
export async function getGitHubAppAccessToken(code: string): Promise<string> {
  const config = getGitHubAppConfig();
  if (!config) {
    throw new Error('GitHub App 未配置');
  }

  const response = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  const data = (await response.json()) as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error || '获取 GitHub App access token 失败');
  }
  return data.access_token;
}

/**
 * 获取 GitHub 用户信息
 */
export async function getGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`获取 GitHub 用户信息失败: ${response.status}`);
  }

  return (await response.json()) as GitHubUser;
}

/**
 * GitHub OAuth 登录/注册
 * 如果用户不存在则自动创建
 */
export async function loginWithGitHub(githubUser: GitHubUser): Promise<{
  userId: string;
  username: string;
  role: string;
  isNewUser: boolean;
  needsBinding?: boolean;
  githubId?: string;
}> {
  // 查找是否已绑定 GitHub 账号（通过 githubId 字段）
  const existingByGithubId = await prisma.user.findFirst({
    where: { githubId: String(githubUser.id) },
  });

  if (existingByGithubId) {
    return {
      userId: existingByGithubId.id,
      username: existingByGithubId.username,
      role: existingByGithubId.role || 'user',
      isNewUser: false,
    };
  }

  // 查找是否已存在使用 github_{id} 命名的用户（兼容旧逻辑）
  const existing = await prisma.user.findFirst({
    where: { username: `github_${githubUser.id}` },
  });

  if (existing) {
    // 更新该用户的 githubId
    await prisma.user.update({
      where: { id: existing.id },
      data: { githubId: String(githubUser.id) },
    });

    return {
      userId: existing.id,
      username: existing.username,
      role: existing.role || 'user',
      isNewUser: false,
    };
  }

  // 用户不存在，返回需要绑定状态
  // 不自动创建用户，而是要求用户绑定到已有账户
  return {
    userId: '',
    username: '',
    role: 'user',
    isNewUser: false,
    needsBinding: true,
    githubId: String(githubUser.id),
  };
}

/**
 * GitHub App 登录
 * 重要：不自动创建新账户，必须绑定已有账户
 * 返回需要绑定的状态或登录成功
 */
export async function loginWithGitHubApp(githubUser: GitHubUser): Promise<{
  needBinding: boolean;
  userId?: string;
  username?: string;
  role?: string;
  githubUserId?: number;
  githubUsername?: string;
}> {
  // 查找是否已绑定 GitHub 账号
  const existing = await prisma.user.findFirst({
    where: { username: `github_${githubUser.id}` },
  });

  if (existing) {
    // 已绑定，直接登录
    return {
      needBinding: false,
      userId: existing.id,
      username: existing.username,
      role: existing.role || 'user',
    };
  }

  // 未绑定，需要绑定已有账户
  return {
    needBinding: true,
    githubUserId: githubUser.id,
    githubUsername: githubUser.login,
  };
}