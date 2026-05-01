# 聊天系统模块化设计文档

**日期**: 2026-04-11  
**作者**: Jyf0214  
**状态**: 实施中  

---

## 一、背景与目标

### 1.1 现状问题

当前 `src/app/workplace/` 模块存在严重架构问题：

1. **双重聊天实现**: `[id]/page.tsx`（简易版）和 `conversation/`（完整版276个文件）功能重叠但互不通信
2. **状态管理混乱**: 三层不同策略（useState / Zustand slices / 全局store）
3. **Conversation未启用**: 完整的LobeChat移植聊天引擎未被任何页面使用
4. **缺失API路由**: PUT `/api/projects/[id]` 被调用但不存在
5. **代码重复严重**: 模型选择器、错误处理、API调用到处复制

### 1.2 设计目标

构建**全新的、模块化清晰的原生多Agent聊天系统**：

- ✅ 废弃旧的conversation子系统
- ✅ 统一的Zustand状态管理
- ✅ 原生支持多Agent协作（Group/Supervisor/SubAgent）
- ✅ 清晰的模块边界和职责
- ✅ 可测试、可维护、可扩展

---

## 二、架构设计

### 2.1 目录结构

```
src/app/chat/                          # 全新聊天模块
├── page.tsx                           # 聊天列表页
└── [项目Id]/
    ├── page.tsx                       # 统一聊天页面（入口）
    ├── components/                    # 页面级组件
    │   ├── ChatHeader.tsx             # 顶部栏（返回、标题、模型选择）
    │   ├── ChatLayout.tsx             # 布局容器（header/messages/input）
    │   └── ModelSelector.tsx          # 模型选择器（可复用）
    ├── modules/                       # 功能模块（职责清晰）
    │   ├── MessageList/               # 消息列表模块
    │   │   ├── index.tsx              # 主组件
    │   │   ├── MessageItem.tsx        # 单条消息
    │   │   ├── VirtualScroller.tsx    # 虚拟滚动
    │   │   └── AutoScrollButton.tsx   # 回到底部
    │   ├── ChatInput/                 # 输入模块
    │   │   ├── index.tsx              # 主组件
    │   │   ├── TextArea.tsx           # 文本输入
    │   │   ├── ToolBar.tsx            # 工具栏（附件、模型选择）
    │   │   └── SendButton.tsx         # 发送按钮
    │   ├── AgentPanel/                # Agent面板（多Agent可视化）
    │   │   ├── index.tsx              # 主面板
    │   │   ├── AgentCard.tsx          # 单个Agent卡片
    │   │   ├── GroupOrchestrator.tsx  # 编排器可视化
    │   │   └── SupervisorView.tsx     # 监督者视图
    │   └── 项目Info/             # 项目信息
    │       └── index.tsx
    ├── store/                         # Zustand Store（统一状态）
    │   ├── index.ts                   # Store创建+导出
    │   ├── types.ts                   # 类型定义
    │   ├── initialState.ts            # 初始状态
    │   └── slices/                    # 功能切片
    │       ├── chat/                  # 聊天核心
    │       │   ├── slice.ts
    │       ├── messages/              # 消息管理
    │       │   ├── slice.ts
    │       ├── agent/                 # Agent调度
    │       │   ├── slice.ts
    │       ├── input/                 # 输入状态
    │       │   ├── slice.ts
    │       └── ui/                    # UI状态
    │           ├── slice.ts
    └── hooks/                         # 业务Hooks
        ├── useSendMessage.ts          # 发送消息
        ├── useAgentExecution.ts       # Agent执行
        └── useModelSelector.ts        # 模型选择
```

### 2.2 架构分层

