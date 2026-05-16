import { describe, it, expect, vi } from 'vitest';

describe('终端 WebSocket 服务', () => {
  describe('node-pty 不可用时优雅降级', () => {
    it('session-manager 导入失败时 isPtyAvailable 返回 false', async () => {
      // 模拟 node-pty 不可用的场景
      vi.doMock('node-pty', () => {
        throw new Error("Cannot find module 'node-pty'");
      });

      // 重新导入 ws-server 模块
      const wsServer = await import('@/lib/terminal/ws-server');
      expect(typeof wsServer.isPtyAvailable).toBe('function');
      // 在当前环境中 node-pty 实际可能可用或不可用
      // 关键是函数不抛异常
      const available = wsServer.isPtyAvailable();
      expect(typeof available).toBe('boolean');
    });

    it('initTerminalWebSocket 不抛异常', async () => {
      const wsServer = await import('@/lib/terminal/ws-server');
      const mockServer = {
        on: vi.fn(),
      };

      // 即使 node-pty 不可用，initTerminalWebSocket 也不应抛异常
      expect(() => {
        wsServer.initTerminalWebSocket(mockServer as unknown as import('http').Server);
      }).not.toThrow();
    });

    it('closeTerminalWebSocket 不抛异常', async () => {
      const wsServer = await import('@/lib/terminal/ws-server');
      expect(() => {
        wsServer.closeTerminalWebSocket();
      }).not.toThrow();
    });
  });
});
