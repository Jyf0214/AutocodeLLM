# AutocodeLLM 应用镜像（多阶段构建）
# 基于基础镜像（已包含所有系统依赖），分离构建与运行阶段以减小最终镜像体积
#
# 约定:
#   - .dockerignore 排除了 bun.lock，因此构建上下文中无锁文件，
#     builder 阶段的 bun install 会生成新的 bun.lock
#   - runner 通过 COPY --from=builder 获取该锁文件以保持依赖版本一致
# =============================================================================
# Stage 1: builder — 安装所有依赖并构建应用
# =============================================================================
FROM ghcr.io/jyf0214/autocodellm:base AS builder

WORKDIR /app

# 先复制 package.json 利用 Docker 层缓存（该文件不在 .dockerignore 中）
COPY package.json ./

# 安装全部依赖（含 devDependencies，供构建使用）
RUN bun install

# 复制全部源代码（.dockerignore 已排除 node_modules、.next 等）
COPY . .

# 确保 bun 和 bunx 可用（创建符号链接）
RUN ln -sf /home/node/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true && \
    ln -sf /home/node/.bun/bin/bunx /usr/local/bin/bunx 2>/dev/null || true

# 清理旧的构建产物并重新构建（Prisma generate + Next.js build）
RUN rm -rf .next && \
    bun run build

# =============================================================================
# Stage 2: runner — 仅包含运行时必需的产物和生产依赖
# =============================================================================
FROM ghcr.io/jyf0214/autocodellm:base AS runner

ARG DEMO_MODE=false
ENV DEMO_MODE=${DEMO_MODE}

# 标记此镜像在 Docker 环境中运行
ENV RUNNING_IN_DOCKER=true

# HF Spaces 使用 7860 端口
ENV PORT=7860

# 设置工作目录
WORKDIR /app

# ── Step 1: 安装生产依赖 ──────────────────────────────────────────────────
# 从 builder 复制锁文件以确保依赖版本与构建时一致
COPY --from=builder /app/bun.lock ./bun.lock
COPY package.json ./
RUN bun install --production && \
    ln -sf /home/node/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true && \
    ln -sf /home/node/.bun/bin/bunx /usr/local/bin/bunx 2>/dev/null || true

# ── Step 2: 从 builder 复制构建产物 ─────────────────────────────────────────
COPY --from=builder /app/.next        ./.next

# ── Step 3: 复制运行时脚本 ──────────────────────────────────────────────────
COPY --from=builder /app/scripts      ./scripts
COPY --from=builder /app/server.ts    ./server.ts
COPY --from=builder /app/next.config.ts   ./next.config.ts
COPY --from=builder /app/postcss.config.mjs ./postcss.config.mjs

# ── Step 4: 复制 Prisma schema（启动时用于 db push / generate）──────────────
COPY --from=builder /app/prisma       ./prisma

# ── Step 4b: 生成 Prisma Client（依赖 node_modules 和 prisma schema）────────
RUN bunx prisma generate

# ── Step 5: 复制 TypeScript 源文件（server.ts 通过 @/ 别名运行时引用）─────
COPY --from=builder /app/src          ./src
COPY --from=builder /app/tsconfig.json     ./tsconfig.json

# ── Step 6: 创建运行时数据目录 ──────────────────────────────────────────────
RUN mkdir -p /home/node/.autocodellm/projects \
    /home/node/.autocodellm/skills \
    /home/node/.autocodellm/config \
    /home/node/.autocodellm/logs \
    /home/node/.autocodellm/backups && \
    chown -R 1000:1000 /home/node \
    && chown -R 1000:1000 /app

# 切换到非 root 用户
USER node

# 暴露端口
EXPOSE 7860

# 启动命令（直接启动，无需构建）
CMD ["bun", "run", "scripts/start.mjs"]
