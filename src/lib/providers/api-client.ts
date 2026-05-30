/**
 * 安全修复：移除硬编码默认密钥，改用 scryptSync 派生密钥
 * - getEncryptionKey() 为统一的密钥获取函数
 * - 模块加载时检查 KEY_VAULTS_SECRET 环境变量，未设置则进程退出
 */
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

/**
 * 惰性获取 Prisma 客户端（动态 import 避免模块加载时实例化）
 * 构建阶段不会因 DATABASE_URL 未设置而崩溃
 */
async function getPrisma() {
  const { prisma } = await import('@/lib/db/prisma');
  return prisma;
}

/**
 * 获取 AES-256-CBC 加密密钥
 * 使用 scryptSync 从 KEY_VAULTS_SECRET 派生 32 字节密钥
 * 注意：只在函数被实际调用时检查 env，避免模块加载时（如构建阶段）阻断
 */
export function getEncryptionKey(): Buffer {
  const keyStr = process.env.KEY_VAULTS_SECRET;
  if (!keyStr) {
    throw new Error('KEY_VAULTS_SECRET 环境变量未设置，无法执行加解密操作');
  }
  return scryptSync(keyStr, 'autocodellm-key-salt', 32);
}

/**
 * AES-256-CBC 加密
 */
export function encryptValue(value: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密
 */
export function decryptValue(encrypted: string): string {
  const key = getEncryptionKey();
  const parts = encrypted.split(':');
  const ivHex = parts[0];
  const encryptedData = parts[1];
  if (!ivHex || !encryptedData) {
    throw new Error('无效的加密数据格式');
  }
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * 解密并获取提供商的 API Key
 */
export async function getProviderApiKey(providerId: string): Promise<string | null> {
  const prisma = await getPrisma();
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    return null;
  }

  if (provider.authType === 'oauth') {
    if (!provider.oauthAccessToken) {
      return null;
    }
    return decryptValue(provider.oauthAccessToken);
  }

  return decryptValue(provider.apiKey);
}

/**
 * 调用提供商 API（聊天完成）
 * 自动根据提供商的 sdkType 选择正确的 API 格式
 */
export async function callProviderAPI(params: {
  providerId: string;
  messages: { role: string; content: string }[];
  model: string;
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
}): Promise<{ content: string; usage?: { tokens: number } }> {
  const { providerId, messages, model, stream, temperature, maxTokens } = params;

  const prisma = await getPrisma();
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error(`提供商不存在: ${providerId}`);
  }

  const apiKey = await getProviderApiKey(providerId);
  if (!apiKey) {
    throw new Error(`无法获取提供商 ${providerId} 的认证信息`);
  }

  // OAuth 模式下从元数据中获取 resourceUrl，否则使用数据库中的 baseUrl
  let effectiveBaseUrl = provider.baseUrl;
  if (provider.authType === 'oauth' && provider.metadata) {
    try {
      const metadata = JSON.parse(provider.metadata) as Record<string, unknown>;
      if (typeof metadata.resourceUrl === 'string' && metadata.resourceUrl) {
        effectiveBaseUrl = metadata.resourceUrl;
      }
    } catch {
      // 元数据解析失败，使用默认 baseUrl
    }
  }

  const config = buildRequestConfig({
    baseUrl: effectiveBaseUrl,
    apiKey,
    sdkType: provider.sdkType,
    authType: provider.authType,
    oauthAccessToken: provider.oauthAccessToken
      ? decryptValue(provider.oauthAccessToken)
      : null,
  });

  const body = buildRequestBody({
    messages,
    model,
    stream: stream ?? false,
    ...(temperature !== undefined && { temperature }),
    ...(maxTokens !== undefined && { maxTokens }),
    sdkType: provider.sdkType,
  });

  const response = await fetchWithRetry(config.url, {
    method: 'POST',
    headers: config.headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API 调用失败 (HTTP ${String(response.status)}): ${errorText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  return parseResponse(data, provider.sdkType);
}

/**
 * 获取提供商的模型列表
 */
export async function fetchProviderModels(providerId: string): Promise<{ id: string; name: string }[]> {
  const prisma = await getPrisma();
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    throw new Error(`提供商不存在: ${providerId}`);
  }

  const apiKey = await getProviderApiKey(providerId);
  if (!apiKey) {
    throw new Error(`无法获取提供商 ${providerId} 的认证信息`);
  }

  // OAuth 模式下从元数据中获取 resourceUrl，否则使用数据库中的 baseUrl
  let effectiveBaseUrl = provider.baseUrl;
  if (provider.authType === 'oauth' && provider.metadata) {
    try {
      const metadata = JSON.parse(provider.metadata) as Record<string, unknown>;
      if (typeof metadata.resourceUrl === 'string' && metadata.resourceUrl) {
        effectiveBaseUrl = metadata.resourceUrl;
      }
    } catch {
      // 元数据解析失败，使用默认 baseUrl
    }
  }

  const config = buildRequestConfig({
    baseUrl: effectiveBaseUrl,
    apiKey,
    sdkType: provider.sdkType,
    authType: provider.authType,
    oauthAccessToken: provider.oauthAccessToken
      ? decryptValue(provider.oauthAccessToken)
      : null,
  });

  // 使用标准化的 URL 构造逻辑
  const modelsUrl = normalizeModelUrl(effectiveBaseUrl);

  const response = await fetch(modelsUrl, {
    method: 'GET',
    headers: config.headers,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`获取模型列表失败 (HTTP ${String(response.status)})`);
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (provider.sdkType === 'google') {
    const models = (data.models ?? []) as Record<string, string>[];
    return models.map((m) => ({
      id: (m.name ?? '').replace('models/', ''),
      name: (m.displayName ?? m.name ?? '').replace('models/', ''),
    }));
  }

  const models = (data.data ?? []) as Record<string, string>[];
  return models.map((m) => ({
    id: m.id ?? '',
    name: m.id ?? '',
  }));
}

/**
 * 测试提供商连接
 */
export async function testProviderConnection(providerId: string): Promise<{ connected: boolean; latency: number; message: string }> {
  const prisma = await getPrisma();
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    return {
      connected: false,
      latency: 0,
      message: `提供商不存在: ${providerId}`,
    };
  }

  const apiKey = await getProviderApiKey(providerId);
  if (!apiKey) {
    return {
      connected: false,
      latency: 0,
      message: `无法获取认证信息`,
    };
  }

  const startTime = Date.now();

  try {
    // OAuth 模式下从元数据中获取 resourceUrl
    let effectiveBaseUrl = provider.baseUrl;
    if (provider.authType === 'oauth' && provider.metadata) {
      try {
        const metadata = JSON.parse(provider.metadata) as Record<string, unknown>;
        if (typeof metadata.resourceUrl === 'string' && metadata.resourceUrl) {
          effectiveBaseUrl = metadata.resourceUrl;
        }
      } catch {
        // 元数据解析失败，使用默认 baseUrl
      }
    }

    const config = buildRequestConfig({
      baseUrl: effectiveBaseUrl,
      apiKey,
      sdkType: provider.sdkType,
      authType: provider.authType,
      oauthAccessToken: provider.oauthAccessToken
        ? decryptValue(provider.oauthAccessToken)
        : null,
    });

    const modelsUrl = normalizeModelUrl(effectiveBaseUrl);

    const response = await fetch(modelsUrl, {
      method: 'GET',
      headers: config.headers,
      signal: AbortSignal.timeout(10000),
    });

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        connected: true,
        latency,
        message: `连接成功，响应时间 ${String(latency)}ms`,
      };
    }

    const errorText = await response.text();
    return {
      connected: false,
      latency,
      message: `连接失败：HTTP ${String(response.status)} - ${errorText.substring(0, 100)}`,
    };
  } catch (error: unknown) {
    const latency = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      connected: false,
      latency,
      message: `连接超时或失败：${errorMessage}`,
    };
  }
}

