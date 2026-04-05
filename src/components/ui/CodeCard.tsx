'use client';

import { useState, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { CopyOutlined, DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import '@/styles/CodeCard.css';

interface CodeCardProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
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
  showLineNumbers = true,
  onCopy,
  onDownload,
  onRun,
  actions,
  className,
}: CodeCardProps) {
  const [copied, setCopied] = useState(false);

  const lines = code.split('\n');

  const handleCopy = useCallback(() => {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    onCopy?.();
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }, [code, onCopy]);

  return (
    <div className={`code-card ${className ?? ''}`}>
      <div className="code-card-header">
        <div className="code-card-header-left">
          <span className="code-card-lang">{language}</span>
          {filename != null && <span className="code-card-filename">{filename}</span>}
        </div>
        <div className="code-card-actions">
          {actions}
          <Tooltip title={copied ? '已复制' : '复制代码'}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              className="code-card-action-btn"
            />
          </Tooltip>
          {onDownload != null && (
            <Tooltip title="下载">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => {
                  onDownload();
                }}
                className="code-card-action-btn"
              />
            </Tooltip>
          )}
          {onRun != null && (
            <Tooltip title="运行">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={() => {
                  onRun();
                }}
                className="code-card-action-btn"
              />
            </Tooltip>
          )}
        </div>
      </div>
      <div className="code-card-body">
        <pre className="code-card-code">
          {lines.map((line, index) => (
            <div key={String(index)} className="code-card-line">
              {showLineNumbers && (
                <span className="code-card-line-number">
                  {String(index + 1)}
                </span>
              )}
              <code className="code-card-content">
                {line.length === 0 ? '\n' : line}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
