/**
 * GitHub App 集成
 * 支持插件扩展、仓库克隆、GitHub API 调用
 */
import { execSync } from 'node:child_process';
import { createHash, createPrivateKey, randomBytes, sign } from 'node:crypto';

// ============================================================
// GitHub App 配置
// ============================================================

export interface GitHubAppConfig {
  appId: string;
  privateKey: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string; // 可选: webhook 密钥, 未设置时跳过 webhook 验证
  installationId?: string;
}

export function getGitHubAppConfig(): GitHubAppConfig | null {
  const appId = process.env.GITHUB_APP_ID;
  const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
  const clientId = process.env.GITHUB_APP_CLIENT_ID;
  const clientSecret = process.env.GITHUB_APP_CLIENT_SECRET;
  const webhookSecret = process.env.GITHUB_APP_WEBHOOK_SECRET;

  if (!appId || !privateKey) return null;

  return {
    appId,
    privateKey,
    clientId: clientId || '',
    clientSecret: clientSecret || '',
    ...(webhookSecret ? { webhookSecret } : {}), // 修复: webhookSecret 为可选, 不提供时不设置默认空值
  };
}

// ============================================================
// Installation Token
// ============================================================

async function getInstallationToken(config: GitHubAppConfig): Promise<string> {
  // 使用 RS256 签名生成 JWT
  // 修复: 替换占位符 '.signature' 为真实 RSA 签名
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iat: now - 60,
    exp: now + 600,
    iss: config.appId,
  };

  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signingInput = `${headerB64}.${payloadB64}`;

  // 使用 Node.js crypto 内置库进行 RS256 签名，无需额外依赖
  const privateKey = createPrivateKey(config.privateKey);
  const signature = sign(null, Buffer.from(signingInput), privateKey);
  const signatureB64 = signature.toString('base64url');

  const jwt = `${signingInput}.${signatureB64}`;

  const installationId = config.installationId || process.env.GITHUB_APP_INSTALLATION_ID;
  if (!installationId) {
    throw new Error('缺少 GitHub App Installation ID');
  }

  const response = await fetch(
    `https://api.github.com/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${jwt}`,
        Accept: 'application/vnd.github+json',
      },
    },
  );

  const data = (await response.json()) as { token?: string; message?: string };
  if (!data.token) {
    throw new Error(`获取 Installation Token 失败: ${data.message}`);
  }

  return data.token;
}

// ============================================================
// 仓库克隆
// ============================================================

export interface CloneOptions {
  repo: string;        // owner/repo 格式
  targetDir: string;   // 目标目录
  branch?: string;     // 分支（默认 main）
  depth?: number;      // 克隆深度（默认 1）
  isPrivate?: boolean; // 是否为私有仓库
}

/**
 * 克隆 GitHub 仓库到指定目录
 * 私有仓库使用 GitHub App token 认证
 */
export async function cloneRepo(options: CloneOptions): Promise<{ success: boolean; error?: string }> {
  const { repo, targetDir, branch = 'main', depth = 1, isPrivate = false } = options;

  try {
    let cloneUrl: string;

    if (isPrivate) {
      const config = getGitHubAppConfig();
      if (!config) {
        return { success: false, error: 'GitHub App 未配置' };
      }
      const token = await getInstallationToken(config);
      cloneUrl = `https://x-access-token:${token}@github.com/${repo}.git`;
    } else {
      cloneUrl = `https://github.com/${repo}.git`;
    }

    const cmd = `git clone --depth ${depth} --branch ${branch} ${cloneUrl} ${targetDir}`;
    execSync(cmd, { stdio: 'pipe', timeout: 120_000 });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { success: false, error: message };
  }
}

// ============================================================
// 插件扩展框架
// ============================================================

export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  author: string;
  repo: string;           // GitHub 仓库
  entry: string;          // 入口文件
  permissions: string[];  // 所需权限
}

export interface Plugin {
  manifest: PluginManifest;
  installDir: string;
  enabled: boolean;
}

/**
 * 从 GitHub 仓库安装插件
 */
export async function installPlugin(repo: string, pluginsDir: string): Promise<Plugin | null> {
  try {
    const pluginName = repo.split('/').pop() || 'plugin';
    const installDir = `${pluginsDir}/${pluginName}`;

    // 克隆插件仓库
    const result = await cloneRepo({
      repo,
      targetDir: installDir,
      depth: 1,
    });

    if (!result.success) {
      console.error(`[GitHub App] 插件安装失败: ${result.error}`);
      return null;
    }

    // 读取 manifest
    const manifestPath = `${installDir}/plugin.json`;
    let manifest: PluginManifest;
    try {
      const fs = await import('node:fs/promises');
      const content = await fs.readFile(manifestPath, 'utf-8');
      manifest = JSON.parse(content) as PluginManifest;
    } catch {
      // 默认 manifest
      manifest = {
        name: pluginName,
        version: '0.1.0',
        description: `Plugin from ${repo}`,
        author: 'unknown',
        repo,
        entry: 'index.js',
        permissions: ['read'],
      };
    }

    return { manifest, installDir, enabled: true };
  } catch (err) {
    console.error(`[GitHub App] 插件安装异常:`, err);
    return null;
  }
}

// ============================================================
// Webhook 验证
// ============================================================

export function verifyGitHubWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = `sha256=${createHash('sha256').update(`${secret}${payload}`).digest('hex')}`;
  return signature === expected;
}

// ============================================================
// GitHub API 助手
// ============================================================

export async function githubApiRequest(
  path: string,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' = 'GET',
  body?: unknown,
): Promise<unknown> {
  const config = getGitHubAppConfig();
  if (!config) throw new Error('GitHub App 未配置');

  const token = await getInstallationToken(config);
  const response = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    ...((body ? { body: JSON.stringify(body) } : {}) as Record<string, string>),
  });

  return await response.json();
}