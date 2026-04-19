// node-pty 是可选原生模块，可能不可用（如 Docker 容器中缺少编译环境）
// 使用延迟加载避免模块解析阶段的致命错误
let ptyModule: typeof import('node-pty') | null = null;
let ptyLoadAttempted = false;

function loadPty() {
  if (ptyLoadAttempted) return ptyModule;
  ptyLoadAttempted = true;
  try {
    ptyModule = require('node-pty');
  } catch {
    ptyModule = null;
  }
  return ptyModule;
}

/**
 * 检查 node-pty 是否可用
 */
export function isPtyLoaded(): boolean {
  return loadPty() !== null;
}

export interface TerminalSession {
  id: string;
  workspaceId: string;
  pty: import('node-pty').IPty;
  createdAt: number;
  lastActivity: number;
}

const SESSIONS = new Map<string, TerminalSession>();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟超时

/**
 * 获取工作区目录路径
 * Docker 环境使用 /home/node/.autocodellm/workspaces
 * 本地环境使用 /home/user/workspace
 */
function getWorkspaceCwd(workspaceId: string): string {
  const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
  const basePath = isDocker ? '/home/node/.autocodellm/workspaces' : process.env.WORKSPACE_BASE_PATH ?? '/home/user/workspace';
  return basePath + '/' + workspaceId;
}

/**
 * 创建工作区终端会话
 */
export function createSession(workspaceId: string, cols: number, rows: number): TerminalSession {
  const pty = loadPty();
  if (!pty) {
    throw new Error('node-pty 原生模块不可用，无法创建终端会话');
  }

  const existing = findSessionByWorkspace(workspaceId);
  if (existing) {
    destroySession(existing.id);
  }

  const id = 'term-' + String(Date.now()) + '-' + String(Math.random()).slice(2, 8);
  const cwd = getWorkspaceCwd(workspaceId);

  const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd,
    env: process.env as Record<string, string>,
  });

  const session: TerminalSession = {
    id,
    workspaceId,
    pty: ptyProcess,
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };

  SESSIONS.set(id, session);

  // 超时自动销毁
  setTimeout(() => {
    if (SESSIONS.has(id)) {
      destroySession(id);
    }
  }, SESSION_TIMEOUT);

  return session;
}

/**
 * 获取会话
 */
export function getSession(sessionId: string): TerminalSession | null {
  const session = SESSIONS.get(sessionId) ?? null;
  if (session) {
    session.lastActivity = Date.now();
  }
  return session;
}

/**
 * 根据工作区 ID 查找会话
 */
export function findSessionByWorkspace(workspaceId: string): TerminalSession | null {
  for (const session of SESSIONS.values()) {
    if (session.workspaceId === workspaceId) {
      return session;
    }
  }
  return null;
}

/**
 * 销毁会话
 */
export function destroySession(sessionId: string): void {
  const session = SESSIONS.get(sessionId);
  if (session) {
    session.pty.kill();
    SESSIONS.delete(sessionId);
  }
}

/**
 * 清理超时会话
 */
export function cleanupExpiredSessions(): void {
  const now = Date.now();
  for (const [id, session] of SESSIONS.entries()) {
    if (now - session.lastActivity > SESSION_TIMEOUT) {
      destroySession(id);
    }
  }
}

/**
 * 获取所有活跃会话
 */
export function getActiveSessions(): { id: string; workspaceId: string; createdAt: number }[] {
  return Array.from(SESSIONS.values()).map((s) => ({
    id: s.id,
    workspaceId: s.workspaceId,
    createdAt: s.createdAt,
  }));
}
