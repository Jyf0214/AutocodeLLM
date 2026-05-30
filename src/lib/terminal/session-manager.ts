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
  projectId: string;
  pty: import('node-pty').IPty;
  createdAt: number;
  lastActivity: number;
}

const SESSIONS = new Map<string, TerminalSession>();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟超时

/**
 * 获取终端的工作目录
 *
 * 项目为数据库记录（非文件系统目录），终端默认在应用根目录启动。
 * 可通过 PROJECT_BASE_PATH 环境变量覆盖根目录基准路径。
 */
function getProjectCwd(_projectId: string): string {
  // 优先使用环境变量指定的项目根路径
  if (process.env.PROJECT_BASE_PATH) {
    return process.env.PROJECT_BASE_PATH;
  }
  // 默认使用应用运行目录
  return process.cwd();
}

/**
 * 创建项目终端会话
 */
export function createSession(projectId: string, cols: number, rows: number): TerminalSession {
  const pty = loadPty();
  if (!pty) {
    throw new Error('node-pty 原生模块不可用，无法创建终端会话');
  }

  const existing = findSessionByProject(projectId);
  if (existing) {
    destroySession(existing.id);
  }

  const id = 'term-' + String(Date.now()) + '-' + String(Math.random()).slice(2, 8);
  const cwd = getProjectCwd(projectId);

  console.log('[terminal] 创建终端会话:', { id, projectId, cwd, cols, rows });

  const shell = process.env.SHELL || 'bash';
  console.log('[terminal] 启动 shell:', { shell, cwd });

  // 过滤环境变量：仅传递安全、必需的变量，避免环境变量导致 bash 异常退出
  const safeEnv: Record<string, string> = {
    TERM: 'xterm-256color',
    HOME: process.env.HOME || '/root',
    USER: process.env.USER || 'root',
    SHELL: shell,
    PATH: process.env.PATH || '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
    LANG: process.env.LANG || 'C.UTF-8',
    LC_ALL: process.env.LC_ALL || 'C.UTF-8',
    LOGNAME: process.env.LOGNAME || 'root',
    // 传递工作目录特定变量
    NODE_ENV: process.env.NODE_ENV || 'production',
  };

  let ptyProcess;
  try {
    // Docker 默认 seccomp 拦截 TIOCSCTTY ioctl，导致 shell 收到 SIGHUP 退出。
    // 使用 trap "" HUP 忽略挂断信号，确保 shell 即使无控制终端也能正常运行。
    ptyProcess = pty.spawn(shell, ['-c', 'trap "" HUP; exec ' + shell + ' -i'], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: safeEnv,
    });
  } catch (err) {
    console.error('[terminal] spawn 失败:', { shell, cwd, error: err });
    throw err;
  }

  console.log('[terminal] 终端进程已启动, PID:', ptyProcess.pid);

  ptyProcess.onExit(({ exitCode, signal }) => {
    console.log('[terminal] 进程退出:', { id, projectId, exitCode, signal });
  });

  ptyProcess.onData((data) => {
    // 只记录非空数据和特殊控制序列
    if (data.length > 0) {
      console.log('[terminal] 收到数据:', JSON.stringify(data.slice(0, 100)));
    }
  });

  const session: TerminalSession = {
    id,
    projectId,
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
 * 根据项目 ID 查找会话
 */
export function findSessionByProject(projectId: string): TerminalSession | null {
  for (const session of SESSIONS.values()) {
    if (session.projectId === projectId) {
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
export function getActiveSessions(): { id: string; projectId: string; createdAt: number }[] {
  return Array.from(SESSIONS.values()).map((s) => ({
    id: s.id,
    projectId: s.projectId,
    createdAt: s.createdAt,
  }));
}
