---
name: autocodellm-dev
description: AutocodeLLM 项目开发技能，涵盖路由架构、工程规范、页面设计和开发实践。在实现功能、重构或修改代码时使用此技能。
---

# AutocodeLLM 项目开发技能

本技能封装了 AutocodeLLM 项目的完整开发指南、架构决策、工程标准和最佳实践。在实现功能、修复 Bug、重构或进行任何修改时，遵循此技能以确保一致性、可维护性和质量。

---

## 项目概述

AutocodeLLM 是基于 Next.js 16 + React 19 + TypeScript + Prisma ORM + Ant Design + Zustand 的全栈 AI 编码代理平台，支持函数调用、任务代理、文件操作、Web 搜索等完整工具链。

### 技术栈

| 类别 | 技术选型 | 版本 |
|------|----------|------|
| **前端框架** | Next.js + Turbopack | 16.2.2 |
| **UI 组件库** | LobeHub UI + Ant Design | 5.6.4 / 6.3.5 |
| **运行时** | Bun | latest |
| **数据库** | MySQL + Prisma ORM | 6.19.3 |
| **语言** | TypeScript + React | 5.x / 19 |
| **状态管理** | Zustand | — |
| **代码质量** | ESLint + TypeScript-ESLint | `--max-warnings=0` |
| **测试** | Vitest + Playwright | 4.1.2 / 1.59.1 |
| **国际化** | next-intl | 4.9.0 |
| **动画** | Motion (Framer Motion) | 12.38.0 |

### 代码质量标准

- ESLint 配置为 `--max-warnings=0`，不允许任何 warning 或 error
- 所有注释必须为中文
- 严格 TypeScript 模式（`strict: true`，`noUnusedLocals`，`noUnusedParameters`，`exactOptionalPropertyTypes`，`noImplicitReturns`）
- 敏感数据（API Key、环境变量）使用 AES-256-CBC 加密存储

---

## 路由与页面结构

项目采用扁平化路由设计，主要分为工作区管理、系统配置、云服务、开发调试四大模块。

### 路由组

| 路由组 | URL 段 | 用途 |
|--------|--------|------|
| `(auth)` | 不出现在 URL 中 | 认证相关页面（登录），无共享布局 |
| `(dashboard)` | 不出现在 URL 中 | 所有已认证页面，共享 `AppLayout` 侧边栏布局 |

### 核心路由

| 路由 | 功能说明 | 备注 |
|------|----------|------|
| `/` | 首页 | 应用入口，展示功能卡片和登录/登出逻辑 |
| `/workplace` | 工作区概览 | 仅展示所有工作区列表，不提供具体操作功能 |
| `/workplace/[id]` | 特定工作区 | 动态路由，`[id]` 为工作区唯一标识符，进入后可执行该工作区的具体功能（含聊天界面） |
| `/chat` | 聊天工作区列表 | 聊天入口，列出所有工作区，支持新建 |
| `/chat/[workspaceId]` | 工作区聊天会话 | 独立聊天页面，使用 Zustand 5 切片 store（agent/chat/input/messages/ui），含 AgentPanel、ChatInput、MessageList 等模块化组件 |
| `/change-password` | 修改密码 | 处理强制密码修改（`forceChangePassword` 标志） |
| `/model` | 模型管理 | 纯重定向页面，自动跳转至 `/provider` |

### 系统与配置路由

