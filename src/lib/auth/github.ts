/**
 * GitHub OAuth 认证模块
 * 支持通过 GitHub 账号登录/注册
 */
import { createHash } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';
const GITHUB_REDIRECT_URI = process.env.GITHUB_REDIRECT_URI || '';

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
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: GITHUB_REDIRECT_URI,
    scope: 'read:user user:email',
    ...(state && { state }),
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

/**
 * 用 authorization code 换取 access token
 */
export async function getGitHubAccessToken(code: string): Promise<string> {
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
}> {
  // 查找是否已绑定 GitHub 账号
  const existing = await prisma.user.findFirst({
    where: { username: `github_${githubUser.id}` },
  });

  if (existing) {
    return {
      userId: existing.id,
      username: existing.username,
      role: existing.role || 'user',
      isNewUser: false,
    };
  }

  // 创建新用户
  const randomPassword = createHash('sha256')
    .update(`${githubUser.id}-${Date.now()}`)
    .digest('hex');

  const newUser = await prisma.user.create({
    data: {
      username: `github_${githubUser.id}`,
      passwordHash: randomPassword,
      role: 'user',
      forceChangePassword: false,
      isInitialPassword: false,
    },
  });

  return {
    userId: newUser.id,
    username: newUser.username,
    role: newUser.role || 'user',
    isNewUser: true,
  };
}