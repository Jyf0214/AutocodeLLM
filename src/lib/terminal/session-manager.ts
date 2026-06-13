/**
 * node-pty 是可选原生模块，仅在 TERMINAL_USE_PTY=true 时尝试加载。
 *
 * 使用动态模块名 + 运行时条件判断，防止 Next.js/Turbopack
 * 在构建时对 'node-pty' 进行静态解析而导致构建失败。
 */
let ptyModule: any = null;
let ptyLoadAttempted = false;

function loadPty(): any {
  if (ptyLoadAttempted) return ptyModule;
  ptyLoadAttempted = true;

  // 默认不加载 node-pty，仅当用户显式设置 TERMINAL_USE_PTY=true 才尝试
  if (process.env.TERMINAL_USE_PTY !== 'true') {
    ptyModule = null;
    return null;
  }

  try {
    // 动态拼接模块名，避免 Turbopack 构建时静态追踪
    const modName = ['node', 'pty'].join('-');
    ptyModule = require(modName);
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

// ============================================================
// 通用终端接口（同时支持 node-pty 和 spawn 回退）
// ============================================================

export interface ITerminal {
  onData(callback: (data: string) => void): void;
  onExit(callback: (result: { exitCode: number; signal?: number }) => void): void;
  write(data: string): void;
  resize(cols: number, rows: number): void;
  kill(): void;
  readonly pid: number;
}

export interface TerminalSession {
  id: string;
  projectId: string;
  terminal: ITerminal;
  createdAt: number;
  lastActivity: number;
}

const SESSIONS = new Map<string, TerminalSession>();

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 分钟超时
/** 最大并发会话数 */
const MAX_SESSIONS = 50;

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

// ============================================================
// Spawn 回退终端（不依赖 node-pty，使用 child_process.spawn）
// ============================================================

import { spawn, type ChildProcess } from 'node:child_process';

class SpawnTerminal implements ITerminal {
  private process: ChildProcess;
  private dataCallbacks: Array<(data: string) => void> = [];
  private exitCallbacks: Array<(result: { exitCode: number; signal?: number }) => void> = [];
  readonly pid: number;
  private cols: number;
  private rows: number;

  constructor(shell: string, cwd: string, env: Record<string, string>, cols: number, rows: number) {
    this.cols = cols;
    this.rows = rows;

    // 使用 spawn 创建交互式 shell，捕获所有输出流
    // -i: 交互模式，确保输出提示符
    // spawn 模式下无真实 PTY，设置 TERM=dumb 避免程序输出控制序列
    // 传递 COLUMNS/LINES 使 ls 等命令按正确宽度格式化输出
    const spawnEnv: Record<string, string | undefined> = { ...env, TERM: 'dumb', COLUMNS: String(cols), LINES: String(rows) };
    this.process = spawn(shell, ['-i'], {
      cwd,
      env: spawnEnv as NodeJS.ProcessEnv,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    this.pid = this.process.pid ?? 0;

    // spawn 模式无真实 PTY，通过 stty 设置终端尺寸
    // 确保 ls 等命令按正确宽度换行
    setTimeout(() => {
      if (this.process.stdin?.writable) {
        this.process.stdin.write(`stty rows ${rows} cols ${cols}\n`);
      }
    }, 100);

    // 转发 stdout
    this.process.stdout?.on('data', (chunk: Buffer) => {
      const data = chunk.toString();
      for (const cb of this.dataCallbacks) cb(data);
    });

    // 转发 stderr
    this.process.stderr?.on('data', (chunk: Buffer) => {
      const data = chunk.toString();
      for (const cb of this.dataCallbacks) cb(data);
    });

    // 进程退出
    this.process.on('exit', (exitCode, rawSignal) => {
      const result: { exitCode: number; signal?: number } = { exitCode: exitCode ?? 0 };
      if (rawSignal != null) {
        // 将 Signals 字符串（如 'SIGHUP'）映射为数值（如 1）
        const signalMap: Record<string, number> = {
          SIGHUP: 1, SIGINT: 2, SIGQUIT: 3, SIGILL: 4, SIGTRAP: 5,
          SIGABRT: 6, SIGBUS: 7, SIGFPE: 8, SIGKILL: 9, SIGUSR1: 10,
          SIGSEGV: 11, SIGUSR2: 12, SIGPIPE: 13, SIGALRM: 14, SIGTERM: 15,
          SIGSTKFLT: 16, SIGCHLD: 17, SIGCONT: 18, SIGSTOP: 19, SIGTSTP: 20,
          SIGTTIN: 21, SIGTTOU: 22, SIGURG: 23, SIGXCPU: 24, SIGXFSZ: 25,
          SIGVTALRM: 26, SIGPROF: 27, SIGWINCH: 28, SIGIO: 29, SIGPWR: 30,
          SIGSYS: 31,
        };
        result.signal = signalMap[rawSignal] ?? 0;
      }
      for (const cb of this.exitCallbacks) cb(result);
    });

    this.process.on('error', (err) => {
      console.error('[spawn-terminal] 进程错误:', err);
    });
  }

  onData(callback: (data: string) => void): void {
    this.dataCallbacks.push(callback);
  }

  onExit(callback: (result: { exitCode: number; signal?: number }) => void): void {
    this.exitCallbacks.push(callback);
  }

  write(data: string): void {
    if (this.process.stdin?.writable) {
      this.process.stdin.write(data);
    }
  }

  resize(cols: number, rows: number): void {
    this.cols = cols;
    this.rows = rows;
    // spawn 模式无 PTY，通过 stty 命令设置行列数
    // 这样 ls 等命令才能按正确宽度换行
    if (this.process.stdin?.writable) {
      this.process.stdin.write(`stty rows ${rows} cols ${cols}\n`);
    }
    try {
      this.process.kill('SIGWINCH');
    } catch {
      // 进程可能已退出
    }
  }

  kill(): void {
    this.process.kill('SIGTERM');
    // 强制清理子进程
    setTimeout(() => {
      try { this.process.kill('SIGKILL'); } catch { /* 进程已退出 */ }
    }, 3000);
  }
}

// ============================================================
// node-pty 终端封装
// ============================================================

class PtyTerminal implements ITerminal {
  private ptyProcess: any;
  readonly pid: number;

  constructor(pty: any, shell: string, cwd: string, env: Record<string, string>, cols: number, rows: number) {
    // Docker 默认 seccomp 拦截 TIOCSCTTY ioctl，导致 shell 收到 SIGHUP 退出。
    // 使用 trap "" HUP 忽略挂断信号，确保 shell 即使无控制终端也能正常运行。
    this.ptyProcess = pty.spawn(shell, ['-c', 'trap "" HUP; exec ' + shell + ' -i'], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env,
    });
    this.pid = this.ptyProcess.pid;
  }

  onData(callback: (data: string) => void): void {
    this.ptyProcess.onData(callback);
  }

  onExit(callback: (result: { exitCode: number; signal?: number }) => void): void {
    this.ptyProcess.onExit(callback);
  }

  write(data: string): void {
    this.ptyProcess.write(data);
  }

  resize(cols: number, rows: number): void {
    this.ptyProcess.resize(cols, rows);
  }

  kill(): void {
    this.ptyProcess.kill();
  }
}

/**
 * 创建终端实例：优先 node-pty，失败则回退到 spawn
 */
function createTerminal(shell: string, cwd: string, env: Record<string, string>, cols: number, rows: number): ITerminal {
  // 默认使用 spawn 模式（不依赖原生模块，避免 SIGHUP 问题）
  // 设置 TERMINAL_USE_PTY=true 可启用 node-pty 获得完整 PTY 能力

  // 仅在 TERMINAL_USE_PTY=true 时尝试加载 node-pty
  const ptyInstance = loadPty();

  if (ptyInstance) {
    try {
      console.log('[terminal] 尝试 node-pty 模式');
      const terminal = new PtyTerminal(ptyInstance, shell, cwd, env, cols, rows);
      if (terminal.pid > 0) {
        console.log('[terminal] node-pty 模式成功, PID:', terminal.pid);
        return terminal;
      }
    } catch (err) {
      console.warn('[terminal] node-pty 模式失败，回退到 spawn:', err);
    }
  }

  console.log('[terminal] 使用 spawn 模式');
  return new SpawnTerminal(shell, cwd, env, cols, rows);
}

function findSessionByProjectCwd(cwd: string): TerminalSession | null {
  for (const session of SESSIONS.values()) {
    if (session.terminal.pid > 0) return session;
  }
  return null;
}

/**
 * 创建项目终端会话
 */
export function createSession(projectId: string, cols: number, rows: number): TerminalSession {
  // 确保清理定时器已启动
  initCleanupTimer();

  // 限制最大会话数
  if (SESSIONS.size >= MAX_SESSIONS) {
    // 删除最旧的会话
    const oldestKey = SESSIONS.keys().next().value;
    if (oldestKey) {
      destroySession(oldestKey);
    }
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

  const terminal = createTerminal(shell, cwd, safeEnv, cols, rows);

  console.log('[terminal] 终端已就绪, PID:', terminal.pid);

  terminal.onExit(({ exitCode, signal }) => {
    console.log('[terminal] 进程退出:', { id, projectId, exitCode, signal });
  });

  terminal.onData((data) => {
    // 只记录非空数据和特殊控制序列
    if (data.length > 0) {
      console.log('[terminal] 收到数据:', JSON.stringify(data.slice(0, 100)));
    }
  });

  const session: TerminalSession = {
    id,
    projectId,
    terminal,
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
    session.terminal.kill();
    SESSIONS.delete(sessionId);
  }
}

/**
 * 惰性初始化清理定时器，避免构建时副作用
 */
let cleanupInitialized = false;
function initCleanupTimer(): void {
  if (cleanupInitialized) return;
  cleanupInitialized = true;
  setInterval(() => {
    try {
      cleanupExpiredSessions();
    } catch (e) {
      console.error('[cleanup] 清理过期会话失败:', e);
    }
  }, 60000);
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