| 路由 | 功能说明 |
|------|----------|
| `/setting/mcp` | MCP（Model Context Protocol）服务器配置中心，支持多种协议实现，不仅限于纯 HTTP 协议的 MCP 服务 |
| `/provider` | AI 模型提供商管理页，包含 API 配置与可用模型列表，支持 AES-256-CBC 加密 API Key、预设提供商、Qwen OAuth 流程 |
| `/agents` | 子智能体管理，可被主 Agent 通过 Function Call（Tool Call）机制调用；注意此功能与 Agent 调用机制绑定，不作为独立页面存在 |
| `/env` | 环境变量管理，数据持久化存储于 DATABASE 中。当应用通过 AI LLM 的 Function Call 执行 "Run shell" 命令，或通过 Workplace Terminal 操作时，这些环境变量对全局应用生效 |
| `/workers` | 工作节点管理，支持 compute/storage/inference 类型，显示状态标签（online/offline/busy/error） |
| `/sync` | 同步管理，WebDAV 配置 + 文件监控 + 远程拉取 |
| `/account` | 账户信息，用户资料与密码修改 |
| `/login` | 用户认证登录页，支持密码登录和短信验证码登录 |

### 云服务路由

| 路由 | 功能说明 |
|------|----------|
| `/cloud` | 云存储服务总览与配置入口 |
| `/cloud/webdav` | WebDAV 协议配置页，用于设置云存储连接 |
| `/cloud/backups` | 全局备份监控，只读视图，可查看各工作区 WebDAV 同步状态 |

### 认证与中间件

- **公开路径**（无需认证）：`/`、`/login`、`/demo`、所有 `/api/*` 路由
- **受保护路径**：其他所有页面，需 `userId`（通过 Cookie `userId` 或 Header `x-user-id` 验证）
- 未认证用户访问受保护页面时重定向至 `/login?redirect=<原始路径>`
- 已认证用户访问 `/login` 时重定向至 `/workplace`

### API 路由（27 个端点）

| 方法 | 路由 | 说明 |
|------|------|------|
| GET, POST | `/api/workspaces` | 列出/创建工作区 |
| GET, PUT, DELETE | `/api/workspaces/[id]` | 获取/更新/删除单个工作区 |
| POST | `/api/workspaces/[id]/verify` | 验证工作区进入密码 |
| POST | `/api/workspaces/[id]/set-password` | 设置工作区进入密码 |
| GET, POST | `/api/workspaces/[id]/logs` | 获取/创建工作区日志 |
| POST | `/api/workspaces/[id]/chat` | 向工作区发送聊天消息 |
| GET, POST | `/api/workers` | 列出/创建工作节点 |
| GET, POST | `/api/sync` | 获取同步状态/更新同步配置 |
| GET, POST, PUT, DELETE | `/api/providers` | AI 提供商完整 CRUD |
| POST | `/api/providers/preset` | 从预设配置添加提供商 |
| POST | `/api/providers/qwen-oauth/start` | 启动 Qwen 设备流 OAuth |
| POST | `/api/providers/qwen-oauth/refresh` | 刷新 Qwen OAuth Token |
| POST | `/api/providers/qwen-oauth/poll` | 轮询 Qwen OAuth Token |
| GET, POST, PUT, DELETE | `/api/models` | 模型配置完整 CRUD |
| POST | `/api/models/discover` | 从提供商 API 发现模型 |
| POST | `/api/models/bulk` | 批量添加模型 |
| GET, POST, PUT, DELETE | `/api/env` | 加密环境变量完整 CRUD |
| GET | `/api/docs` | 列出文档文件 |
| GET | `/api/docs/content` | 获取文档文件内容 |
| POST | `/api/chat/completions` | OpenAI 兼容聊天补全端点 |
| POST | `/api/auth/verification-code` | 生成 12 位验证码 |
| POST | `/api/auth/login` | 密码或验证码登录 |
| POST | `/api/auth/change-password` | 修改密码 |
| GET, POST, PUT, DELETE | `/api/agents` | Agent 任务完整 CRUD |
| GET, PUT | `/api/account` | 获取用户信息/修改密码 |
| GET, POST, PUT, DELETE | `/api/mcp` | MCP 服务器完整 CRUD |
| GET | `/api/terminal/ws` | 返回终端 WebSocket URL |

---

## 工程规范

### Git 工作流规范

