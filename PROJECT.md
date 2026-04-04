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
| **代码质量** | ESLint + TypeScript-ESLint | — |
| **测试** | Vitest + Playwright | 4.1.2 / 1.59.1 |
| **国际化** | next-intl | 4.9.0 |
| **动画** | Motion (Framer Motion) | 12.38.0 |

### 代码质量标准

- ESLint 配置为 `--max-warnings=0`，不允许任何 warning 或 error
- 所有注释必须为中文
- 严格 TypeScript 模式（`strict: true`，`noUnusedLocals`，`noUnusedParameters` 等）

---

## 二、功能模块与路由映射

### 核心功能

| 功能模块 | 页面路由 | 说明 |
|----------|----------|------|
| 函数调用 (Function Call) | `/login` | 代理函数调用入口 |
| 全局配置 (Global Config) | `/workplace` | 工作空间全局设置 |
| 工作空间详情 | `/workplace/[id]` | 单个工作空间管理（文件读/写/编辑） |
| MCP 服务配置 | `/setting/mcp` | MCP 服务端点管理 |
| 环境变量 | `/env` | 环境变量配置（含 Web Fetch） |
| 工作节点 | `/workers` | Worker 节点管理（含 Web Search） |
| 任务代理 | `/agents` | Agent 编排与调度 |
| 同步管理 | `/sync` | Shell 执行 + WebDAV 同步 |
| Git 日志 | — | 集成于工作空间内 |
| 模型管理 | `/model` | 模型选择与配置 |
| OpenAI 提供商 | `/openai/provider` | 外部 API 提供商配置 |

### 加载体验

采用类似 npm loading 的文本上下文提示，逐步展示构建过程，避免空白等待。

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

## 五、开发 TODO 清单

### Phase 1: 基础架构（当前阶段）

- [x] 项目初始化（Next.js 16 + Turbopack）
- [x] package.json 依赖配置
- [x] TypeScript 严格模式配置
- [x] ESLint + pre-commit 钩子
- [x] Dockerfile 基础镜像定义
- [ ] LobeHub UI 组件集成与主题定制
- [ ] 核心布局框架（左右结构、导航栏）
- [ ] 国际化 (i18n) 基础配置

### Phase 2: 核心路由与页面

- [ ] `/login` — 登录与函数调用入口
- [ ] `/workplace` — 工作空间列表
- [ ] `/workplace/[id]` — 工作空间详情（文件操作）
- [ ] `/setting/mcp` — MCP 服务配置
- [ ] `/env` — 环境变量管理
- [ ] `/workers` — Worker 节点管理
- [ ] `/agents` — 任务代理编排
- [ ] `/sync` — 同步与 Shell 执行
- [ ] `/model` — 模型管理
- [ ] `/openai/provider` — API 提供商配置

### Phase 3: 功能集成

- [ ] 文件读取/写入/编辑操作
- [ ] Web Fetch 与 Web Search 功能
- [ ] 任务代理系统（task_agent）
- [ ] Shell 执行环境
- [ ] Git 日志集成
- [ ] 数据库连接（MySQL/Redis）
- [ ] 加载动画（npm-style 文本上下文）

### Phase 4: Demo 版本

- [ ] `/` 花里胡哨主页设计
- [ ] `/docs` 文档页面
- [ ] `/demo` 纯前端演示动画
- [ ] Agent 数量限制（≤5）
- [ ] 参数限制（only read / yolo）

### Phase 5: 质量与部署

- [ ] Docker 镜像分层优化
- [ ] WebDAV 同步机制
- [ ] 性能优化与 bundle 分析
- [ ] E2E 测试覆盖

---

## 六、未来计划

| 方向 | 计划 |
|------|------|
| **模型管理** | 完善 `/openai/provider` 和 `/model` 路由的模型配置功能 |
| **同步机制** | 强化 `/sync` 的 WebDAV 数据同步能力 |
| **Agent 生态** | 扩展 task_agent 能力，支持更多办公场景 |
| **部署优化** | 优化 Docker 镜像分层，提升构建效率 |
| **插件系统** | 支持用户自定义 Agent 插件 |

---

## 七、项目结构

```
AutocodeLLM/
├── src/
│   ├── app/                    # Next.js App Router 路由
│   │   ├── (auth)/login/       # 登录页
│   │   ├── workplace/          # 工作空间管理
│   │   │   └── [id]/           # 工作空间详情
│   │   ├── setting/mcp/        # MCP 配置
│   │   ├── env/                # 环境变量
│   │   ├── workers/            # Worker 管理
│   │   ├── agents/             # 任务代理
│   │   ├── sync/               # 同步管理
│   │   ├── model/              # 模型管理
│   │   ├── openai/provider/    # API 提供商
│   │   ├── docs/               # Demo 文档页
│   │   ├── demo/               # Demo 演示页
│   │   └── page.tsx            # 首页（Demo 版为花里胡哨主页）
│   ├── components/             # 可复用组件
│   │   ├── layout/             # 布局组件
│   │   ├── ui/                 # LobeHub UI 封装
│   │   └── features/           # 业务功能组件
│   ├── lib/                    # 工具函数
│   │   ├── db/                 # Prisma 客户端
│   │   ├── api/                # API 客户端
│   │   └── utils/              # 通用工具
│   ├── hooks/                  # 自定义 Hooks
│   ├── styles/                 # 全局样式
│   └── i18n/                   # 国际化配置
├── prisma/                     # 数据库 Schema
├── public/                     # 静态资源
├── scripts/                    # 构建/启动脚本
├── tests/                      # 测试文件
├── docker-compose.yml          # 多服务编排
├── Dockerfile                  # 应用镜像
├── Dockerfile.base             # 基础镜像
├── Dockerfile.preview          # 预览镜像
└── PROJECT.md                  # 本文档
```

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
bun run db:migrate
```

### Docker 构建

```bash
# 构建基础镜像
docker build -f Dockerfile.base -t ghcr.io/jyf0214/autocodellm:base .

# 构建应用镜像
docker build -t autocodellm:latest .

# 构建预览镜像
docker build -f Dockerfile.preview -t autocodellm:preview --build-arg DEMO_MODE=true .
```

### 质量检查

```bash
# ESLint 检查（零警告）
bun run lint

# 运行测试
bun run test

# 监听模式
bun run test:watch
```

---

*本文档根据手写笔记整理，术语已规范化。*