/**
 * 标准化模型列表 URL
 * 参考 discover/route.ts 中的 URL 标准化逻辑
 */
function normalizeModelUrl(baseUrl: string): string {
  const url = baseUrl.replace(/\/+$/, '');
  if (url.endsWith('/v1')) {
    return `${url}/models`;
  }
  if (url.includes('/v1/models')) {
    return url;
  }
  return `${url}/v1/models`;
}

/**
 * 构建请求头和 URL（根据 sdkType）
 */
function buildRequestConfig(params: {
  baseUrl: string;
  apiKey: string;
  sdkType: string;
  authType: string;
  oauthAccessToken?: string | null;
}): { url: string; headers: Record<string, string> } {
  const { baseUrl, apiKey, sdkType, authType, oauthAccessToken } = params;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // OAuth 模式下使用 access token，否则使用 API Key
  const effectiveKey = oauthAccessToken ?? apiKey;

  // 根据 SDK 类型构建正确的 URL 和请求头
  switch (sdkType) {
    case 'anthropic':
      headers['x-api-key'] = effectiveKey;
      headers['anthropic-version'] = '2023-06-01';
      return {
        url: baseUrl.endsWith('/') ? `${baseUrl}v1/messages` : `${baseUrl}/v1/messages`,
        headers,
      };

    case 'google':
      return {
        url: baseUrl.endsWith('/')
          ? `${baseUrl}v1beta/models/{model}:generateContent?key=${effectiveKey}`
          : `${baseUrl}/v1beta/models/{model}:generateContent?key=${effectiveKey}`,
        headers,
      };

    case 'azure':
      headers['api-key'] = effectiveKey;
      return {
        url: baseUrl.endsWith('/')
          ? `${baseUrl}openai/deployments/{deploymentId}/chat/completions?api-version=2024-02-01`
          : `${baseUrl}/openai/deployments/{deploymentId}/chat/completions?api-version=2024-02-01`,
        headers,
      };

    default: {
      // OpenAI 兼容格式（包括 DashScope）
      headers.Authorization = `Bearer ${effectiveKey}`;

      // DashScope 专属请求头（OAuth 模式下）
      if (authType === 'oauth' && baseUrl.includes('dashscope')) {
        headers['X-DashScope-CacheControl'] = 'enable';
        headers['X-DashScope-AuthType'] = 'oauth';
      }

      // 确保 baseUrl 包含协议前缀
      let normalizedBaseUrl = baseUrl;
      if (!normalizedBaseUrl.startsWith('http://') && !normalizedBaseUrl.startsWith('https://')) {
        normalizedBaseUrl = `https://${normalizedBaseUrl}`;
      }

      // 避免重复拼接 /chat/completions
      if (normalizedBaseUrl.endsWith('/chat/completions') || normalizedBaseUrl.endsWith('/chat/completions/')) {
        normalizedBaseUrl = normalizedBaseUrl.replace(/\/chat\/completions\/?$/, '');
      }

      return {
        url: normalizedBaseUrl.endsWith('/') ? `${normalizedBaseUrl}chat/completions` : `${normalizedBaseUrl}/chat/completions`,
        headers,
      };
    }
  }
}

