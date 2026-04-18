/**
 * 工作区聊天 API
 * POST /api/workspaces/[id]/chat - 发送聊天消息到 AI 模型
 */

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import {
  successResponse,
  errorResponse,
  handleError,
} from '@/lib/api/response';
import { callProviderAPI } from '@/lib/providers/api-client';

/**
 * 聊天消息接口
 */
interface ChatMessage {
  role: string;
  content: string;
}

/**
 * 聊天请求体
 */
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

/**
 * POST /api/workspaces/[id]/chat - 发送聊天消息
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = (await request.json()) as ChatRequest;
    const { messages, model, providerId } = body;

    // 验证消息列表
    if (!Array.isArray(messages) || messages.length === 0) {
      return errorResponse('缺少消息列表', 'MISSING_MESSAGES', 400);
    }

    // 验证提供商配置
    if (!providerId) {
      return errorResponse(
        '未配置 AI 模型，请前往「API 提供商」页面配置提供商，然后在「模型管理」页面添加模型',
        'NO_PROVIDER_CONFIGURED',
        400,
      );
    }

    // 获取用户消息内容
    const userContent =
      messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    const inputTokens = estimateTokens(userContent);

    // 调用 AI 服务
    let content: string;
    let outputTokens: number;
    let totalTokens: number;

    try {
      const result = await callProviderAPI({
        providerId,
        messages,
        model,
        temperature: 0.7,
        maxTokens: 4096,
      });
      content = result.content;
      outputTokens = result.usage != null ? result.usage.tokens : estimateTokens(result.content);
      totalTokens = inputTokens + outputTokens;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'AI 服务调用失败，请稍后重试';
      return errorResponse(`AI 服务调用失败：${errorMessage}`, 'PROVIDER_CALL_FAILED', 502);
    }

    // 保存用户消息
    const chatMessage = await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'user',
        content: userContent,
        inputTokens,
        outputTokens: 0,
        totalTokens: inputTokens,
        model,
        providerId,
      },
    });

    // 保存助手消息
    await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'assistant',
        content,
        inputTokens,
        outputTokens,
        totalTokens,
        model,
        providerId,
        parentId: chatMessage.id,
      },
    });

    // 记录日志
    await prisma.workspaceLog.create({
      data: {
        workspaceId: id,
        type: 'chat_message',
        summary: `用户发送消息 (${model}, ${String(totalTokens)} tokens)`,
        status: 'success',
      },
    });

    return successResponse({
      content,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
      },
    });
  } catch (error) {
    return handleError(error, '聊天处理');
  }
}
