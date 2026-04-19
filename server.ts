import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

const port = parseInt(process.env.PORT || '7860', 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev });
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url!, true);
  handle(req, res, parsedUrl);
});

// 集成终端 WebSocket 服务（node-pty 不可用时优雅降级）
let initTerminalWebSocket: ((server: import('http').Server) => void) | null = null;
let closeTerminalWebSocket: (() => void) | null = null;
let isPtyAvailable: (() => boolean) | null = null;

try {
  const wsServer = await import('@/lib/terminal/ws-server');
  initTerminalWebSocket = wsServer.initTerminalWebSocket;
  closeTerminalWebSocket = wsServer.closeTerminalWebSocket;
  isPtyAvailable = wsServer.isPtyAvailable;
  initTerminalWebSocket!(server);
  console.log('✅ 终端 WebSocket 服务已启动');
} catch (error) {
  console.warn('⚠ 终端 WebSocket 服务不可用:', (error as Error).message);
  console.warn('  终端功能已禁用，其他功能不受影响');
}

app.prepare().then(() => {
  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
});

// 优雅退出
process.on('SIGTERM', () => {
  closeTerminalWebSocket?.();
  server.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  closeTerminalWebSocket?.();
  server.close();
  process.exit(0);
});
