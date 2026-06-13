import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';

let wss: WebSocketServer | null = null;

let terminalAvailable = false;
let createSession: ((projectId: string, cols: number, rows: number) => import('./session-manager').TerminalSession) | null = null;
let findSessionByProject: ((projectId: string) => import('./session-manager').TerminalSession | null) | null = null;
let destroySession: ((sessionId: string) => void) | null = null;

try {
  const sessionManager = await import('./session-manager');
  // 无论 node-pty 是否可用，都暴露会话函数（内部会回退到 spawn 模式）
  createSession = sessionManager.createSession;
  findSessionByProject = sessionManager.findSessionByProject;
  destroySession = sessionManager.destroySession;
  terminalAvailable = true;
  const mode = sessionManager.isPtyLoaded() ? 'node-pty' : 'spawn(回退)';
  console.log(`[ws-server] 终端会话管理器已加载，当前模式: ${mode}`);
} catch (error) {
  console.warn('⚠ 终端会话管理器加载失败，终端功能已禁用:', (error as Error).message);
}

const projectClients = new Map<string, Set<WebSocket>>();
const sessionListenersAttached = new Set<string>();
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

function broadcastToProject(projectId: string, message: string, exclude?: WebSocket): void {
  const clients = projectClients.get(projectId);
  if (!clients) return;
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

function attachSessionListeners(session: import('./session-manager').TerminalSession): void {
  if (sessionListenersAttached.has(session.id)) return;
  sessionListenersAttached.add(session.id);

  console.log('[ws-server] 附加会话监听器:', { sessionId: session.id, projectId: session.projectId });

  session.terminal.onData((data) => {
    console.log('[ws-server] 终端数据输出:', JSON.stringify(data.slice(0, 80)));
    const msg = JSON.stringify({ type: 'data', data });
    broadcastToProject(session.projectId, msg);
  });

  session.terminal.onExit(({ exitCode, signal }) => {
    console.log('[ws-server] 终端进程退出:', { sessionId: session.id, projectId: session.projectId, exitCode, signal });
    const msg = JSON.stringify({ type: 'exit', exitCode, signal });
    broadcastToProject(session.projectId, msg);
    sessionListenersAttached.delete(session.id);
    destroySession!(session.id);
  });
}

function attachClientSession(
  ws: WebSocket,
  projectId: string,
  cols: number,
  rows: number,
): void {
  console.log('[ws-server] 附加客户端会话:', { projectId, cols, rows });

  let clients = projectClients.get(projectId);
  if (!clients) {
    clients = new Set();
    projectClients.set(projectId, clients);
  }
  clients.add(ws);

  let session = findSessionByProject!(projectId);
  if (!session) {
    console.log('[ws-server] 未找到现将会话，创建新会话');
    session = createSession!(projectId, cols, rows);
  } else {
    console.log('[ws-server] 复用现有会话:', { sessionId: session.id });
  }

  attachSessionListeners(session);
  ws.send(JSON.stringify({ type: 'connected', sessionId: session.id }));

  ws.on('message', (raw: Buffer) => {
    try {
      const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
      console.log('[ws-server] 收到客户端消息:', msg);
      if (msg.type === 'data' && typeof msg.data === 'string') {
        const currentSession = findSessionByProject!(projectId);
        if (currentSession) {
          currentSession.terminal.write(msg.data as string);
          currentSession.lastActivity = Date.now();
        }
      }
      if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
        const currentSession = findSessionByProject!(projectId);
        if (currentSession) {
          currentSession.terminal.resize(msg.cols as number, msg.rows as number);
          currentSession.lastActivity = Date.now();
        }
      }
    } catch {
      console.log('[ws-server] 消息解析失败:', raw.toString().slice(0, 200));
    }
  });

  ws.on('close', () => {
    console.log('[ws-server] 客户端断开:', { projectId });
    const c = projectClients.get(projectId);
    if (c) {
      c.delete(ws);
      if (c.size === 0) {
        console.log('[ws-server] 项目无客户端，清理项目连接:', { projectId });
        projectClients.delete(projectId);
        // 清理会话监听器标记，防止内存泄漏
        if (destroySession) {
          const session = findSessionByProject!(projectId);
          if (session) {
            sessionListenersAttached.delete(session.id);
          }
        }
      }
    }
  });
}

export function initTerminalWebSocket(server: Server): void {
  console.log('[ws-server] 初始化终端 WebSocket 服务...', { terminalAvailable });
  wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    if (url.pathname.startsWith('/api/terminal/ws')) {
      console.log('[ws-server] 收到升级请求:', { pathname: url.pathname, search: url.search });
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request);
      });
    }
  });

  wss.on('connection', (ws, request) => {
    const url = new URL(request.url ?? '', 'http://localhost');
    const projectId = url.searchParams.get('projectId');
    const cols = parseInt(url.searchParams.get('cols') ?? '80', 10);
    const rows = parseInt(url.searchParams.get('rows') ?? '24', 10);
    console.log('[ws-server] WebSocket 连接:', { url: request.url, projectId, cols, rows });

    // 心跳检测
    (ws as any).__alive = true;
    ws.on('pong', () => {
      (ws as any).__alive = true;
    });

    if (!terminalAvailable) {
      console.log('[ws-server] pty 不可用，拒绝连接');
      ws.send(JSON.stringify({ type: 'error', message: '终端功能不可用：node-pty 原生模块未加载' }));
      ws.close();
      return;
    }

    if (!projectId) {
      console.log('[ws-server] 缺少 projectId，拒绝连接');
      ws.send(JSON.stringify({ type: 'error', message: '缺少 projectId' }));
      ws.close();
      return;
    }

    console.log('[ws-server] 初始化客户端会话...');
    attachClientSession(ws, projectId, cols, rows);
  });

  // 心跳定时器: 每 30 秒检测不活跃连接并关闭
  heartbeatTimer = setInterval(() => {
    wss!.clients.forEach((ws) => {
      if ((ws as any).__alive === false) {
        ws.terminate();
        return;
      }
      (ws as any).__alive = false;
      ws.ping();
    });
  }, 30000);
}

/**
 * 供 next-ws UPGRADE 调用的连接处理函数
 */
export function handleTerminalUpgrade(
  client: WebSocket,
  projectId: string | null,
  cols: number,
  rows: number,
): void {
  if (!terminalAvailable) {
    client.send(JSON.stringify({ type: 'error', message: '终端功能不可用：node-pty 原生模块未加载' }));
    client.close();
    return;
  }

  if (!projectId) {
    client.send(JSON.stringify({ type: 'error', message: '缺少 projectId' }));
    client.close();
    return;
  }

  attachClientSession(client, projectId, cols, rows);
}

export function closeTerminalWebSocket(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (wss) {
    wss.close();
    wss = null;
  }
  projectClients.clear();
  sessionListenersAttached.clear();
}

export function isTerminalAvailable(): boolean {
  return terminalAvailable;
}

// 向后兼容
export const isPtyAvailable = isTerminalAvailable;
