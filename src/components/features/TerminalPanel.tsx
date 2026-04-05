'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Flexbox, Text, Button } from '@lobehub/ui';
import { PoweroffOutlined, ReloadOutlined } from '@ant-design/icons';
import 'xterm/css/xterm.css';

interface TerminalPanelProps {
  workspaceId: string;
}

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_BASE_DELAY = 1000;

function getWebSocketUrl(workspaceId: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/api/terminal?workspaceId=${encodeURIComponent(workspaceId)}`;
}

export default function TerminalPanel({ workspaceId }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const connectRef = useRef<(() => void) | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const cleanup = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const connectTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    cleanup();
    setConnecting(true);
    reconnectAttemptsRef.current = 0;

    let term = termRef.current;
    let fitAddon = fitAddonRef.current;

    if (!term) {
      term = new Terminal({
        cursorBlink: true,
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        theme: {
          background: '#1e1e1e',
          foreground: '#d4d4d4',
          cursor: '#aeafad',
          black: '#000000',
          red: '#cd3131',
          green: '#0dbc79',
          yellow: '#e5e510',
          blue: '#2472c8',
          magenta: '#bc3fbc',
          cyan: '#11a8cd',
          white: '#e5e5e5',
          brightBlack: '#666666',
          brightRed: '#f14c4c',
          brightGreen: '#23d18b',
          brightYellow: '#f5f543',
          brightBlue: '#3b8eea',
          brightMagenta: '#d670d6',
          brightCyan: '#29b8db',
          brightWhite: '#e5e5e5',
        },
        allowProposedApi: true,
      });

      fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      term.open(terminalRef.current);
      fitAddon.fit();

      termRef.current = term;
      fitAddonRef.current = fitAddon;

      term.onData((data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'data', data }));
        }
      });
    }

    if (!fitAddon) return;

    term.clear();
    term.writeln('\x1b[33m正在连接终端...\x1b[0m');

    const ws = new WebSocket(getWebSocketUrl(workspaceId));
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      setConnecting(false);
      reconnectAttemptsRef.current = 0;
      term.writeln('\x1b[1;32m终端已连接\x1b[0m');

      fitAddon.fit();
      const { cols, rows } = term;
      ws.send(JSON.stringify({ type: 'resize', cols, rows }));
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message: { type: string; data: unknown } = JSON.parse(event.data as string);
        if (message.type === 'data' && typeof message.data === 'string') {
          term.write(message.data);
        }
      } catch {
        const rawData = event.data;
        if (typeof rawData === 'string') {
          term.write(rawData);
        }
      }
    };

    ws.onclose = () => {
      setConnected(false);
      setConnecting(false);

      const attempts = reconnectAttemptsRef.current;
      if (attempts < MAX_RECONNECT_ATTEMPTS) {
        const delay = RECONNECT_BASE_DELAY * 2 ** attempts;
        reconnectAttemptsRef.current = attempts + 1;

        term.writeln(
          '\x1b[33m连接已断开，' +
            String(delay / 1000) +
            '秒后尝试重连 (' +
            String(attempts + 1) +
            '/' +
            String(MAX_RECONNECT_ATTEMPTS) +
            ')...\x1b[0m',
        );

        reconnectTimerRef.current = setTimeout(() => {
          connectRef.current?.();
        }, delay);
      } else {
        term.writeln('\x1b[31m连接已断开，重连次数已达上限，请手动重连\x1b[0m');
      }
    };

    ws.onerror = () => {
      setConnecting(false);
    };

    const handleResize = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        fitAddon.fit();
        const { cols, rows } = term;
        wsRef.current.send(JSON.stringify({ type: 'resize', cols, rows }));
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(terminalRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [workspaceId, cleanup]);

  useEffect(() => {
    connectRef.current = connectTerminal;
    const timer = setTimeout(() => connectTerminal(), 0);

    return () => {
      clearTimeout(timer);
      cleanup();
      termRef.current?.dispose();
      termRef.current = null;
    };
  }, [connectTerminal, cleanup]);

  const handleReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setConnected(false);
    connectTerminal();
  }, [connectTerminal]);

  const handleDisconnect = useCallback(() => {
    cleanup();
    termRef.current?.dispose();
    termRef.current = null;
    setConnected(false);
  }, [cleanup]);

  return (
    <Flexbox style={{ height: '100%', flexDirection: 'column' }}>
      <Flexbox
        horizontal
        justify="space-between"
        align="center"
        style={{
          padding: '8px 12px',
          background: 'var(--color-bg-layout)',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <Flexbox horizontal gap={8} align="center">
          <Text style={{ fontSize: 12, fontWeight: 600 }}>
            {connected ? '🟢 已连接' : connecting ? '🟡 连接中...' : '🔴 已断开'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            工作区: {workspaceId}
          </Text>
        </Flexbox>
        <Flexbox horizontal gap={8}>
          <Button
            size="small"
            icon={ReloadOutlined}
            onClick={handleReconnect}
            disabled={!connected && !connecting}
          >
            重连
          </Button>
          <Button
            size="small"
            danger
            icon={PoweroffOutlined}
            onClick={handleDisconnect}
            disabled={!connected}
          >
            断开
          </Button>
        </Flexbox>
      </Flexbox>
      <div
        ref={terminalRef}
        style={{
          flex: 1,
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
        }}
      />
    </Flexbox>
  );
}