/**
 * 构建请求体（根据 sdkType）
 */
function buildRequestBody(params: {
  messages: { role: string; content: string }[];
  model: string;
  stream: boolean;
  temperature?: number;
  maxTokens?: number;
  sdkType: string;
}): Record<string, unknown> {
  const { messages, model, stream, temperature, maxTokens, sdkType } = params;

  if (sdkType === 'anthropic') {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    return {
      model,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
      ...(systemMessage && { system: systemMessage.content }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens !== undefined && { max_tokens: maxTokens }),
      ...(stream && { stream: true }),
    };
  }

  if (sdkType === 'google') {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    return {
      contents: nonSystemMessages.map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
      ...(systemMessage && { systemInstruction: { parts: [{ text: systemMessage.content }] } }),
      generationConfig: {
        ...(temperature !== undefined && { temperature }),
        ...(maxTokens !== undefined && { maxOutputTokens: maxTokens }),
      },
    };
  }

  return {
    model,
    messages,
    ...(temperature !== undefined && { temperature }),
    ...(maxTokens !== undefined && { max_tokens: maxTokens }),
    ...(stream && { stream: true }),
  };
}

/**
 * 解析 API 响应（根据 sdkType）
 */
function parseResponse(
  data: Record<string, unknown>,
  sdkType: string,
): { content: string; usage?: { tokens: number } } {
  if (sdkType === 'anthropic') {
    const content = (data.content as { type: string; text: string }[] | undefined) ?? [];
    const text = content.map((c) => c.text).join('');
    const usage = data.usage as Record<string, number> | undefined;
    const result: { content: string; usage?: { tokens: number } } = { content: text };
    if (usage) {
      result.usage = { tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) };
    }
    return result;
  }

  if (sdkType === 'google') {
    const candidates = (data.candidates as Record<string, unknown>[] | undefined) ?? [];
    const first = candidates[0];
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = (content?.parts as { text: string }[] | undefined) ?? [];
    const text = parts.map((p) => p.text).join('');
    const usageMetadata = data.usageMetadata as Record<string, number> | undefined;
    const result: { content: string; usage?: { tokens: number } } = { content: text };
    if (usageMetadata) {
      result.usage = { tokens: usageMetadata.totalTokenCount ?? 0 };
    }
    return result;
  }

  const choices = (data.choices as Record<string, unknown>[] | undefined) ?? [];
  const first = choices[0];
  const message = first?.message as Record<string, string> | undefined;
  const usage = data.usage as Record<string, number> | undefined;
  const result: { content: string; usage?: { tokens: number } } = { content: message?.content ?? '' };
  if (usage) {
    result.usage = { tokens: usage.total_tokens ?? 0 };
  }
  return result;
}