```
┌─────────────────────────────────────────┐
│         页面层 (page.tsx)                │
│   - 路由参数解析                          │
│   - 权限验证                              │
│   - Provider包装                          │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       组件层 (components/)               │
│   - ChatLayout: 三栏布局                  │
│   - ChatHeader: 导航+模型选择             │
│   - ModelSelector: 下拉选择器             │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       模块层 (modules/)                  │
│   ┌──────────┬──────────┬──────────┐    │
│   │MessageLst│ ChatInput│AgentPanel│    │
│   │          │          │          │    │
│   │- 虚拟列表│- 输入框   │- Agent卡 │    │
│   │- 消息项   │- 工具栏   │- 编排器  │    │
│   │- 自动滚动│- 发送按钮 │- 监督者  │    │
│   └──────────┴──────────┴──────────┘    │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│      Store层 (store/)                    │
│   ┌──────┬────────┬──────┬──────┬────┐  │
│   │chat  │messages│agent │input │ ui │  │
│   │slice │slice   │slice │slice │slice│ │
│   └──────┴────────┴──────┴──────┴────┘  │
│                    ↓                      │
│   ┌─────────────────────────────┐        │
│   │  Agent Executors (复用)     │        │
│   │  - createAgentExecutors     │        │
│   │  - GroupOrchestration       │        │
│   │  - StreamingHandler         │        │
│   └─────────────────────────────┘        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       API层 (Route Handlers)             │
│   - GET/PUT /api/projects/[id]        │
│   - POST /api/chats/[项目Id]       │
│   - Agent Runtime API                   │
└─────────────────────────────────────────┘
```

---

## 三、状态管理设计

### 3.1 全局State接口

```typescript
interface ChatStoreState {
  // === 聊天核心 ===
  项目Id: string;
  项目: 项目Info | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: ChatError | null;
  
  // === Agent状态 ===
  agents: {
    activeAgents: AgentInstance[];
    supervisorState?: SupervisorState;
    groupOrchestration?: GroupOrchestrationState;
    currentOperationId?: string;
    status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  };
  
  // === 模型配置 ===
  models: {
    selected: ModelConfig | null;
    available: ModelConfig[];
    loading: boolean;
  };
  
  // === 输入状态 ===
  input: {
    value: string;
    isSending: boolean;
    attachments: FileAttachment[];
  };
  
  // === UI状态 ===
  ui: {
    showAgentPanel: boolean;
    scrollToBottom: boolean;
    loadingMessages: boolean;
    errorDialog: ErrorDialogState | null;
  };
}
```

### 3.2 Slice职责划分

#### chatSlice - 聊天核心
```typescript
interface ChatSlice {
  // Actions
  initializeChat: (项目Id: string) => Promise<void>;
  load项目: () => Promise<void>;
  clearChat: () => void;
  
  // State
  项目Id: string;
  项目: 项目Info | null;
  isLoading: boolean;
  error: ChatError | null;
}
```

#### messagesSlice - 消息管理
```typescript
interface MessagesSlice {
  // Actions
  addMessage: (message: ChatMessage) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  optimisticUpdate: (id: string, updates: Partial<ChatMessage>) => void;
  batchUpdateMessages: (updates: MessageUpdate[]) => void;
  
  // State
  messages: ChatMessage[];
  messageMap: Map<string, ChatMessage>; // ID索引
}
```

#### agentSlice - Agent调度
```typescript
interface AgentSlice {
  // Actions
  runSingleAgent: (params: RunAgentParams) => Promise<void>;
  runGroupOrchestration: (params: GroupParams) => Promise<void>;
  cancelAgentExecution: () => void;
  updateAgentStatus: (status: AgentStatus) => void;
  handleAgentResult: (operationId: string, result: AgentResult) => void;
  
  // State
  activeAgents: AgentInstance[];
  currentOperationId?: string;
  status: AgentStatus;
}
```

#### inputSlice - 输入状态
```typescript
interface InputSlice {
  // Actions
  setInputValue: (value: string) => void;
  clearInput: () => void;
  setSending: (isSending: boolean) => void;
  addAttachment: (file: FileAttachment) => void;
  removeAttachment: (id: string) => void;
  
  // State
  value: string;
  isSending: boolean;
  attachments: FileAttachment[];
}
```