#### Pre-commit 钩子（提交前检查）

在代码提交前自动执行以下验证，确保代码质量：

1. **TODO 检查** — 扫描代码中的 TODO 注释（大小写变体均检测），检测到任何 TODO 即阻止提交。所有待办事项必须被完整实现或移除后才能通过。
2. **构建检查** — 执行 `bun run build`，验证应用能否成功构建，构建失败则阻止提交。
3. **Lint-staged 检查**：
   - `*.{ts,tsx}` → `npx eslint --max-warnings=0`
   - `src/**/*.{ts,tsx,js,mjs}` → TypeScript 类型检查（`tsc --noEmit --skipLibCheck`）
   - `*` → `bun run test --run`（Vitest 单元测试）

#### Pre-push 钩子

当前暂无预推送检查，标注为待补充。

#### 提交规范

- 提交者署名必须为 `Jyf0214 <169313142+Jyf0214@users.noreply.github.com>`
- 提交信息使用中文，清晰描述变更内容
- 每次提交后必须推送至远程仓库

### TODO 规范

代码中禁止存在 TODO 注释。所有待办事项必须被完整实现或移除，不允许 "临时方案" 或 "以后清理" 的代码。

### LobeChat 移植代码豁免

以下目录为 LobeChat 移植代码，已在 ESLint、Vitest、TypeScript 配置中豁免检查：

- **Store 层**：`src/store/global/`、`src/store/aiInfra/`、`src/store/home/`、`src/store/userMemory/`、`src/store/mention/`、`src/store/middleware/`、`src/store/agent/`、`src/store/agentGroup/`、`src/store/chat/`、`src/store/file/`、`src/store/session/`、`src/store/user/`
- **Libs 层**：`src/libs/swr/`、`src/libs/trpc/`、`src/libs/mcp/`、`src/libs/pdfjs/`、`src/libs/next/`
- **Features 层**：`src/features/` 下大部分目录
- **Components 层**：`src/components/` 下大部分目录
- **其他**：`src/hooks/`、`src/services/`、`src/helpers/`、`src/const/`、`src/prompts/`、`src/utils/`、`src/lib/`、`src/providers/`

> ⚠️ 注意：`src/store/userMemory/` 和 `src/store/aiInfra/` 被排除于 `tsconfig.json` 但仍被项目代码引用，需在修复类型问题后重新纳入。

---

## 页面设计规范

### Workplace 页设计原则

`/workplace` 路由仅作为工作区列表展示，所有具体功能操作必须进入单个工作区（`/workplace/[id]`）后才能执行。此外，`/workplace` 本身包含聊天路由入口。

- 避免在 `/workplace` 页面放置任何修改工作区状态的按钮、表单或交互元素
- 保持布局极简：干净的工作区卡片列表（或网格），每张卡片显示工作区名称、图标和简短状态指示
- 点击工作区卡片应导航至 `/workplace/[id]`，在那里提供完整功能套件
- 确保列表视图响应式：移动端卡片垂直堆叠，触控目标足够大

---

## 开发规范

在代码开发过程中，需严格遵循以下原则：

### 1. 上下兼容（Backward Compatibility）

新旧版本必须实现无缝迁移，避免因版本升级导致功能中断或数据丢失。任何 API 变更需保留旧接口支持，直至所有依赖方完成迁移。

### 2. 绝对模块化（Absolute Modularity）

将可复用的功能单元（如按钮反馈交互、日志消息组件等）拆分为独立文件，形成标准化模块。允许被任意页面导入复用。

设计目标：单文件代码量可能较多，但必须保证每个文件的职责单一、行数精简，便于后期优化和维护。

### 3. 极简主义（Minimalism）

当同一功能存在多种语法实现且完全等效时，优先选择最简单、最直观的语法。UI 层面追求美观与极简的平衡，但极简不代表为减少代码而牺牲用户体验，必要时仍需编写充足的 UI 代码以确保交互质量。

