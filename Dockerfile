# AutocodeLLM 自包含构建镜像
# 基于 node:24-slim，安装所有依赖并构建

FROM node:24-slim

# 构建参数
ARG DEMO_MODE=false
ENV DEMO_MODE=${DEMO_MODE}
ENV RUNNING_IN_DOCKER=true
ENV PORT=7860

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    pkg-config \
    python3-full \
    python3-pip \
    golang-go \
    php-cli \
    git \
    openssh-client \
    openssl \
    curl \
    wget \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# 安装 Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

# 复制项目文件
COPY package.json bun.lock* ./

# 安装依赖
RUN bun install --frozen-lockfile || bun install

# 复制源码
COPY . .

# 构建项目
RUN bun run build

# 创建工作目录
RUN mkdir -p /home/node/.autocodellm/workspaces \
    /home/node/.autocodellm/skills \
    /home/node/.autocodellm/config \
    /home/node/.autocodellm/logs \
    /home/node/.autocodellm/backups \
    && chown -R 1000:1000 /home/node \
    && chown -R 1000:1000 /app

USER node

EXPOSE 7860

CMD ["bun", "run", "scripts/start.mjs"]