#### uiSlice - UI状态
```typescript
interface UISlice {
  // Actions
  toggleAgentPanel: (show?: boolean) => void;
  setScrollToBottom: (scroll: boolean) => void;
  setLoadingMessages: (loading: boolean) => void;
  showErrorDialog: (error: ErrorDialogState) => void;
  hideErrorDialog: () => void;
  
  // State
  showAgentPanel: boolean;
  scrollToBottom: boolean;
  loadingMessages: boolean;
  errorDialog: ErrorDialogState | null;
}
```

---

## 四、Agent集成方案

### 4.1 复用现有组件

从现有代码库复用的核心组件：

| 组件 | 来源 | 用途 |
|------|------|------|
| `createAgentExecutors` | `src/store/chat/agents/createAgentExecutors.ts` | 创建Agent执行器 |
| `StreamingHandler` | `src/store/chat/agents/StreamingHandler.ts` | 处理流式输出 |
| `createGroupOrchestrationExecutors` | `src/store/chat/agents/GroupOrchestration/` | 多Agent编排 |
| Agent Runtime Types | `@lobechat/agent-runtime` | 类型定义 |

### 4.2 集成架构

```typescript
// 使用示例
const { runSingleAgent } = useChatStore();

// 1. 用户发送消息
const handleSend = async (content: string) => {
  // 2. 添加用户消息到store
  addMessage({ role: 'user', content });
  
  // 3. 启动Agent执行
  await runSingleAgent({
    message: content,
    model: selectedModel,
    项目Id,
  });
  
  // 4. Agent通过StreamingHandler流式返回结果
  // 5. 消息自动更新到store
};
```

### 4.3 多Agent协作

```typescript
// Group Orchestration 流程
1. Supervisor Agent 分析任务
2. Supervisor 决定调用哪些 Worker Agents
3. Worker Agents 并行执行
4. Supervisor 汇总结果并生成最终响应
5. 结果流式返回给用户
```

---

## 五、UI组件设计

### 5.1 ChatLayout 布局

```
┌─────────────────────────────────────┐
│         ChatHeader                   │
│  ← 返回 | 项目名称 | 模型选择 ▼    │
├─────────────────────────────────────┤
│                                     │
│         MessageList                  │
│  ┌─────────────────────────────┐   │
│  │  User Message (right)       │   │
│  │  Assistant Message (left)   │   │
│  │  Agent Council (if multi)   │   │
│  │  Loading Indicator          │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│         ChatInput                    │
│  ┌───────────────────────────┐     │
│  │  文本输入区域              │     │
│  ├───────────────────────────┤     │
│  │  📎 附件 | ✻ 模型 | 发送 ▶│     │
│  └───────────────────────────┘     │
└─────────────────────────────────────┘
```

### 5.2 AgentPanel 可视化

```
┌─────────────────────────────────┐
│  Agent Panel               [×]  │
├─────────────────────────────────┤
│                                 │
│  ┌─────────────────────────┐   │
│  │ 👑 Supervisor           │   │
│  │ Status: Analyzing...    │   │
│  │ Task: Code generation   │   │
│  └─────────────────────────┘   │
│           ↓                      │
│  ┌──────────┐  ┌──────────┐    │
│  │ 🔧Coder  │  │ 🔍Search │    │
│  │ Running  │  │ Done     │    │
│  └──────────┘  └──────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## 六、API路由设计

### 6.1 需要新增/修复的API

| 方法 | 路径 | 状态 | 说明 |
|------|------|------|------|
| GET | `/api/projects` | ✅ 存在 | 获取项目列表 |
| GET | `/api/projects/[id]` | ❌ 新增 | 获取单个项目 |
| POST | `/api/projects` | ✅ 存在 | 创建项目 |
| PUT | `/api/projects/[id]` | ❌ 新增 | 更新项目 |
| DELETE | `/api/projects/[id]` | ✅ 存在 | 删除项目 |
| POST | `/api/chats/[项目Id]` | ❌ 新增 | 发送聊天消息 |
| GET | `/api/chats/[项目Id]` | ❌ 新增 | 获取聊天历史 |
| DELETE | `/api/chats/[项目Id]/[msgId]` | ❌ 新增 | 删除消息 |

### 6.2 API响应格式

```typescript
// 成功响应
{
  success: true;
  data?: T;
  error?: never;
}

