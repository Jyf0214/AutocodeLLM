# AutocodeLLM 应用镜像
# 基于基础镜像（已包含所有依赖），复制源码并预构建
FROM ghcr.io/jyf0214/autocodellm:base AS base

# DEMO_MODE 构建参数（预览镜像设为 true）
ARG DEMO_MODE=false
ENV DEMO_MODE=${DEMO_MODE}

# 标记此镜像在 Docker 环境中运行
ENV RUNNING_IN_DOCKER=true

# HF Spaces 使用 7860 端口
ENV PORT=7860

# 设置工作目录
WORKDIR /app

# 复制源代码
COPY . .

# 确保 bun 和 bunx 可用（创建符号链接）
RUN ln -sf /home/node/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true && \
    ln -sf /home/node/.bun/bin/bunx /usr/local/bin/bunx 2>/dev/null || true

# 安装依赖并预构建（node-pty 为可选依赖，编译失败不影响构建）
RUN rm -rf .next && \
    bun install && \
    bun run build && \
    mkdir -p /home/node/.autocodellm/workspaces \
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
