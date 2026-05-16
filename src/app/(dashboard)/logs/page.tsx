'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageContainer, PageCard, Button, Flexbox, Input, Modal } from '@/lib/ui';
import {
  ReloadOutlined, DeleteOutlined, SearchOutlined,
  PauseCircleOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { Select, Tag, Empty, message, Tooltip, Collapse } from 'antd';

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
  queryParams?: string;
  requestBody?: string;
  responseBody?: string;
  cookies?: string;
  headers?: string;
  errorDetails?: string;
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
  200: '#52c41a', 201: '#52c41a', 301: '#1890ff', 302: '#1890ff',
  304: '#1890ff', 400: '#faad14', 401: '#faad14', 403: '#faad14',
  404: '#ff4d4f', 500: '#faad14', 502: '#ff4d4f', 503: '#ff4d4f',
};

function formatFullTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

export default function LogsPage() {
  const [data, setData] = useState<LogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState<string | undefined>();
  const [source, setSource] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [modalEntry, setModalEntry] = useState<LogEntry | null>(null);

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
      if (json.success) { setData(null); message.success('日志已清空'); }
    } catch { message.error('清空失败'); }
  };

  const collapsibleItems = modalEntry ? [
    modalEntry.queryParams ? { key: 'params', label: '查询参数', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{modalEntry.queryParams}</pre> } : null,
    modalEntry.cookies ? { key: 'cookies', label: 'Cookie', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{modalEntry.cookies}</pre> } : null,
    modalEntry.headers ? { key: 'headers', label: '请求头', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>{modalEntry.headers}</pre> } : null,
    modalEntry.requestBody ? { key: 'reqBody', label: '请求体', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:300,overflow:'auto'}}>{modalEntry.requestBody}</pre> } : null,
    modalEntry.responseBody ? { key: 'resBody', label: '响应体', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all',maxHeight:300,overflow:'auto'}}>{modalEntry.responseBody}</pre> } : null,
    modalEntry.errorDetails ? { key: 'error', label: '错误详情', children: <pre style={{margin:0,fontSize:13,whiteSpace:'pre-wrap',wordBreak:'break-all',color:'#ff4d4f',maxHeight:300,overflow:'auto'}}>{modalEntry.errorDetails}</pre> } : null,
  ].filter(Boolean) : [];

  return (
    <PageContainer title="系统日志" subtitle={`共 ${String(data?.total ?? 0)} 条记录`}>
      {data?.stats && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <Tag color="default">总计: {data.stats.total}</Tag>
          <Tag color="green">最近5分钟: {data.stats.last5min}</Tag>
          <Tag color="purple">最近1小时: {data.stats.last1hour}</Tag>
          <Tag color="red">错误: {data.stats.errors}</Tag>
          <Tag color="orange">警告: {data.stats.warnings}</Tag>
        </div>
      )}

      <Flexbox gap={12} style={{ marginBottom: 16 }} wrap>
        <Input placeholder="搜索日志消息..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} style={{ width: 200 }} allowClear />
        <Select allowClear placeholder="级别" value={level} onChange={setLevel} style={{ width: 100 }} options={[{value:'debug',label:'Debug'},{value:'info',label:'Info'},{value:'warn',label:'Warn'},{value:'error',label:'Error'}]} />
        <Select allowClear placeholder="来源" value={source} onChange={setSource} style={{ width: 100 }} options={[{value:'backend',label:'后端'},{value:'request',label:'请求'},{value:'function',label:'函数'}]} />
        <Button icon={<ReloadOutlined />} onClick={fetchLogs} loading={loading}>刷新</Button>
        <Button icon={autoRefresh ? <PauseCircleOutlined /> : <PlayCircleOutlined />} onClick={() => setAutoRefresh(!autoRefresh)} type={autoRefresh ? 'primary' : 'default'}>{autoRefresh ? '自动刷新' : '已暂停'}</Button>
        <Button icon={<DeleteOutlined />} danger onClick={handleClear}>清空</Button>
      </Flexbox>

      {data?.entries.length === 0 ? (
        <PageCard><Empty description="暂无日志" /></PageCard>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data?.entries.map((entry) => (
            <div key={entry.id}
              onClick={() => setModalEntry(entry)}
              style={{
                padding: '8px 10px', borderRadius: 6, border: '1px solid var(--border-primary)',
                background: entry.level === 'error' ? 'rgba(255,77,79,0.06)' : entry.level === 'warn' ? 'rgba(250,173,20,0.06)' : 'var(--bg-primary)',
                fontFamily: "'JetBrains Mono', 'SF Mono', monospace", fontSize: 12, lineHeight: 1.6,
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <Tooltip title={formatFullTime(entry.timestamp)}>
                  <span style={{ color: '#888', minWidth: 65 }}>{new Date(entry.timestamp).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                </Tooltip>
                <Tag color={LEVEL_COLORS[entry.level]} style={{ margin: 0, fontSize: 11, lineHeight: '18px' }}>{entry.level.toUpperCase()}</Tag>
                <Tag style={{ margin: 0, fontSize: 11 }}>{entry.source}</Tag>
                {entry.method && <span style={{ fontWeight: 600 }}>{entry.method}</span>}
                {entry.path && <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{entry.path}</span>}
                {entry.statusCode !== undefined && <span style={{ fontWeight: 700, color: STATUS_COLORS[entry.statusCode] ?? 'var(--text-primary)' }}>{entry.statusCode}</span>}
                {entry.duration !== undefined && <span style={{ color: '#888' }}>{entry.duration}ms</span>}
              </div>
              <div style={{ marginTop: 2, color: entry.level === 'error' ? '#ff4d4f' : entry.level === 'warn' ? '#faad14' : 'var(--text-secondary)', wordBreak: 'break-all' }}>
                {entry.message}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="日志详情"
        open={!!modalEntry}
        onCancel={() => setModalEntry(null)}
        footer={null}
        width={560}
        styles={{ body: { padding: '12px 16px' } }}
      >
        {modalEntry && (
          <div style={{ fontSize: 13, lineHeight: '28px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 12px' }}>
              <span style={{ color: '#888' }}>时间</span><span>{formatFullTime(modalEntry.timestamp)}</span>
              <span style={{ color: '#888' }}>级别</span><Tag color={LEVEL_COLORS[modalEntry.level]} style={{ margin: 0, width: 'fit-content' }}>{modalEntry.level.toUpperCase()}</Tag>
              <span style={{ color: '#888' }}>来源</span><span>{modalEntry.source}</span>
              {modalEntry.method && <><span style={{ color: '#888' }}>请求方法</span><span>{modalEntry.method}</span></>}
              {modalEntry.path && <><span style={{ color: '#888' }}>请求路径</span><span style={{ wordBreak: 'break-all' }}>{modalEntry.path}</span></>}
              {modalEntry.statusCode !== undefined && <><span style={{ color: '#888' }}>状态码</span><span style={{ color: STATUS_COLORS[modalEntry.statusCode] ?? 'inherit', fontWeight: 700 }}>{modalEntry.statusCode}</span></>}
              {modalEntry.duration !== undefined && <><span style={{ color: '#888' }}>耗时</span><span>{modalEntry.duration}ms</span></>}
              {modalEntry.ip && <><span style={{ color: '#888' }}>IP</span><span>{modalEntry.ip}</span></>}
              {modalEntry.userId && <><span style={{ color: '#888' }}>用户</span><span>{modalEntry.userId}</span></>}
            </div>
            <div style={{ marginTop: 8 }}>
              <div style={{ color: modalEntry.level === 'error' ? '#ff4d4f' : modalEntry.level === 'warn' ? '#faad14' : 'var(--text-secondary)', wordBreak: 'break-all', marginBottom: 8 }}>
                {modalEntry.message}
              </div>
              {collapsibleItems.length > 0 && (
                <Collapse items={collapsibleItems as any} size="small" style={{ fontSize: 13, background: 'transparent' }} />
              )}
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}
