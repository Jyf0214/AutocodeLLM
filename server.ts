import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';

const port = parseInt(process.env.PORT || '7860', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
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

  ws.on('close', () => {
    const c = workspaceClients.get(workspaceId);
    if (c) {
      c.delete(ws);
      if (c.size === 0) {
        workspaceClients.delete(workspaceId);
      }
    }
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

app.prepare().then(() => {
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});