### 4. 完美主义（Perfectionism）

代码未达到完美状态前禁止提交。严禁代码中存在冗余逻辑或废弃功能。例如，若需定义多个端点实现同一功能的新旧 API 兼容，必须确保实现严谨，不允许出现 "临时方案" 或 "以后清理" 的代码。

### 5. 模块至上的 CSS 策略（Module-First CSS）

优先使用现有 UI 组件库（卡片、容器等）和依赖封装来实现布局，尽量减少手写 CSS。仅在必要时编写最少的 CSS 作为衔接，降低样式冲突和维护成本。

### 6. 创新的组件编码（Innovative Coding）

对于 React、Next.js、Ant Design 等框架中已有的通用组件，避免直接使用默认的 "老掉牙" 图标和效果（需区分使用场合）。例如，应用加载时不使用默认的转圈动画，应设计更符合产品气质的自定义加载状态。

### 7. 多端统一的代码（Cross-Platform Unification）

针对移动端 UI 适配：关键按钮和文字必须支持自动换行显示。避免手机端用户因单行文本过长导致显示错位，或避免因菜单栏强制展开而引发的 UI 布局错乱。确保移动端与桌面端体验一致。

### 8. 精确的字体策略（Precise Typography）

不局限于单一系统字体。根据实际使用场景、目标用户地区（国度）等因素，灵活搭配斜体（Italic）、花体（Script）、独立字体族（Custom Font Family）等中英文字体，提升阅读体验与视觉层级。

---

## 工具使用与命令

| 命令 | 用途 |
|------|------|
| `bun run dev` | 启动 Next.js 开发服务器（Turbopack 热重载） |
| `bun run build` | 生产构建，输出至 `.next` |
| `bun run start` | 构建后启动生产服务器 |
| `bun run lint` | 运行 ESLint（零警告） |
| `bun run typecheck` | TypeScript 编译器仅检查模式 |
| `bun run test` | 执行 Vitest 测试套件 |
| `bun run test:watch` | Vitest 监听模式 |
| `bun run db:generate` | Prisma Schema 变更后生成客户端 |
| `bun run db:push` | 将 Prisma Schema 变更应用到数据库 |
| `bun run db:studio` | 启动 Prisma Studio 图形化数据查看 |
| `bun run db:init` | 初始化数据库（运行 db-push 脚本） |
| `bun run db:health` | 数据库健康检查 |
| `bun run db:reset` | 强制重置数据库并重新初始化 |

### Docker 命令

```bash
# 构建基础镜像
docker build -f Dockerfile.base -t ghcr.io/jyf0214/autocodellm:base .

# 构建应用镜像
docker build -t autocodellm:latest .

# 构建预览镜像
docker build -f Dockerfile.preview -t autocodellm:preview --build-arg DEMO_MODE=true .

# 使用 Docker Compose 启动
docker compose up -d
```

---

## 何时寻求帮助

遇到以下情况时，请向用户询问：

- **需求不明确**：功能描述缺少验收标准
- **外部依赖**：需要集成项目中未包含的第三方服务或包
- **破坏性变更**：修改可能影响现有消费者或数据结构
- **安全问题**：对密钥处理、认证或输入验证存在疑虑
- **性能问题**：怀疑存在瓶颈，需要分析或优化指导
- **架构疑问**：不确定新代码的放置位置或应遵循的模式
- **测试困难**：难以编写复杂逻辑的单元或集成测试
- **CSS/样式冲突**：样式行为异常或需要作用域解决方案
- **TypeScript 错误**：经过合理努力后仍无法解决的类型问题
- **任何阻塞问题**：超过 15 分钟无法取得进展的任何问题

提问时请提供：
- 正在尝试实现的简洁摘要
- 已尝试的方法（命令、代码片段、错误消息）
- 预期结果与实际结果的对比
- 相关文件路径或函数名