// 错误响应
{
  success: false;
  data?: never;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
}
```

---

## 七、实施计划

### 阶段1：基础设施（1-2天）
- [ ] 创建 `src/app/chat/` 目录结构
- [ ] 实现基础Zustand Store + 所有Slices
- [ ] 新增 `GET /api/projects/[id]` 路由
- [ ] 新增 `PUT /api/projects/[id]` 路由

### 阶段2：核心UI（2-3天）
- [ ] 实现 `ChatLayout` 布局组件
- [ ] 实现 `ChatHeader` + `ModelSelector`
- [ ] 实现 `MessageList`（含虚拟列表）
- [ ] 实现 `ChatInput`（含工具栏）
- [ ] 实现 `page.tsx` 页面集成

### 阶段3：Agent集成（2-3天）
- [ ] 实现 `agentSlice` 与 `createAgentExecutors` 集成
- [ ] 实现单Agent对话流程
- [ ] 实现消息流式更新
- [ ] 测试Agent执行和取消

### 阶段4：多Agent协作（2-3天）
- [ ] 实现 `AgentPanel` 可视化
- [ ] 集成 `GroupOrchestration`
- [ ] 实现 `SupervisorView`
- [ ] 测试多Agent协作流程

### 阶段5：完善（1-2天）
- [ ] 迁移Markdown插件系统
- [ ] 实现错误处理和边界
- [ ] 性能优化和测试
- [ ] 文档更新

---

## 八、关键技术决策

### 8.1 虚拟列表
- **方案**: 使用 `@tanstack/react-virtual`
- **阈值**: 100条消息以上启用
- **原因**: 性能必需，避免DOM节点过多

### 8.2 Markdown渲染
- **方案**: `react-markdown` + `remark/rehype` 插件
- **迁移**: 从 `conversation/Markdown/plugins/` 提取核心插件
- **必需插件**: LobeArtifact, LobeThinking, ImageSearchRef, LocalFile, Mention, Thinking

### 8.3 错误处理
- **方案**: React Error Boundary + 错误类型映射
- **分层**: API错误、渲染错误、Agent错误分别处理
- **UI**: 统一错误对话框 + 内联错误提示

### 8.4 状态同步
- **方案**: Zustand persist中间件（可选）
- **范围**: 仅持久化输入框草稿，不持久化消息
- **原因**: 消息由服务端管理，客户端保持轻量

---

## 九、测试策略

### 9.1 单元测试
- Store slices测试
- Hooks测试（useSendMessage, useAgentExecution）
- 工具函数测试

### 9.2 集成测试
- 完整聊天流程测试
- Agent执行流程测试
- 多Agent协作测试

### 9.3 E2E测试
- 用户发送消息 → Agent返回结果
- 模型切换流程
- Agent面板交互

---

## 十、迁移指南

### 从旧workplace迁移

1. **用户路由**: 添加从 `/workplace/[id]` 到 `/chat/[项目Id]` 的重定向
2. **数据兼容**: 保持项目数据模型不变
3. **API向后**: 保留旧的 `/api/projects/[id]/chat` 路由（标记废弃）
4. **功能对等**: 确保新系统覆盖旧系统所有功能

### 废弃文件清单

以下文件/目录将被废弃（不再使用）：
- `src/app/workplace/[id]/conversation/` （276个文件）
- `src/app/workplace/[id]/page.tsx` （简易聊天实现）

---

## 十一、成功标准

### 功能完整性
- ✅ 支持单Agent对话
- ✅ 支持多Agent协作
- ✅ 支持模型切换
- ✅ 支持流式输出
- ✅ 支持虚拟列表
- ✅ 支持Markdown渲染

### 代码质量
- ✅ 清晰的模块边界
- ✅ 统一的错误处理
- ✅ 完整的类型定义
- ✅ 测试覆盖率 > 70%

### 性能指标
- ✅ 首次加载 < 2s
- ✅ 消息渲染 < 100ms
- ✅ 内存占用 < 100MB（1000条消息）

---

**文档结束**

*本设计文档将在实施过程中根据实际需要进行更新和调整。*
