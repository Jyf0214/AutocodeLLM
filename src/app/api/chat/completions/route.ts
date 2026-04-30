import { NextResponse } from 'next/server';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  provider: string;
}

/**
 * POST /api/chat/completions - 发送聊天消息到 AI 模型
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const { messages, model, provider } = body;

    if (!model) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '缺少模型名称', code: 'MISSING_MODEL' },
        },
        { status: 400 }
      );
    }

    // 从数据库查询提供商信息
    const { prisma } = await import('@/lib/db/prisma');
    const providerConfig = await prisma.provider.findFirst({
      where: { name: provider || model, enabled: true },
    });

    if (!providerConfig) {
      return NextResponse.json(
        {
          success: false,
          error: { message: '未找到可用的提供商配置', code: 'PROVIDER_NOT_FOUND' },
        },
        { status: 404 }
      );
    }

    // 解密 API Key
    const { createDecipheriv, createHash } = await import('crypto');
    const keyStr = process.env.KEY_VAULTS_SECRET ?? 'your-key-vaults-secret-change-in-production';
    const key = createHash('sha256').update(keyStr).digest();

    let apiKey: string;
    try {
      const parts = providerConfig.apiKey.split(':');
      if (parts.length !== 2) {
        throw new Error('无效的加密格式');
      }
      const [ivHex, encryptedData] = parts;
      if (!ivHex || !encryptedData) {
        throw new Error('无效的加密格式');
      }
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = createDecipheriv('aes-256-cbc', key, iv);
      apiKey = decipher.update(encryptedData, 'hex', 'utf8');
      apiKey += decipher.final('utf8');
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'API Key 解密失败', code: 'DECRYPT_FAILED' },
        },
        { status: 500 }
      );
    }

    // 调用 OpenAI 兼容 API
    let baseUrl = providerConfig.baseUrl;
    // 确保 baseUrl 包含协议前缀
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    // 添加 /v1 后缀（如果还没有）
    if (!baseUrl.endsWith('/v1') && !baseUrl.endsWith('/v1/')) {
      baseUrl = baseUrl.endsWith('/') ? `${baseUrl}v1` : `${baseUrl}/v1`;
    }

    const apiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      return NextResponse.json(
        {
          success: false,
          error: { message: `API 请求失败: ${String(apiResponse.status)}`, details: errorText.substring(0, 200) },
          code: 'API_REQUEST_FAILED',
        },
        { status: apiResponse.status }
      );
    }

    const apiData = await apiResponse.json();
    const choice = apiData.choices?.[0];

    if (!choice?.message?.content) {
      return NextResponse.json(
        {
          success: false,
          error: { message: 'AI 回复为空或格式错误', code: 'EMPTY_RESPONSE' },
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: choice.message.content,
        usage: apiData.usage
          ? {
              inputTokens: apiData.usage.prompt_tokens,
              outputTokens: apiData.usage.completion_tokens,
              totalTokens: apiData.usage.total_tokens,
            }
          : undefined,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return NextResponse.json(
      {
        success: false,
        error: { message: errorMessage, code: 'INTERNAL_ERROR' },
      },
      { status: 500 }
    );
  }
}