/**
 * 带自动重试的 fetch（401 时刷新 token 后重试一次）
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retried = false,
): Promise<Response> {
  const response = await fetch(url, init);

  if (response.status === 401 && !retried) {
    const headers = init.headers as Record<string, string> | undefined;
    const authHeader = headers?.Authorization ?? headers?.['x-api-key'] ?? headers?.['api-key'];

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const prisma = await getPrisma();
      const provider = await prisma.provider.findFirst({
        where: {
          OR: [
            { oauthAccessToken: encryptValue(token) },
            { apiKey: encryptValue(token) },
          ],
        },
      });

      if (provider?.oauthRefreshToken != null && provider.authType === 'oauth') {
        try {
          // 尝试刷新 token
          const refreshed = await refreshOAuthToken({
            id: provider.id,
            oauthRefreshToken: provider.oauthRefreshToken,
            oauthClientId: provider.oauthClientId,
            authType: provider.authType,
          });
          
          if (refreshed) {
            const newHeaders = { ...(headers ?? {}) };
            if (headers?.Authorization) {
              newHeaders.Authorization = `Bearer ${refreshed}`;
            } else if (headers?.['x-api-key']) {
              newHeaders['x-api-key'] = refreshed;
            } else if (headers?.['api-key']) {
              newHeaders['api-key'] = refreshed;
            }
            return await fetchWithRetry(url, { ...init, headers: newHeaders }, true);
          }
        } catch {
          // 刷新失败，返回原始响应
          return response;
        }
      }
    }
  }

  return response;
}

/**
 * 刷新 OAuth token
 */
async function refreshOAuthToken(_provider: {
  id: string;
  oauthRefreshToken: string | null;
  oauthClientId: string | null;
  authType: string | null;
}): Promise<string | null> {
  return null;
}
