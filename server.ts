/**
 * 应用生产服务器入口
 *
 * 自定义 HTTP 服务器，挂载 Next.js 请求处理器和终端 WebSocket
 * 使用标准 next({ dev: false }) + app.prepare() 模式
 */

import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? '', true);
  handle(req, res, parsedUrl);
});

// 集成终端 WebSocket 服务（node-pty 不可用时优雅降级）
let closeTerminalWebSocket: (() => void) | null = null;

try {
  const wsServer = await import('@/lib/terminal/ws-server');
  closeTerminalWebSocket = wsServer.closeTerminalWebSocket ?? null;
  wsServer.initTerminalWebSocket(server);
  console.log('✅ 终端 WebSocket 服务已启动');
} catch (error) {
  console.warn('⚠ 终端 WebSocket 服务不可用:', (error as Error).message);
  console.warn('  终端功能已禁用，其他功能不受影响');
}

await app.prepare();

server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port} (${dev ? 'development' : 'production'})`);
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
