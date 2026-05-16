'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageContainer, PageCard, Button, Flexbox, Input } from '@/lib/ui';
import {
  ReloadOutlined, DeleteOutlined, SearchOutlined,
  PauseCircleOutlined, PlayCircleOutlined,
  DownOutlined, RightOutlined,
} from '@ant-design/icons';
import { Select, Tag, Empty, message, Tooltip } from 'antd';

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
  userId?: string;
  ip?: string;
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

function formatFullTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: '24px' }}>
      <span style={{ color: '#888', minWidth: 80, flexShrink: 0 }}>{label}</span>
      <span style={{ color: 'var(--text-primary)', wordBreak: 'break-all' }}>{children ?? '-'}</span>
    </div>
  );
}

export default function LogsPage() {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      {data?.entries.length === 0 ? (
        <PageCard>
          <Empty description="暂无日志" />
        </PageCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data?.entries.map((entry) => {
            const isExpanded = expandedId === entry.id;
            return (
              <div key={entry.id}>
                {/* 条目概览行 */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: isExpanded ? '6px 6px 0 0' : 6,
                    border: '1px solid var(--border-primary)',
                    background: entry.level === 'error'
                      ? 'rgba(255,77,79,0.06)'
                      : entry.level === 'warn'
                      ? 'rgba(250,173,20,0.06)'
                      : 'var(--bg-primary)',
                    fontFamily: "'JetBrains Mono', 'SF Mono', monospace",
                    fontSize: 12,
                    lineHeight: 1.6,
                    cursor: 'pointer',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isExpanded) e.currentTarget.style.background = 'var(--bg-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    if (!isExpanded) {
                      e.currentTarget.style.background =
                        entry.level === 'error'
                          ? 'rgba(255,77,79,0.06)'
                          : entry.level === 'warn'
                          ? 'rgba(250,173,20,0.06)'
                          : 'var(--bg-primary)';
                    }
                  }}
                >
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ color: '#888', minWidth: 18, fontSize: 10 }}>
                      {isExpanded ? <DownOutlined /> : <RightOutlined />}
                    </span>
                    <Tooltip title={formatFullTime(entry.timestamp)}>
                      <span style={{ color: '#888', minWidth: 70 }}>
                        {new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}
                      </span>
                    </Tooltip>
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
                      <span style={{ color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.path}
                      </span>
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
                      marginLeft: 26,
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

                {/* 展开详情 */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '12px 16px',
                      border: '1px solid var(--border-primary)',
                      borderTop: 'none',
                      borderRadius: '0 0 6px 6px',
                      background: 'var(--bg-secondary)',
                      fontSize: 13,
                    }}
                  >
                    <DetailRow label="时间">{formatFullTime(entry.timestamp)}</DetailRow>
                    <DetailRow label="级别">{entry.level.toUpperCase()}</DetailRow>
                    <DetailRow label="来源">{entry.source}</DetailRow>
                    <DetailRow label="消息">{entry.message}</DetailRow>
                    {entry.method && <DetailRow label="请求方法">{entry.method}</DetailRow>}
                    {entry.path && <DetailRow label="请求路径">{entry.path}</DetailRow>}
                    {entry.statusCode !== undefined && <DetailRow label="状态码">{entry.statusCode}</DetailRow>}
                    {entry.duration !== undefined && <DetailRow label="耗时">{entry.duration}ms</DetailRow>}
                    {entry.ip && <DetailRow label="IP地址">{entry.ip}</DetailRow>}
                    {entry.userId && <DetailRow label="用户ID">{entry.userId}</DetailRow>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
