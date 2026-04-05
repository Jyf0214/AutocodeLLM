import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

interface ChatMessage {
  role: string;
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model: string;
}

function callAgentCluster(messages: ChatMessage[], _model: string): string {
  const lastUserMessage = messages.filter((m) => m.role === 'user').pop();

  if (!lastUserMessage) {
    return '您好！有什么可以帮助您的吗？';
  }

  const content = lastUserMessage.content.toLowerCase();

  const agentResponses: { condition: (text: string) => boolean; response: string }[] = [
    {
      condition: (text) => /代码|code|编程|program|函数|function/.test(text),
      response: `我来帮您分析这个编码问题。

基于您提到的需求，我建议以下实现方案：

\`\`\`typescript
// 示例代码结构
function solve(input: string): string {
  // 1. 参数验证
  if (!input) throw new Error('输入不能为空');
  
  // 2. 核心逻辑处理
  const result = processInput(input);
  
  // 3. 返回结果
  return result;
}
\`\`\`

**关键要点：**
- 使用 TypeScript 确保类型安全
- 添加完善的错误处理
- 遵循单一职责原则

需要我进一步展开哪个部分？`,
    },
    {
      condition: (text) => /文件|file|读取|read|写入|write/.test(text),
      response: `我来帮您处理文件操作。

当前工作区支持以下文件操作：

| 操作 | 说明 |
|------|------|
| 读取文件 | 查看文件内容和结构 |
| 编辑文件 | 修改指定行或内容 |
| 创建文件 | 新建文件并写入内容 |
| 删除文件 | 移除不需要的文件 |

请告诉我您想对哪个文件进行什么操作？`,
    },
    {
      condition: (text) => /搜索|search|查找|find|web/.test(text),
      response: `我来帮您搜索相关信息。

搜索功能支持：
- **网页搜索**：从互联网获取最新信息
- **代码搜索**：在项目中查找相关代码
- **文档搜索**：检索技术文档和 API 参考

请提供更具体的搜索关键词，我会为您找到最相关的结果。`,
    },
    {
      condition: (text) => /你好|hello|hi|hey|帮助|help/.test(text),
      response: `您好！我是 AutocodeLLM AI 助手，可以帮您完成以下任务：

- 💻 **编码辅助**：编写、审查、优化代码
- 📁 **文件操作**：读取、编辑、创建文件
- 🔍 **信息搜索**：网页搜索、代码检索
- 🤖 **任务代理**：自动化复杂工作流程
- 📊 **数据分析**：处理和分析数据集

请告诉我您需要什么帮助？`,
    },
  ];

  for (const agent of agentResponses) {
    if (agent.condition(content)) {
      return agent.response;
    }
  }

  return `收到您的消息："${lastUserMessage.content}"

我已经分析了您的需求，以下是我的回复：

这是一个通用的 AI 编码助手响应。为了给您提供更精准的帮助，请提供更多上下文信息，例如：

1. 您使用的编程语言和框架
2. 具体的功能需求或问题描述
3. 任何相关的代码片段或错误信息

我会根据您的具体需求给出针对性的解决方案。`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = (await request.json()) as ChatRequest;
    const { messages, model } = body;

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

    const content = callAgentCluster(messages, model);

    await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'user',
        content: messages.filter((m) => m.role === 'user').pop()?.content ?? '',
      },
    });

    await prisma.chatMessage.create({
      data: {
        workspaceId: id,
        role: 'assistant',
        content,
      },
    });

    await prisma.workspaceLog.create({
      data: {
        workspaceId: id,
        type: 'chat_message',
        summary: '用户发送消息 (' + model + ')',
        status: 'success',
      },
    });

    return NextResponse.json({
      success: true,
      data: { content },
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
