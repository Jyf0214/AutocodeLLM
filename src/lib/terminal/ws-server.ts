import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { createSession, findSessionByWorkspace, destroySession } from './session-manager';

let wss: WebSocketServer | null = null;

/**
 * 初始化 WebSocket 服务器
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

    let session = findSessionByWorkspace(workspaceId);
    session ??= createSession(workspaceId, cols, rows);

    ws.send(JSON.stringify({ type: 'connected', sessionId: session.id }));

    session.pty.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'data', data }));
      }
    });

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;

        if (msg.type === 'data' && typeof msg.data === 'string') {
          session.pty.write(msg.data);
          session.lastActivity = Date.now();
        }

        if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
          session.pty.resize(msg.cols, msg.rows);
          session.lastActivity = Date.now();
        }
      } catch {
        // 忽略解析错误
      }
    });

    ws.on('close', () => {
      // 不立即销毁会话，保留一段时间供重连
    });

    session.pty.onExit(({ exitCode }) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'exit', exitCode }));
      }
      destroySession(session.id);
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
}
