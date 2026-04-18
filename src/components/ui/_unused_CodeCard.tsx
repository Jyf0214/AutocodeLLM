'use client';

import { useCallback, useState } from 'react';
import { Button, Tooltip, CodeEditor, CopyButton } from '@lobehub/ui';
import { DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';

interface CodeCardProps {
  code: string;
  language?: string;
  filename?: string;
  onCopy?: () => void;
  onDownload?: () => void;
  onRun?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export default function CodeCard({
  code,
  language = 'text',
  filename,
  onCopy,
  onDownload,
  onRun,
  actions,
  className,
}: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    setCopied(true);
    onCopy?.();
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [onCopy]);

  const lineCount = code.split('\n').length;

  return (
    <div
      className={className}
      style={{
        border: '1px solid var(--border-primary)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            {language}
          </span>
          {filename != null && (
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{filename}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {actions}
          <Tooltip title={copied ? '已复制' : '复制代码'}>
            <CopyButton content={code} onClick={handleCopy} />
          </Tooltip>
          {onDownload != null && (
            <Tooltip title="下载">
              <Button type="text" size="small" onClick={() => { onDownload(); }}>
                <DownloadOutlined />
              </Button>
            </Tooltip>
          )}
          {onRun != null && (
            <Tooltip title="运行">
              <Button type="text" size="small" onClick={() => { onRun(); }}>
                <PlayCircleOutlined />
              </Button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Code body */}
      <CodeEditor
        value={code}
        onValueChange={(newValue: string) => {
          // 只读模式，不处理值变更
          void newValue;
        }}
        language={language}
        height={Math.max(lineCount * 24 + 24, 120)}
        variant="borderless"
      />
    </div>
  );
}
