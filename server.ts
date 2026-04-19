import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { initTerminalWebSocket, closeTerminalWebSocket } from '@/lib/terminal/ws-server';

const port = parseInt(process.env.PORT || '7860', 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
});

// 集成 node-pty 终端 WebSocket 服务
initTerminalWebSocket(server);

app.prepare().then(() => {
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

// 优雅退出
process.on('SIGTERM', () => {
  closeTerminalWebSocket();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  closeTerminalWebSocket();
  server.close();
  process.exit(0);
});
