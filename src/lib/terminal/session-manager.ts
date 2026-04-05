import * as pty from 'node-pty';

export interface TerminalSession {
  id: string;
  workspaceId: string;
  pty: pty.IPty;
  createdAt: number;
  lastActivity: number;
}

const SESSIONS = new Map<string, TerminalSession>();
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟超时

/**
 * 创建工作区终端会话
 */
export function createSession(workspaceId: string, cols: number, rows: number): TerminalSession {
  const existing = findSessionByWorkspace(workspaceId);
  if (existing) {
    destroySession(existing.id);
  }

  const id = 'term-' + String(Date.now()) + '-' + String(Math.random()).slice(2, 8);
  const ptyProcess = pty.spawn('bash', [], {
    name: 'xterm-256color',
    cols,
    rows,
    cwd: '/home/user/workspace/' + workspaceId,
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
