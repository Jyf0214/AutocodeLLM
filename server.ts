// 应用入口：保留 Next.js 默认启动横幅，同时注入终端 WebSocket
// 通过在 http/https.createServer 上拦截，在 Next.js 创建 HTTP 服务器时挂载 WS upgrade
import http from 'node:http';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const __require = (id: string) => import(/* @vite-ignore */ id).then(m => m.default || m);

let closeTerminalWebSocket: (() => void) | null = null;

function injectTerminalWS(target: { createServer: Function }) {
  const orig = target.createServer;
  target.createServer = function patchedCreateServer(this: any, ...args: any[]) {
    const server = orig.apply(this, args);
    import('./src/lib/terminal/ws-server.ts').then((ws) => {
      closeTerminalWebSocket = ws.closeTerminalWebSocket ?? null;
      ws.initTerminalWebSocket(server);
    }).catch((e: any) => {
      console.warn('  ⚠ Terminal WebSocket unavailable:', e.message);
    });
    return server;
  } as typeof target.createServer;
}

injectTerminalWS(http);
injectTerminalWS(https);

process.on('SIGTERM', () => { closeTerminalWebSocket?.(); process.exit(0); });
process.on('SIGINT', () => { closeTerminalWebSocket?.(); process.exit(0); });

// 委托给 Next.js 独立服务器（触发默认 banner + 全部路由）
const serverPath = path.join(__dirname, '.next/standalone/server.js');
import(/* webpackIgnore: true */ serverPath).catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
