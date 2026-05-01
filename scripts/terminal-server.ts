#!/usr/bin/env bun
/**
 * 独立终端 WebSocket 服务器
 * 用于开发调试或独立部署终端服务
 * 注意：需要 node-pty 原生模块可用
 */
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';

// node-pty 延迟加载（原生模块可能不可用）
let ptyModule: typeof import('node-pty') | null = null;
try {
  ptyModule = require('node-pty');
} catch {
  console.error('✗ node-pty 原生模块不可用，独立终端服务器无法启动');
  console.error('  请确保已安装编译工具链（build-essential, python3）后重新安装依赖');
  process.exit(1);
}

const PORT = process.env.TERMINAL_PORT || '7861';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Terminal WebSocket Server');
});

const wss = new WebSocketServer({ noServer: true });

// 会话管理
const sessions = new Map<string, { pty: import('node-pty').IPty; workspaceId: string; lastActivity: number }>();
const workspaceClients = new Map<string, Set<WebSocket>>();

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url ?? '', 'http://localhost');
  if (url.pathname.startsWith('/api/terminal/ws')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const workspaceId = url.searchParams.get('workspaceId');
  const cols = parseInt(url.searchParams.get('cols') ?? '80', 10);
  const rows = parseInt(url.searchParams.get('rows') ?? '24', 10);

  if (!workspaceId) {
    ws.close(1000, '缺少 workspaceId');
    return;
  }

  // 注册客户端
  let clients = workspaceClients.get(workspaceId);
  if (!clients) {
    clients = new Set();
    workspaceClients.set(workspaceId, clients);
  }
  clients.add(ws);

  // 查找或创建 pty 会话
  let session = sessions.get(workspaceId);
  if (!session) {
    const isDocker = process.env.RUNNING_IN_DOCKER === 'true';
    const basePath = isDocker ? '/home/node/.autocodellm/projects' : process.env.PROJECT_BASE_PATH ?? '/home/user/workspace';
    const ptyProcess = ptyModule!.spawn('bash', [], {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: basePath + '/' + workspaceId,
      env: process.env as Record<string, string>,
    });

    session = { pty: ptyProcess, workspaceId, lastActivity: Date.now() };
    sessions.set(workspaceId, session);

    ptyProcess.onData((data) => {
      const msg = JSON.stringify({ type: 'data', data });
      broadcastToWorkspace(workspaceId, msg);
    });

    ptyProcess.onExit(({ exitCode }) => {
      const msg = JSON.stringify({ type: 'exit', exitCode });
      broadcastToWorkspace(workspaceId, msg);
      sessions.delete(workspaceId);
    });

    console.log(`终端会话创建: workspaceId=${workspaceId}`);
  }

  ws.send(JSON.stringify({ type: 'connected' }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString()) as Record<string, unknown>;
      if (msg.type === 'data' && typeof msg.data === 'string') {
        session?.pty.write(msg.data as string);
        if (session) session.lastActivity = Date.now();
      }
      if (msg.type === 'resize' && typeof msg.cols === 'number' && typeof msg.rows === 'number') {
        session?.pty.resize(msg.cols as number, msg.rows as number);
        if (session) session.lastActivity = Date.now();
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
    console.log(`终端断开: workspaceId=${workspaceId}`);
  });

  ws.on('error', (err) => {
    console.error(`终端错误: ${err.message}`);
  });
});

function broadcastToWorkspace(workspaceId: string, message: string, exclude?: WebSocket) {
  const clients = workspaceClients.get(workspaceId);
  if (!clients) return;
  for (const client of clients) {
    if (client !== exclude && client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

server.listen(PORT, () => {
  console.log(`🔌 终端 WebSocket 服务器运行在 ws://localhost:${PORT}/api/terminal/ws`);
});
