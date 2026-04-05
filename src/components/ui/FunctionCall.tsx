'use client';

import { useState } from 'react';
import { Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import styles from './FunctionCall.module.css';

interface FunctionCallProps {
  functionName: string;
  parameters: Record<string, unknown>;
  status?: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  className?: string;
}

const statusMap = {
  pending: { color: 'default', text: '等待中' },
  running: { color: 'processing', text: '运行中' },
  success: { color: 'default', text: '成功' },
  error: { color: 'default', text: '失败' },
};

export default function FunctionCall({
  functionName,
  parameters,
  status = 'pending',
  result,
  className,
}: FunctionCallProps) {
  const [expanded, setExpanded] = useState(false);

  const statusInfo = statusMap[status];
  const isSuccess = status === 'success';
  const isError = status === 'error';

  const paramEntries = Object.entries(parameters);

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <div
        className={styles.header}
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded);
          }
        }}
      >
        <RightOutlined
          className={`${styles.chevron} ${expanded ? styles.chevronExpanded : ''}`}
        />
        <code className={styles.functionName}>{functionName}</code>
        <Tag className={styles.statusTag!} color={statusInfo.color as 'default' | 'processing'}>
          {statusInfo.text}
        </Tag>
      </div>
      {expanded && (
        <div className={styles.content}>
          {paramEntries.length > 0 && (
            <div className={styles.paramsTable}>
              {paramEntries.map(([key, value]) => (
                <div key={key} className={styles.paramRow}>
                  <span className={styles.paramKey}>{key}</span>
                  <span className={styles.paramValue}>
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {result && (
            <div className={`${styles.resultCard} ${isSuccess ? styles.resultSuccess : ''} ${isError ? styles.resultError : ''}`}>
              <div className={styles.resultHeader}>执行结果</div>
              <pre className={styles.resultContent}>{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
