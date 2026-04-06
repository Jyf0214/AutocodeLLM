import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { callProviderAPI } from '@/lib/providers/api-client';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
  providerId?: string;
}

/**
 * 估算文本的 token 数量（粗略估算）
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ChatRequest;
    const { messages, model, providerId } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '缺少消息列表',
            code: 'MISSING_MESSAGES',
          },
        },
        { status: 400 }
      );
    }

    if (!providerId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: '未配置 AI 模型，请前往「API 提供商」页面配置提供商，然后在「模型管理」页面添加模型',
            code: 'NO_PROVIDER_CONFIGURED',
          },
        },
        { status: 400 }
      );
    }

    const userContent = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    const inputTokens = estimateTokens(userContent);

    let content: string;
    let outputTokens: number;
    let totalTokens: number;

    try {
      const result = await callProviderAPI({
        providerId,
        messages,
        model: model,
        temperature: 0.7,
        maxTokens: 4096,
      });

      content = result.content;
      outputTokens = result.usage != null ? result.usage.tokens : estimateTokens(result.content);
      totalTokens = inputTokens + outputTokens;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试';
      return NextResponse.json(
        {
          success: false,
          error: {
            message: `AI 服务调用失败：${errorMessage}`,
            code: 'PROVIDER_CALL_FAILED',
          },
        },
        { status: 502 }
      );
    }

    const chatMessage = await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'user',
        content: userContent,
        inputTokens,
        outputTokens: 0,
        totalTokens: inputTokens,
        model: model,
        providerId,
      },
    });

    await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'assistant',
        content,
        inputTokens,
        outputTokens,
        totalTokens,
        model: model,
        providerId,
        parentId: chatMessage.id,
      },
    });

    await prisma.workspaceLog.create({
      data: {
        workspaceId: id,
        type: 'chat_message',
        summary: `用户发送消息 (${model}, ${String(totalTokens)} tokens)`,
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        content,
        usage: {
          inputTokens,
          outputTokens,
          totalTokens,
        },
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: '聊天处理失败',
          code: 'CHAT_FAILED',
        },
      },
      { status: 500 }
    );
  }
}
