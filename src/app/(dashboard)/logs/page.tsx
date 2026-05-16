'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer, PageCard, Button, Flexbox, Input } from '@/lib/ui';
import { ReloadOutlined, DeleteOutlined, SearchOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import { Select, Tag, Empty, message } from 'antd';

interface LogEntry {
  id: string;
  timestamp: number;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: 'backend' | 'request' | 'function';
  message: string;
  path?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
}

interface LogData {
  entries: LogEntry[];
  total: number;
  stats: {
    total: number;
    last5min: number;
    last1hour: number;
    errors: number;
    warnings: number;
  };
}

const LEVEL_COLORS: Record<string, string> = {
  debug: '#888',
  info: '#1890ff',
  warn: '#faad14',
  error: '#ff4d4f',
};

const STATUS_COLORS: Record<number, string> = {
  200: '#52c41a',
  201: '#52c41a',
  301: '#1890ff',
  302: '#1890ff',
  304: '#1890ff',
  400: '#faad14',
  401: '#faad14',
  403: '#faad14',
  404: '#ff4d4f',
  500: '#faad14',
  502: '#ff4d4f',
  503: '#ff4d4f',
};

export default function LogsPage() {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (level) params.set('level', level);
      if (source) params.set('source', source);
      if (searchText) params.set('search', searchText);
      params.set('limit', '200');

      const res = await fetch(`/api/logs?${params}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [level, source, searchText]);

  useEffect(() => {
    fetchLogs();
    if (!autoRefresh) return;
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, [fetchLogs, autoRefresh]);

  const handleClear = async () => {
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setData(null);
        message.success('日志已清空');
      }
    } catch {
      message.error('清空失败');
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('zh-CN', { hour12: false });
  };

  return (
    <PageContainer title="系统日志" subtitle={`共 ${String(data?.total ?? 0)} 条记录`}>
      {/* 统计卡片 */}
      {data?.stats && (
        <Flexbox gap={12} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Tag color="default">总计: {data.stats.total}</Tag>
            <Tag color="green">最近5分钟: {data.stats.last5min}</Tag>
            <Tag color="purple">最近1小时: {data.stats.last1hour}</Tag>
            <Tag color="red">错误: {data.stats.errors}</Tag>
            <Tag color="orange">警告: {data.stats.warnings}</Tag>
          </div>
        </Flexbox>
      )}

      {/* 过滤器 */}
      <Flexbox gap={12} style={{ marginBottom: 16 }} wrap>
        <Input
          placeholder="搜索日志消息..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 220 }}
          allowClear
        />
        <Select
          allowClear
          placeholder="日志级别"
          value={level}
          onChange={setLevel}
          style={{ width: 120 }}
          options={[
            { value: 'debug', label: 'Debug' },
            { value: 'info', label: 'Info' },
            { value: 'warn', label: 'Warn' },
            { value: 'error', label: 'Error' },
          ]}
        />
        <Select
          allowClear
          placeholder="来源"
          value={source}
          onChange={setSource}
          style={{ width: 120 }}
          options={[
            { value: 'backend', label: '后端' },
            { value: 'request', label: '请求' },
            { value: 'function', label: '函数' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>
          刷新
        </Button>
        <Button
          icon={autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={() => setAutoRefresh(!autoRefresh)}
          type={autoRefresh ? 'primary' : 'default'}
        >
          {autoRefresh ? '自动刷新' : '已暂停'}
        </Button>
        <Button icon={<DeleteOutlined />} danger onClick={handleClear}>
          清空
        </Button>
      </Flexbox>

      {/* 日志列表 */}
      <div ref={listRef}>
        {data?.entries.length === 0 ? (
          <PageCard>
            <Empty description="暂无日志" />
          </PageCard>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {data?.entries.map((entry) => (
              <div
                key={entry.id}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border-primary)',
                  background: entry.level === 'error'
                    ? 'rgba(255,77,79,0.06)'
                    : entry.level === 'warn'
                    ? 'rgba(250,173,20,0.06)'
                    : 'var(--bg-primary)',
                  fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                  fontSize: 12,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: '#888', minWidth: 70 }}>
                    {formatTime(entry.timestamp)}
                  </span>
                  <Tag
                    color={LEVEL_COLORS[entry.level]}
                    style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}
                  >
                    {entry.level.toUpperCase()}
                  </Tag>
                  <Tag style={{ margin: 0, fontSize: 11 }}>{entry.source}</Tag>
                  {entry.method && (
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {entry.method}
                    </span>
                  )}
                  {entry.path && (
                    <span style={{ color: 'var(--text-secondary)' }}>{entry.path}</span>
                  )}
                  {entry.statusCode !== undefined && (
                    <span
                      style={{
                        fontWeight: 700,
                        color: STATUS_COLORS[entry.statusCode] ?? 'var(--text-primary)',
                      }}
                    >
                      {entry.statusCode}
                    </span>
                  )}
                  {entry.duration !== undefined && (
                    <span style={{ color: '#888' }}>{entry.duration}ms</span>
                  )}
                </div>
                <div
                  style={{
                    marginTop: 2,
                    color: entry.level === 'error'
                      ? '#ff4d4f'
                      : entry.level === 'warn'
                      ? '#faad14'
                      : 'var(--text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {entry.message}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  );
}
