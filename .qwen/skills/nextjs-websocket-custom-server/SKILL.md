---
name: nextjs-websocket-custom-server
description: How to integrate WebSocket (ws) with a Next.js custom HTTP server without upgrade handler conflict caused by Next.js internal setupWebSocketHandler
source: auto-skill
extracted_at: '2026-05-29T23:54:36.299Z'
---

# Next.js Custom Server + WebSocket Integration

## Problem

When using a custom HTTP server with Next.js (standard `next()` + `app.getRequestHandler()` pattern), Next.js internally calls `setupWebSocketHandler` on the first request, which registers an `upgrade` event listener on the same HTTP server. This upgrade handler calls `resolveRoutes` and then `socket.end()` on matched Next.js routes — **killing any WebSocket connection your own handler has already upgraded**.

## Root Cause

Inside `NextCustomServer.setupWebSocketHandler()` (in `node_modules/next/dist/server/next.js`):

```js
setupWebSocketHandler(customServer, _req) {
    if (!this.didWebSocketSetup) {
        this.didWebSocketSetup = true;
        customServer = customServer || _req.socket.server;
        if (customServer) {
            customServer.on('upgrade', async (req, socket, head) => {
                this.upgradeHandler(req, socket, head);
            });
        }
    }
}
```

This registers a **second** `upgrade` listener on your real HTTP server. When a WebSocket upgrade request arrives:
1. Your `wss.handleUpgrade()` sends 101 Switching Protocols ✓
2. Next.js's `upgradeHandler()` then runs — finds a matched route → calls `socket.end()` → kills the WebSocket ✗

The `getRequestHandler()` triggers this on every request:
```js
getRequestHandler() {
    return async (req, res, parsedUrl) => {
        this.setupWebSocketHandler(this.options.httpServer, req);
        return this.requestHandler(req, res);
    };
}
```

## Solution: Dummy HTTP Server Trick

Pass a **dummy HTTP server** as `httpServer` in Next.js options. Next.js registers its conflicting upgrade listener on the dummy server instead of your real one. The dummy server never listens on any port, so its upgrade handler has no effect.

```typescript
import { createServer } from 'node:http';
import { parse } from 'node:url';
import next from 'next';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';

// Create a dummy HTTP server to absorb Next.js's upgrade listener.
// This prevents Next.js from adding its conflicting upgrade handler
// to our real server. The dummy server never listens on any port.
const dummyServer = createServer();

const app = next({ dev, dir: __dirname, httpServer: dummyServer } as any);
const handle = app.getRequestHandler();

const server = createServer((req, res) => {
  const parsedUrl = parse(req.url ?? '', true);
  handle(req, res, parsedUrl);
});

// Initialize WebSocket BEFORE app.prepare() so YOUR upgrade handler
// is registered first. The dummyServer absorbs Next.js's handler.
initTerminalWebSocket(server);

await app.prepare();
server.listen(port, () => {
  console.log(`> Ready on http://localhost:${port}`);
});

// Clean up both servers on exit
process.on('SIGTERM', () => {
  closeTerminalWebSocket?.();
  dummyServer.close();
  server.close();
  process.exit(0);
});
```

## Key Points

1. **`httpServer: dummyServer`** — This is the core fix. Passed as part of `next({ ... })` options. Next.js stores it as `this.options.httpServer` and uses it in `setupWebSocketHandler`.

2. **`as any` cast** — The `httpServer` option is not part of Next.js's public TypeScript types, so a cast is needed.

3. **Registration order** — Initialize your WebSocket handler (`initTerminalWebSocket(server)`) **before** `app.prepare()` and **before** the first request. This ensures your upgrade listener is registered on the real server before any request triggers `setupWebSocketHandler`.

4. **How it works**: `setupWebSocketHandler` checks `this.options.httpServer` first. Since it's truthy (the dummy server), it adds the upgrade handler to the dummy server. The fallback `_req.socket.server` (the real server) is never reached.

5. **Dummy server lifetime** — Close the dummy server on shutdown alongside the real server, otherwise Node.js keeps the process alive.

## Alternative Approaches Considered

| Approach | Pro | Con |
|----------|-----|-----|
| **Override `setupWebSocketHandler`** | No dummy server needed | Monkey-patches internal method |
| **Dummy HTTP server (chosen)** | Clean, non-invasive, works with any Next.js version | Requires `as any` type cast |
| **Separate port for WebSocket** | No conflict at all | Can't use on single-port environments (HF Spaces, Cloud Run) |
| **Remove `setupWebSocketHandler` via reflection** | Direct | Very fragile, breaks on version bumps |

## Verification

Test with a WebSocket client:
```bash
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000/api/terminal/ws?projectId=test');
ws.on('open', () => { console.log('WS OPENED'); ws.close(); });
ws.on('error', (err) => { console.log('Error:', err.message); });
ws.on('close', (code, reason) => { console.log('Closed:', code, reason.toString()); });
"
```

Expected: `WS OPENED` followed by normal close. If you see `Closed: 1006` (abnormal close), Next.js's upgrade handler is still interfering.

## Compatibility

Tested with: Next.js 16 (16.2.6), `ws` library, `node-pty`. May work with earlier versions that have `setupWebSocketHandler` in `NextCustomServer`.
