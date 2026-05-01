import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer | null = null;

// node-pty 是否可用（原生模块可能缺失）
let ptyAvailable = false;
let createSession: ((projectId: string, cols: number, rows: number) => import('./session-manager').TerminalSession) | null = null;
let findSessionByProject: ((projectId: string) => import('./session-manager').TerminalSession | null) | null = null;
let destroySession: ((sessionId: string) => void) | null = null;

try {
  const sessionManager = await import('./session-manager');
  if (sessionManager.isPtyLoaded()) {
    createSession = sessionManager.createSession;
    findSessionByProject = sessionManager.findSessionByProject;
    destroySession = sessionManager.destroySession;
    ptyAvailable = true;
  } else {
    console.warn('⚠ node-pty 原生模块不可用，终端功能已禁用');
  }
} catch (error) {
  console.warn('⚠ 终端会话管理器加载失败，终端功能已禁用:', (error as Error).message);
}

// 项目 → WebSocket 客户端集合
const projectClients = new Map<string, Set<WebSocket>>();

// 会话 → pty 事件监听器已绑定标记
const sessionListenersAttached = new Set<string>();

/**
 * 向项目所有客户端广播消息
 */
function broadcastToProject(projectId: string, message: string, exclude?: WebSocket): void {
  const clients = projectClients.get(projectId);
  if (!clients) return;
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

/**
 * 绑定 pty 输出和退出事件到会话（仅绑定一次）
 */
function attachSessionListeners(session: import('./session-manager').TerminalSession): void {
  if (sessionListenersAttached.has(session.id)) return;
  sessionListenersAttached.add(session.id);

  session.pty.onData((data) => {
    const msg = JSON.stringify({ type: 'data', data });
    broadcastToProject(session.projectId, msg);
  });

  session.pty.onExit(({ exitCode }) => {
    const msg = JSON.stringify({ type: 'exit', exitCode });
    broadcastToProject(session.projectId, msg);
    sessionListenersAttached.delete(session.id);
    destroySession!(session.id);
  });
}

/**
 * 初始化 WebSocket 服务器（noServer 模式，由 server.ts 的 HTTP 服务器升级调用）
 */
export function initTerminalWebSocket(server: Server): void {
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    if (url.pathname.startsWith('/api/terminal/ws')) {
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, request) => {
    // 如果 node-pty 不可用，通知客户端并关闭
    if (!ptyAvailable) {
      ws.send(JSON.stringify({ type: 'error', message: '终端功能不可用：node-pty 原生模块未加载' }));
      ws.close();
      return;
    }

    const url = new URL(request.url ?? '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    const cols = parseInt(url.searchParams.get('cols') ?? '80', 10);
    const rows = parseInt(url.searchParams.get('rows') ?? '24', 10);

    if (!projectId) {
      ws.send(JSON.stringify({ type: 'error', message: '缺少 projectId' }));
      ws.close();
      return;
    }

    // 注册客户端到项目
    let clients = projectClients.get(projectId);
    if (!clients) {
      clients = new Set();
      projectClients.set(projectId, clients);
    }
    clients.add(ws);

    // 查找或创建终端会话
    let session = findSessionByProject!(projectId);
    if (!session) {
      session = createSession!(projectId, cols, rows);
    }

    // 绑定 pty 事件监听器（仅首次）
    attachSessionListeners(session);

    ws.send(JSON.stringify({ type: 'connected', sessionId: session.id }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg.type === 'data' && typeof msg.data === 'string') {
          const currentSession = findSessionByProject!(projectId);
          if (currentSession) {
            currentSession.pty.write(msg.data as string);
            currentSession.lastActivity = Date.now();
          }
        }
        if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
          const currentSession = findSessionByProject!(projectId);
          if (currentSession) {
            currentSession.pty.resize(msg.cols as number, msg.rows as number);
            currentSession.lastActivity = Date.now();
          }
        }
      } catch {
        // 忽略解析错误
      }
    });

    ws.on('close', () => {
      const c = projectClients.get(projectId);
      if (c) {
        c.delete(ws);
        if (c.size === 0) {
          projectClients.delete(projectId);
        }
      }
    });
  });
}

/**
 * 关闭 WebSocket 服务器
 */
export function closeTerminalWebSocket(): void {
  if (wss) {
    wss.close();
    wss = null;
  }
  projectClients.clear();
  sessionListenersAttached.clear();
}

/**
 * 检查 node-pty 是否可用
 */
export function isPtyAvailable(): boolean {
  return ptyAvailable;
}
