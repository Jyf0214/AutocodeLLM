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

export default function TerminalPanel({ workspaceId }: TerminalPanelProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const connectTerminal = useCallback(() => {
    if (!terminalRef.current) return;

    setConnecting(true);

    const term = new Terminal({
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

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termRef.current = term;
    fitAddonRef.current = fitAddon;

    term.writeln('\x1b[1;32m[终端已连接] 工作区: ' + workspaceId + '\x1b[0m');
    term.writeln('\x1b[33m提示: 当前为本地模拟终端，完整功能需配置 WebSocket 后端\x1b[0m');
    term.writeln('');

    let commandBuffer = '';
    const commandHistory: string[] = [];
    let historyIndex = -1;

    const prompt = () => {
      term.write('\r\n\x1b[1;34muser@autocodellm\x1b[0m:\x1b[1;36m~\x1b[0m$ ');
    };

    term.onKey(({ domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.key === 'Enter') {
        term.writeln('');

        const trimmed = commandBuffer.trim();
        if (trimmed) {
          commandHistory.unshift(trimmed);
          if (commandHistory.length > 50) commandHistory.pop();
          historyIndex = -1;

          const lower = trimmed.toLowerCase();
          if (lower === 'clear' || lower === 'cls') {
            term.clear();
          } else if (lower === 'help') {
            term.writeln('\x1b[1;33m可用命令:\x1b[0m');
            term.writeln('  help     - 显示帮助信息');
            term.writeln('  clear    - 清屏');
            term.writeln('  ls       - 列出文件');
            term.writeln('  pwd      - 显示当前目录');
            term.writeln('  whoami   - 显示当前用户');
            term.writeln('  date     - 显示日期时间');
            term.writeln('  echo     - 输出文本');
            term.writeln('  history  - 显示命令历史');
          } else if (lower === 'ls') {
            term.writeln('\x1b[1;34msrc/\x1b[0m    \x1b[1;34mprisma/\x1b[0m    \x1b[1;34mpublic/\x1b[0m    package.json    README.md');
          } else if (lower === 'pwd') {
            term.writeln('/home/user/workspace/' + workspaceId);
          } else if (lower === 'whoami') {
            term.writeln('user');
          } else if (lower === 'date') {
            term.writeln(new Date().toLocaleString('zh-CN'));
          } else if (lower.startsWith('echo ')) {
            term.writeln(trimmed.slice(5));
          } else if (lower === 'history') {
            commandHistory.slice().reverse().forEach((cmd, i) => {
              term.writeln('  ' + String(i + 1) + '  ' + cmd);
            });
          } else {
            term.writeln('\x1b[31m命令未找到: ' + trimmed + '\x1b[0m');
            term.writeln('输入 \x1b[1;33mhelp\x1b[0m 查看可用命令');
          }
        }

        commandBuffer = '';
        prompt();
      } else if (domEvent.key === 'Backspace') {
        if (commandBuffer.length > 0) {
          commandBuffer = commandBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (domEvent.key === 'ArrowUp') {
        if (commandHistory.length > 0 && historyIndex < commandHistory.length - 1) {
          historyIndex++;
          const prevCmd = commandHistory[historyIndex] ?? '';
          term.write('\r\x1b[K');
          term.write('\x1b[1;34muser@autocodellm\x1b[0m:\x1b[1;36m~\x1b[0m$ ' + prevCmd);
          commandBuffer = prevCmd;
        }
      } else if (domEvent.key === 'ArrowDown') {
        if (historyIndex > 0) {
          historyIndex--;
          const nextCmd = commandHistory[historyIndex] ?? '';
          term.write('\r\x1b[K');
          term.write('\x1b[1;34muser@autocodellm\x1b[0m:\x1b[1;36m~\x1b[0m$ ' + nextCmd);
          commandBuffer = nextCmd;
        } else {
          historyIndex = -1;
          commandBuffer = '';
          term.write('\r\x1b[K');
          prompt();
        }
      } else if (printable) {
        commandBuffer += domEvent.key;
        term.write(domEvent.key);
      }
    });

    prompt();
    setConnected(true);
    setConnecting(false);

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [workspaceId]);

  useEffect(() => {
    connectTerminal();

    return () => {
      termRef.current?.dispose();
    };
  }, [connectTerminal]);

  const handleReconnect = useCallback(() => {
    termRef.current?.dispose();
    setConnected(false);
    connectTerminal();
  }, [connectTerminal]);

  const handleDisconnect = useCallback(() => {
    termRef.current?.dispose();
    termRef.current = null;
    setConnected(false);
  }, []);

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
