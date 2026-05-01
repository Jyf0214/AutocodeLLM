/**
 * GitHub App 配置模块
 * 管理 GitHub App 的认证和配置
 */
import { createAppAuth } from '@octokit/auth-app';

export function isGitHubAppEnabled(): boolean {
  return process.env.GITHUB_APP_ENABLED === 'true' &&
         !!process.env.GITHUB_APP_ID &&
         !!process.env.GITHUB_APP_PRIVATE_KEY;
}

export function getGitHubAppConfig() {
  if (!isGitHubAppEnabled()) return null;

  return {
    appId: process.env.GITHUB_APP_ID!,
    privateKey: process.env.GITHUB_APP_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    clientId: process.env.GITHUB_APP_CLIENT_ID!,
    clientSecret: process.env.GITHUB_APP_CLIENT_SECRET!,
    webhookSecret: process.env.GITHUB_APP_WEBHOOK_SECRET!,
    installationId: process.env.GITHUB_APP_INSTALLATION_ID!,
    redirectUri: process.env.GITHUB_APP_REDIRECT_URI!,
  };
}

export function createGitHubAppAuth() {
  const config = getGitHubAppConfig();
  if (!config) return null;

  return createAppAuth({
    appId: config.appId,
    privateKey: config.privateKey,
    clientId: config.clientId,
    clientSecret: config.clientSecret,
  });
}
