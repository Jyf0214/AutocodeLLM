'use client';

import { useState } from 'react';
import { Tag } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import '@/styles/FunctionCall.css';

interface FunctionCallProps {
  functionName: string;
  parameters: Record<string, unknown>;
  status?: 'pending' | 'running' | 'success' | 'error';
  result?: string;
  className?: string;
}

const statusMap = {
  pending: { color: 'default' as const, text: '等待中' },
  running: { color: 'processing' as const, text: '运行中' },
  success: { color: 'default' as const, text: '成功' },
  error: { color: 'default' as const, text: '失败' },
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
    <div className={`function-call ${className ?? ''}`}>
      <div
        className="function-call-header"
        onClick={() => {
          setExpanded(!expanded);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setExpanded(!expanded);
          }
        }}
      >
        <RightOutlined
          className={`function-call-chevron ${expanded ? 'function-call-chevron-expanded' : ''}`}
        />
        <code className="function-call-name">{functionName}</code>
        <Tag className="function-call-status" color={statusInfo.color}>
          {statusInfo.text}
        </Tag>
      </div>
      {expanded && (
        <div className="function-call-content">
          {paramEntries.length > 0 && (
            <div className="function-call-params">
              {paramEntries.map(([key, value]) => (
                <div key={key} className="function-call-param-row">
                  <span className="function-call-param-key">{key}</span>
                  <span className="function-call-param-value">
                    {typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {result != null && (
            <div className={`function-call-result ${isSuccess ? 'function-call-result-success' : ''} ${isError ? 'function-call-result-error' : ''}`}>
              <div className="function-call-result-header">执行结果</div>
              <pre className="function-call-result-content">{result}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
