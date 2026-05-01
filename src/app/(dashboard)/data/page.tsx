'use client';

import { useState, useCallback } from 'react';
import { PageContainer, Button, Text, Flexbox } from '@/lib/ui';
import { DownloadOutlined, UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { message, Radio, Progress, Card, Upload, Space } from 'antd';
import type { RadioChangeEvent } from 'antd';

interface ImportResult {
  imported: number;
  skipped: number;
  failed: number;
  total: number;
  progress: string[];
}

export default function DataPage() {
  const [mode, setMode] = useState<'merge' | 'overwrite'>('merge');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  const handleExport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/data/export');
      const json = await res.json();
      if (json.success) {
        const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `autocodellm-export-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        message.success('导出成功');
      }
    } catch {
      message.error('导出失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleImport = useCallback(async (file: File) => {
    setLoading(true);
    setResult(null);
    setProgressPercent(0);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const progressInterval = setInterval(() => {
        setProgressPercent((p) => Math.min(p + 10, 90));
      }, 200);

      const res = await fetch('/api/data/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, mode }),
      });

      clearInterval(progressInterval);
      setProgressPercent(100);

      const json = await res.json();
      if (json.success) {
        setResult(json.data);
        message.success(`导入完成：成功 ${json.data.imported}，跳过 ${json.data.skipped}，失败 ${json.data.failed}`);
      } else {
        message.error(json.error?.message || '导入失败');
      }
    } catch (err) {
      message.error('导入失败：JSON 格式错误');
    } finally {
      setLoading(false);
    }

    return false; // 阻止默认上传
  }, [mode]);

  return (
    <PageContainer title="数据管理" subtitle="导出和导入系统数据">
      <Flexbox gap={24} direction="vertical">
        {/* 导出 */}
        <Card title="导出数据" size="small">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            导出所有工作区、提供商、环境变量和 MCP 配置为 JSON 文件
          </Text>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={loading}
          >
            导出 JSON
          </Button>
        </Card>

        {/* 导入 */}
        <Card title="导入数据" size="small">
          <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
            从 JSON 文件导入数据。合并模式保留现有数据，覆盖模式先清除再导入。
          </Text>

          <div style={{ marginBottom: 16 }}>
            <Radio.Group value={mode} onChange={(e: RadioChangeEvent) => setMode(e.target.value)}>
              <Radio.Button value="merge">合并模式</Radio.Button>
              <Radio.Button value="overwrite">覆盖模式</Radio.Button>
            </Radio.Group>
          </div>

          <Upload
            accept=".json"
            showUploadList={false}
            beforeUpload={handleImport}
            disabled={loading}
          >
            <Button icon={<UploadOutlined />} loading={loading}>
              选择 JSON 文件导入
            </Button>
          </Upload>

          {/* 进度 */}
          {loading && (
            <div style={{ marginTop: 16 }}>
              <Progress percent={progressPercent} status="active" />
            </div>
          )}

          {/* 结果 */}
          {result && (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                borderRadius: 8,
                border: '1px solid var(--border-primary)',
                background: 'var(--bg-secondary)',
              }}
            >
              <Flexbox gap={8}>
                <Text strong>导入结果</Text>
                <div style={{ display: 'flex', gap: 16 }}>
                  <Tag color="green">成功: {result.imported}</Tag>
                  <Tag color="default">跳过: {result.skipped}</Tag>
                  <Tag color="red">失败: {result.failed}</Tag>
                </div>
                <div style={{ maxHeight: 200, overflow: 'auto', marginTop: 8 }}>
                  {result.progress.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        fontSize: 12,
                        padding: '4px 0',
                        borderBottom: '1px solid var(--border-primary)',
                        color: p.includes('失败') ? '#ff4d4f' : 'var(--text-secondary)',
                      }}
                    >
                      {p.includes('失败') ? <CloseCircleOutlined style={{ marginRight: 4 }} /> : <CheckCircleOutlined style={{ marginRight: 4, color: '#52c41a' }} />}
                      {p}
                    </div>
                  ))}
                </div>
              </Flexbox>
            </div>
          )}
        </Card>
      </Flexbox>
    </PageContainer>
  );
}

function Tag({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        background: `${color}20`,
        color,
        border: `1px solid ${color}40`,
      }}
    >
      {children}
    </span>
  );
}