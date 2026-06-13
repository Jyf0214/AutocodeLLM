FROM docker.io/library/node:22-slim

ARG SANDBOX_NAME="qwen-code-sandbox"
ARG CLI_VERSION_ARG
ENV SANDBOX="$SANDBOX_NAME"
ENV CLI_VERSION=$CLI_VERSION_ARG

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
  python3 \
  man-db \
  curl \
  dnsutils \
  less \
  jq \
  bc \
  gh \
  git \
  unzip \
  rsync \
  ripgrep \
  procps \
  psmisc \
  lsof \
  socat \
  ca-certificates \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Set up npm global package folder
RUN mkdir -p /usr/local/share/npm-global
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Install from npm registry
RUN npm install -g @qwen-code/qwen-code@latest \
  && npm cache clean --force

# 复制 WebDAV 同步脚本到镜像
COPY scripts/webdav-sync.js /usr/local/lib/autocodellm/webdav-sync.js
COPY scripts/webdav-entry.js /usr/local/lib/autocodellm/webdav-entry.js

# 入口：WebDAV 同步 + Token 校验 + qwen serve
CMD ["node", "/usr/local/lib/autocodellm/webdav-entry.js"]
