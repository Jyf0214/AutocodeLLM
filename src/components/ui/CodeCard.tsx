'use client';

import { useState, useCallback } from 'react';
import { Button, Tooltip } from 'antd';
import { CopyOutlined, DownloadOutlined, PlayCircleOutlined } from '@ant-design/icons';
import styles from './CodeCard.module.css';

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
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  }, [code, onCopy]);

  return (
    <div className={`${styles.card} ${className ?? ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.languageTag}>{language}</span>
          {filename && <span className={styles.filename}>{filename}</span>}
        </div>
        <div className={styles.headerActions}>
          {actions}
          <Tooltip title={copied ? '已复制' : '复制代码'}>
            <Button
              type="text"
              size="small"
              icon={<CopyOutlined />}
              onClick={handleCopy}
              className={styles.actionBtn!}
            />
          </Tooltip>
          {onDownload && (
            <Tooltip title="下载">
              <Button
                type="text"
                size="small"
                icon={<DownloadOutlined />}
                onClick={onDownload}
                className={styles.actionBtn!}
              />
            </Tooltip>
          )}
          {onRun && (
            <Tooltip title="运行">
              <Button
                type="text"
                size="small"
                icon={<PlayCircleOutlined />}
                onClick={onRun}
                className={styles.actionBtn!}
              />
            </Tooltip>
          )}
        </div>
      </div>
      <div className={styles.codeContainer}>
        <pre className={styles.codeBlock}>
          {lines.map((line, index) => (
            <div key={index} className={styles.codeLine}>
              {showLineNumbers && (
                <span className={styles.lineNumber}>
                  {index + 1}
                </span>
              )}
              <code className={styles.codeContent}>
                {line || '\n'}
              </code>
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
