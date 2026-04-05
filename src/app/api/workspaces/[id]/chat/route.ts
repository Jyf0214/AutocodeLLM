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

/**
 * 回退的模拟响应（无提供商时）
 */
function getFallbackResponse(messages: ChatMessage[]): string {
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  if (!lastUserMessage) {
    return '您好！有什么可以帮助您的吗？';
  }

  const content = lastUserMessage.content.toLowerCase();

  const agentResponses: { condition: (text: string) => boolean; response: string }[] = [
    {
      condition: (text) => /代码|code|编程|program|函数|function/.test(text),
      response: `我来帮您分析这个编码问题。\n\n基于您提到的需求，我建议以下实现方案：\n\n\`\`\`typescript\n// 示例代码结构\nfunction solve(input: string): string {\n  // 1. 参数验证\n  if (!input) throw new Error('输入不能为空');\n  \n  // 2. 核心逻辑处理\n  const result = processInput(input);\n  \n  // 3. 返回结果\n  return result;\n}\n\`\`\`\n\n**关键要点：**\n- 使用 TypeScript 确保类型安全\n- 添加完善的错误处理\n- 遵循单一职责原则\n\n需要我进一步展开哪个部分？`,
    },
    {
      condition: (text) => /文件|file|读取|read|写入|write/.test(text),
      response: `我来帮您处理文件操作。\n\n当前工作区支持以下文件操作：\n\n| 操作 | 说明 |\n|------|------|\n| 读取文件 | 查看文件内容和结构 |\n| 编辑文件 | 修改指定行或内容 |\n| 创建文件 | 新建文件并写入内容 |\n| 删除文件 | 移除不需要的文件 |\n\n请告诉我您想对哪个文件进行什么操作？`,
    },
    {
      condition: (text) => /搜索|search|查找|find|web/.test(text),
      response: `我来帮您搜索相关信息。\n\n搜索功能支持：\n- **网页搜索**：从互联网获取最新信息\n- **代码搜索**：在项目中查找相关代码\n- **文档搜索**：检索技术文档和 API 参考\n\n请提供更具体的搜索关键词，我会为您找到最相关的结果。`,
    },
    {
      condition: (text) => /你好|hello|hi|hey|帮助|help/.test(text),
      response: `您好！我是 AutocodeLLM AI 助手，可以帮您完成以下任务：\n\n- 💻 **编码辅助**：编写、审查、优化代码\n- 📁 **文件操作**：读取、编辑、创建文件\n- 🔍 **信息搜索**：网页搜索、代码检索\n- 🤖 **任务代理**：自动化复杂工作流程\n- 📊 **数据分析**：处理和分析数据集\n\n请告诉我您需要什么帮助？`,
    },
  ];

  for (const agent of agentResponses) {
    if (agent.condition(content)) {
      return agent.response;
    }
  }

  return `收到您的消息："${lastUserMessage.content}"\n\n我已经分析了您的需求。请提供更多上下文信息，例如使用的编程语言、具体功能需求或相关代码片段，我会给出针对性的解决方案。`;
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

    const userContent = messages.filter((m) => m.role === 'user').pop()?.content ?? '';
    const inputTokens = estimateTokens(userContent);

    let content: string;
    let outputTokens: number;
    let totalTokens: number;
    let usedProvider = false;

    if (providerId) {
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
        usedProvider = true;
      } catch {
        content = getFallbackResponse(messages);
        outputTokens = estimateTokens(content);
        totalTokens = inputTokens + outputTokens;
        usedProvider = false;
      }
    } else {
      content = getFallbackResponse(messages);
      outputTokens = estimateTokens(content);
      totalTokens = inputTokens + outputTokens;
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
        providerId: usedProvider && providerId ? providerId : null,
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
        providerId: usedProvider && providerId ? providerId : null,
        parentId: chatMessage.id,
      },
    });

    await prisma.workspaceLog.create({
      data: {
        workspaceId: id,
        type: 'chat_message',
        summary: '用户发送消息 (' + (usedProvider ? model : 'fallback') + ', ' + String(totalTokens) + ' tokens)',
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
        usedProvider,
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
