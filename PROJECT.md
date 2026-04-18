# AutocodeLLM 项目文档

> 基于 LobeHub UI 的 AI 编码代理平台，支持函数调用、任务代理、文件操作、Web 搜索等完整工具链。

---

## 一、项目简介

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

## 二、路由与页面结构

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

## 三、Dockerfile 环境配置

### 基础镜像工具链

| 工具 | 版本/说明 |
|------|-----------|
| Node.js | 24 |
| npm | latest |
| Python | 3.13 |
| Go | latest |
| PHP | 8.0 |
| Rust | latest |
| Git | latest |
| OpenSSH / OpenSSL | — |
| rclone | — |
| nvm | — |
| pipx | — |

### 权限说明

- 所有工具均可被 `uid 1000`（node 用户）调用
- npm、pipx 的全局包目录需写入全局可写区域
- 容器内环境变量：
  - `PORT=7860`（HF Spaces 兼容）
  - `RUNNING_IN_DOCKER=true`

### 镜像类型

| 镜像 | 标签 | 说明 |
|------|------|------|
| `autocodellm:base` | 基础镜像 | 包含所有运行时依赖 |
| `autocodellm:latest` | 应用镜像 | 基于 base，复制源码并构建 |
| `autocodellm:preview` | 预览镜像 | `DEMO_MODE=true` 构建 |

---

## 四、Demo 版本规范

### 启动限制

- Demo 版不可被正常方式启动为生产服务
- 不存在常规 docker tag（不含 Base、stable 标签）

### 额外功能

| 路由 | 说明 |
|------|------|
| `/` | 花里胡哨主页 — 用于项目介绍和视觉展示 |
| `/docs` | VitePress 风格文档页（无 VitePress 特有首页），或重定向到已有站点 |
| `/demo` | 纯前端演示动画 — 模拟多场景 Agent 工具调用，提供多个场景选项（办公、编码、数据分析等） |

### 函数调用限制

- 最多可调用 **5 个或更少** 的 agent
- 参数限制：
  - `task-aim`：通用代理要用详尽文字指出目的
  - `mode`：仅支持 `only read` 和 `yolo` 模式

### 兼容性

其余功能界面与完整版无缝兼容，仅在后端交互层做模拟处理。

---

## 五、工程规范

### Pre-commit 钩子

在代码提交前自动执行以下验证：

1. **TODO 检查** — 扫描代码中的 TODO 注释（大小写变体均检测），检测到任何 TODO 即阻止提交
2. **构建检查** — 执行 `bun run build`，验证应用能否成功构建
3. **Lint-staged 检查**：
   - `*.{ts,tsx}` → `npx eslint --max-warnings=0`
   - `src/**/*.{ts,tsx,js,mjs}` → TypeScript 类型检查
   - `*` → `bun run test --run`

### Pre-push 钩子

当前暂无预推送检查，标注为待补充。

### 提交规范

- 提交者署名必须为 `Jyf0214 <169313142+Jyf0214@users.noreply.github.com>`
- 提交信息使用中文，清晰描述变更内容
- 每次提交后必须推送至远程仓库

### TODO 规范

代码中禁止存在 TODO 注释。所有待办事项必须被完整实现或移除。

### LobeChat 移植代码豁免

以下目录为 LobeChat 移植代码，已在 ESLint、Vitest、TypeScript 配置中豁免检查：

- **Store 层**：`src/store/` 下大部分目录
- **Libs 层**：`src/libs/` 下所有目录
- **Features 层**：`src/features/` 下大部分目录
- **Components 层**：`src/components/` 下大部分目录
- **其他**：`src/hooks/`、`src/services/`、`src/helpers/`、`src/const/`、`src/prompts/`、`src/utils/`、`src/lib/`、`src/providers/`

> ⚠️ 注意：`src/store/userMemory/` 和 `src/store/aiInfra/` 被排除于 `tsconfig.json` 但仍被项目代码引用，需在修复类型问题后重新纳入。

