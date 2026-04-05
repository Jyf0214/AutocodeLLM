import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { prisma } from '@/lib/db/prisma';

/**
 * AES-256-CBC 加密
 */
function encryptValue(value: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC 解密
 */
function decryptValue(encrypted: string): string {
  const keyStr = process.env.ENCRYPTION_KEY ?? 'autocodellm-encryption-key-32b!';
  const key = Buffer.from(keyStr.padEnd(32).slice(0, 32));
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
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
  });

  if (!provider) {
    return null;
  }

  if (provider.authType === 'oauth') {
    return provider.oauthAccessToken
      ? decryptValue(provider.oauthAccessToken)
      : null;
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

  const config = buildRequestConfig({
    baseUrl: provider.baseUrl,
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
    temperature,
    maxTokens,
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

  const config = buildRequestConfig({
    baseUrl: provider.baseUrl,
    apiKey,
    sdkType: provider.sdkType,
    authType: provider.authType,
    oauthAccessToken: provider.oauthAccessToken
      ? decryptValue(provider.oauthAccessToken)
      : null,
  });

  const modelsUrl = provider.baseUrl.endsWith('/')
    ? `${provider.baseUrl}models`
    : `${provider.baseUrl}/models`;

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
    const config = buildRequestConfig({
      baseUrl: provider.baseUrl,
      apiKey,
      sdkType: provider.sdkType,
      authType: provider.authType,
      oauthAccessToken: provider.oauthAccessToken
        ? decryptValue(provider.oauthAccessToken)
        : null,
    });

    const modelsUrl = provider.baseUrl.endsWith('/')
      ? `${provider.baseUrl}models`
      : `${provider.baseUrl}/models`;

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
 * 构建请求头和 URL（根据 sdkType）
 */
function buildRequestConfig(provider: {
  baseUrl: string;
  apiKey: string;
  sdkType: string;
  authType: string;
  oauthAccessToken?: string | null;
}): { url: string; headers: Record<string, string>; body: Record<string, unknown> } {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  let url = provider.baseUrl;
  if (!url.endsWith('/')) {
    url += '/';
  }

  const effectiveKey = provider.oauthAccessToken ?? provider.apiKey;

  switch (provider.sdkType) {
    case 'anthropic':
      headers['x-api-key'] = effectiveKey;
      headers['anthropic-version'] = '2023-06-01';
      url += 'v1/messages';
      break;

    case 'google':
      url += 'v1beta/models/' + '{model}' + ':generateContent?key=' + effectiveKey;
      break;

    case 'azure':
      headers['api-key'] = effectiveKey;
      url += 'openai/deployments/{deploymentId}/chat/completions?api-version=2024-02-01';
      break;

    default:
      headers.Authorization = `Bearer ${effectiveKey}`;
      url += 'chat/completions';
      break;
  }

  return { url, headers, body: {} };
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
    return {
      content: text,
      usage: usage
        ? { tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0) }
        : undefined,
    };
  }

  if (sdkType === 'google') {
    const candidates = (data.candidates as Record<string, unknown>[] | undefined) ?? [];
    const first = candidates[0];
    const content = first?.content as Record<string, unknown> | undefined;
    const parts = (content?.parts as { text: string }[] | undefined) ?? [];
    const text = parts.map((p) => p.text).join('');
    const usageMetadata = data.usageMetadata as Record<string, number> | undefined;
    return {
      content: text,
      usage: usageMetadata
        ? { tokens: usageMetadata.totalTokenCount ?? 0 }
        : undefined,
    };
  }

  const choices = (data.choices as Record<string, unknown>[] | undefined) ?? [];
  const first = choices[0];
  const message = first?.message as Record<string, string> | undefined;
  const usage = data.usage as Record<string, number> | undefined;
  return {
    content: message?.content ?? '',
    usage: usage
      ? { tokens: usage.total_tokens ?? 0 }
      : undefined,
  };
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
      const provider = await prisma.provider.findFirst({
        where: {
          OR: [
            { oauthAccessToken: encryptValue(token) },
            { apiKey: encryptValue(token) },
          ],
        },
      });

      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (provider != null && provider.oauthRefreshToken != null && provider.oauthClientId != null) {
        const refreshed = await refreshOAuthToken(provider);
        if (refreshed) {
          const newHeaders = { ...(headers ?? {}) };
          if (headers?.Authorization) {
            newHeaders.Authorization = `Bearer ${refreshed}`;
          } else if (headers?.['x-api-key']) {
            newHeaders['x-api-key'] = refreshed;
          } else if (headers?.['api-key']) {
            newHeaders['api-key'] = refreshed;
          }
          return fetchWithRetry(url, { ...init, headers: newHeaders }, true);
        }
      }
    }
  }

  return response;
}

/**
 * 刷新 OAuth token
 */
async function refreshOAuthToken(provider: {
  id: string;
  oauthRefreshToken: string | null;
  oauthClientId: string | null;
}): Promise<string | null> {
  if (!provider.oauthRefreshToken || !provider.oauthClientId) {
    return null;
  }

  try {
    const refreshToken = decryptValue(provider.oauthRefreshToken);

    const response = await fetch('https://oauth.token.endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: provider.oauthClientId,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as Record<string, unknown>;
    const newAccessToken = data.access_token as string | undefined;
    const newRefreshToken = data.refresh_token as string | undefined;
    const expiresIn = data.expires_in as number | undefined;

    if (!newAccessToken) {
      return null;
    }

    const expiresAt = expiresIn
      ? new Date(Date.now() + expiresIn * 1000)
      : new Date(Date.now() + 3600 * 1000);

    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        oauthAccessToken: encryptValue(newAccessToken),
        ...(newRefreshToken && { oauthRefreshToken: encryptValue(newRefreshToken) }),
        oauthExpiresAt: expiresAt,
      },
    });

    return newAccessToken;
  } catch {
    return null;
  }
}
