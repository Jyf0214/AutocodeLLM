#!/usr/bin/env node

import { createServer } from 'http';
import { parse } from 'url';
import { WebSocketServer } from 'ws';

const PORT = process.env.TERMINAL_PORT || '7861';
const TERMINAL_WS_URL = process.env.TERMINAL_WS_URL || 'ws://localhost:7861';

const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Terminal WebSocket Server');
});

const wss = new WebSocketServer({ server, path: '/api/terminal/ws' });

const workspaceClients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '', `http://${req.headers.host}`);
  const workspaceId = url.searchParams.get('workspaceId');

  if (!workspaceId) {
    ws.close(1000, 'Missing workspaceId');
    return;
  }

  const clients = workspaceClients.get(workspaceId) || new Set();
  clients.add(ws);
  workspaceClients.set(workspaceId, clients);

  console.log(`终端连接: workspaceId=${workspaceId}, clients=${clients.size}`);

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

  ws.on('message', (data) => {
    const message = data.toString();
    try {
      const parsed = JSON.parse(message);
      if (parsed.type === 'resize') {
        return;
      }
    } catch {
      // 转发原始内容
    }
    broadcastToWorkspace(workspaceId, message, ws);
  });

  ws.on('error', (err) => {
    console.error(`终端错误: ${err.message}`);
  });
});

function broadcastToWorkspace(workspaceId: string, message: string, exclude?: WebSocket) {
  const clients = workspaceClients.get(workspaceId);
  if (!clients) return;

  clients.forEach((client) => {
    if (client !== exclude && client.readyState === 1) {
      client.send(message);
    }
  });
}

server.listen(PORT, () => {
  console.log(`🔌 终端 WebSocket 服务器运行在 ws://localhost:${PORT}/api/terminal/ws`);
  console.log(`   连接其他服务器: ${TERMINAL_WS_URL}`);
});