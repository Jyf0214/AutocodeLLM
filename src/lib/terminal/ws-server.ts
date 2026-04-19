import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import {
  createSession,
  findSessionByWorkspace,
  getSession,
  destroySession,
  type TerminalSession,
} from './session-manager';

let wss: WebSocketServer | null = null;

// 工作区 → WebSocket 客户端集合
const workspaceClients = new Map<string, Set<WebSocket>>();

// 会话 → pty 事件监听器已绑定标记
const sessionListenersAttached = new Set<string>();

/**
 * 向工作区所有客户端广播消息
 */
function broadcastToWorkspace(workspaceId: string, message: string, exclude?: WebSocket): void {
  const clients = workspaceClients.get(workspaceId);
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
function attachSessionListeners(session: TerminalSession): void {
  if (sessionListenersAttached.has(session.id)) return;
  sessionListenersAttached.add(session.id);

  session.pty.onData((data) => {
    const msg = JSON.stringify({ type: 'data', data });
    broadcastToWorkspace(session.workspaceId, msg);
  });

  session.pty.onExit(({ exitCode }) => {
    const msg = JSON.stringify({ type: 'exit', exitCode });
    broadcastToWorkspace(session.workspaceId, msg);
    sessionListenersAttached.delete(session.id);
    destroySession(session.id);
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
    const url = new URL(request.url ?? '', 'http://localhost');
    const workspaceId = url.searchParams.get('workspaceId');
    const cols = parseInt(url.searchParams.get('cols') ?? '80', 10);
    const rows = parseInt(url.searchParams.get('rows') ?? '24', 10);

    if (!workspaceId) {
      ws.send(JSON.stringify({ type: 'error', message: '缺少 workspaceId' }));
      ws.close();
      return;
    }

    // 注册客户端到工作区
    let clients = workspaceClients.get(workspaceId);
    if (!clients) {
      clients = new Set();
      workspaceClients.set(workspaceId, clients);
    }
    clients.add(ws);

    // 查找或创建终端会话
    let session = findSessionByWorkspace(workspaceId);
    if (!session) {
      session = createSession(workspaceId, cols, rows);
    }

    // 绑定 pty 事件监听器（仅首次）
    attachSessionListeners(session);

    ws.send(JSON.stringify({ type: 'connected', sessionId: session.id }));

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        if (msg.type === 'data' && typeof msg.data === 'string') {
          const currentSession = findSessionByWorkspace(workspaceId);
          if (currentSession) {
            currentSession.pty.write(msg.data as string);
            currentSession.lastActivity = Date.now();
          }
        }
        if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
          const currentSession = findSessionByWorkspace(workspaceId);
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
      const c = workspaceClients.get(workspaceId);
      if (c) {
        c.delete(ws);
        if (c.size === 0) {
          workspaceClients.delete(workspaceId);
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
  workspaceClients.clear();
  sessionListenersAttached.clear();
}
