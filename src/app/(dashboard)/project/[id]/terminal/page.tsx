'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Flexbox, Text } from '@/lib/ui';
import { ArrowLeftOutlined, ExpandOutlined, CompressOutlined, ReloadOutlined } from '@ant-design/icons';
import type { Terminal as XTermType } from 'xterm';
import type { FitAddon as FitAddonType } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';

export default function ProjectTerminalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<XTermType | null>(null);
  const fitAddonRef = useRef<FitAddonType | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  const connectTerminal = useCallback(() => {
    if (!projectId) return;

    console.log('[terminal-page] 开始连接:', { projectId });
    setError(null);
    setConnecting(true);
    setIsConnected(false);

    // 关闭已有连接
    if (wsRef.current) {
      console.log('[terminal-page] 关闭已有 WebSocket 连接');
      wsRef.current.close();
      wsRef.current = null;
    }

    // 获取当前终端实际尺寸
    const term = terminalInstanceRef.current;
    const cols = term?.cols ?? 80;
    const rows = term?.rows ?? 24;

    // 使用当前页面的 origin 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/terminal/ws?projectId=${encodeURIComponent(projectId)}&cols=${String(cols)}&rows=${String(rows)}`;
    console.log('[terminal-page] WebSocket URL:', wsUrl, { cols, rows });

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[terminal-page] WebSocket 已打开');
      setConnecting(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        console.log('[terminal-page] 收到消息:', msg);
        if (msg.type === 'connected') {
          setIsConnected(true);
          setConnecting(false);
        } else if (msg.type === 'error') {
          console.log('[terminal-page] 错误消息:', msg.message);
          setError(msg.message as string);
          setConnecting(false);
        } else if (msg.type === 'data') {
          terminalInstanceRef.current?.write(msg.data as string);
        } else if (msg.type === 'exit') {
          const exitCode = msg.exitCode as number;
          console.log('[terminal-page] 终端退出:', { exitCode });
          terminalInstanceRef.current?.write(`\r\n终端已退出 (退出码: ${String(exitCode)})\r\n`);
          setIsConnected(false);
        }
      } catch {
        console.log('[terminal-page] 消息解析失败:', event.data);
      }
    };

    ws.onclose = (evt) => {
      console.log('[terminal-page] WebSocket 已关闭:', { code: evt.code, reason: evt.reason });
      setIsConnected(false);
      setConnecting(false);
    };

    ws.onerror = (evt) => {
      console.log('[terminal-page] WebSocket 错误:', evt);
      setError('WebSocket 连接失败');
      setConnecting(false);
    };
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !terminalRef.current) return;

    let disposed = false;

    (async () => {
      const [{ Terminal }, { FitAddon }] = await Promise.all([
        import('xterm'),
        import('xterm-addon-fit'),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- disposed 由 cleanup 函数异步置为 true，TypeScript 无法追踪
      if (disposed || !terminalRef.current) return;

      const terminal = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: 'Menlo, Monaco, "Courier New", monospace',
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#d4d4d4',
          selectionBackground: '#264f78',
          black: '#1e1e1e',
          red: '#f44747',
          green: '#6a9955',
          yellow: '#d7ba7d',
          blue: '#569cd6',
          magenta: '#c586c0',
          cyan: '#4dc9b0',
          white: '#d4d4d4',
          brightBlack: '#808080',
          brightRed: '#f44747',
          brightGreen: '#6a9955',
          brightYellow: '#d7ba7d',
          brightBlue: '#569cd6',
          brightMagenta: '#c586c0',
          brightCyan: '#4dc9b0',
          brightWhite: '#ffffff',
        },
      });

      const fitAddon = new FitAddon();
      terminal.loadAddon(fitAddon);

      terminalInstanceRef.current = terminal;
      fitAddonRef.current = fitAddon;

      terminal.open(terminalRef.current);
      fitAddon.fit();

      // 连接 WebSocket
      connectTerminal();

      // 终端输入发送到 WebSocket
      terminal.onData((data) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'data', data }));
        }
      });

      // 窗口大小变化时重新 fit
      const handleResize = () => {
        fitAddon.fit();
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const { cols, rows } = terminal;
          wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
        }
      };
      window.addEventListener('resize', handleResize);

      // 存储 cleanup 函数
      (terminal as any)._cleanup = () => {
        window.removeEventListener('resize', handleResize);
        terminal.dispose();
      };
    })();

    return () => {
      disposed = true;
      const term = terminalInstanceRef.current;
      if (term && typeof (term as any)._cleanup === 'function') {
        (term as any)._cleanup();
      } else {
        term?.dispose();
      }
      terminalInstanceRef.current = null;
      wsRef.current?.close();
    };
  }, [projectId, connectTerminal]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
    setTimeout(() => {
      fitAddonRef.current?.fit();
      if (wsRef.current?.readyState === WebSocket.OPEN && terminalInstanceRef.current) {
        const { cols, rows } = terminalInstanceRef.current;
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    }, 100);
  }, []);

  const handleReconnect = useCallback(() => {
    connectTerminal();
  }, [connectTerminal]);

  if (!projectId) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Text>{'项目 ID 不存在'}</Text>
      </Flexbox>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: isFullscreen ? '100vh' : 'calc(100vh - 120px)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: isFullscreen ? 9999 : 'auto',
        background: isFullscreen ? 'rgba(0,0,0,0.6)' : 'transparent',
        justifyContent: isFullscreen ? 'center' : 'flex-start',
        alignItems: isFullscreen ? 'center' : 'stretch',
        padding: isFullscreen ? 24 : 0,
      }}
    >
      {/* 全屏终端卡片 */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          ...(isFullscreen
            ? { width: 'calc(100% - 48px)', maxWidth: 1200, height: 'calc(100% - 48px)', maxHeight: 900 }
            : { flex: 1 }),
          background: '#1e1e1e',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* 顶部工具栏 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            background: '#2d2d2d',
            borderBottom: '1px solid #3e3e3e',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => router.back()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 13,
                color: '#d4d4d4',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.background = '#3e3e3e';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.background = 'none';
              }}
            >
              <ArrowLeftOutlined style={{ fontSize: 12 }} />
              返回
            </button>
            <Text style={{ color: '#d4d4d4', fontSize: 14 }}>终端</Text>
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: isConnected ? '#4caf50' : connecting ? '#ff9800' : '#f44747',
              }}
              title={isConnected ? '已连接' : connecting ? '连接中' : '未连接'}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!isConnected && !connecting && (
              <button
                onClick={handleReconnect}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                  color: '#d4d4d4',
                  background: '#3e3e3e',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 4,
                }}
              >
                <ReloadOutlined />
                重新连接
              </button>
            )}
            <button
              onClick={toggleFullscreen}
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: 14,
                color: '#d4d4d4',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 4,
              }}
              onMouseEnter={(e) => {
                (e.currentTarget).style.background = '#3e3e3e';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget).style.background = 'none';
              }}
            >
              {isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            </button>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div
            style={{
              padding: '8px 16px',
              background: '#3e2723',
              color: '#f44747',
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* 终端容器 */}
        <div ref={terminalRef} style={{ flex: 1, overflow: 'hidden' }} />
      </div>
    </div>
  );
}