---

## 六、开发规范

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

## 七、数据库 Schema

### 模型一览

| 模型 | 表名 | 说明 |
|------|------|------|
| User | users | 用户认证，含密码哈希、强制修改密码标志 |
| PasswordAudit | password_audits | 密码审计日志（登录尝试、密码变更） |
| Provider | providers | AI 提供商配置，含加密 API Key、OAuth Token |
| McpServer | mcp_servers | MCP 服务器配置 |
| ChatConfig | chat_configs | 聊天全局配置（温度、Token 限制等） |
| Workspace | workspaces | 工作区 |
| ChatMessage | chat_messages | 聊天对话记录，含 Token 统计 |
| WebdavConfig | webdav_configs | WebDAV 备份配置 |
| EnvironmentVariable | environment_variables | 加密环境变量 |
| Worker | workers | 工作节点（compute/storage/inference） |
| AgentTask | agent_tasks | 任务代理（read_only/yolo 模式） |
| WorkspaceLog | workspace_logs | 工作区日志（函数调用/聊天消息） |

---

## 八、快速开始

### 开发环境

```bash
# 安装依赖
bun install

# 启动开发服务器
bun run dev

# 生成 Prisma 客户端
bun run db:generate

# 运行数据库迁移
bun run db:push
```

### Docker 构建

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

### 质量检查

```bash
# ESLint 检查（零警告）
bun run lint

# TypeScript 类型检查
bun run typecheck

# 运行测试
bun run test

# 监听模式
bun run test:watch
```

---

## 九、项目结构

```
AutocodeLLM/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/login/       # 登录页
│   │   ├── (dashboard)/        # 已认证页面（共享侧边栏布局）
│   │   │   ├── workplace/      # 工作区列表 + [id] 详情
│   │   │   ├── chat/           # 聊天列表 + [workspaceId] 会话
│   │   │   ├── provider/       # AI 提供商管理
│   │   │   ├── setting/mcp/    # MCP 配置
│   │   │   ├── env/            # 环境变量
│   │   │   ├── workers/        # 工作节点
│   │   │   ├── agents/         # 任务代理
│   │   │   ├── sync/           # 同步管理
│   │   │   └── account/        # 账户信息
│   │   ├── change-password/    # 修改密码
│   │   ├── model/              # 重定向至 /provider
│   │   ├── api/                # 27 个 API 端点
│   │   ├── layout.tsx          # 根布局
│   │   ├── page.tsx            # 首页
│   │   └── not-found.tsx       # 404 页面
│   ├── components/             # 可复用组件（17 个目录）
│   ├── features/               # 业务功能组件（18 个目录，多来自 LobeChat）
│   ├── store/                  # Zustand 状态管理（13 个目录）
│   ├── libs/                   # LobeChat 移植库（mcp/swr/trpc/pdfjs/next）
│   ├── lib/                    # 核心库（api/auth/db/sync/terminal）
│   ├── hooks/                  # 自定义 React Hooks
│   ├── i18n/                   # 国际化（en/zh）
│   ├── services/               # 服务层
│   ├── helpers/                # 辅助函数
│   ├── const/                  # 常量
│   ├── prompts/                # 提示词模板
│   ├── providers/              # React Context Providers
│   ├── styles/                 # 全局 CSS
│   ├── types/                  # TypeScript 类型定义
│   ├── utils/                  # 工具函数
│   └── middleware.ts           # Next.js 中间件（认证）
├── prisma/                     # 数据库 Schema
├── scripts/                    # 构建/启动脚本
├── skills/                     # AI 技能定义
├── docs/                       # 项目文档
├── docker-compose.yml          # MySQL + App 多服务编排
├── Dockerfile                  # 应用镜像
├── Dockerfile.base             # 基础镜像
├── Dockerfile.preview          # 预览镜像
└── PROJECT.md                  # 本文档
```

---

*本文档根据手写笔记整理，术语已规范化。*
