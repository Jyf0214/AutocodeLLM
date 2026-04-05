'use client';

import { useCallback, useEffect, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { Text, Markdown, Flexbox, Skeleton } from '@lobehub/ui';
import { List, Typography } from 'antd';
import { useTranslations } from 'next-intl';

interface DocFile {
  filename: string;
  path: string;
  title: string;
}

export default function DocsPage() {
  const t = useTranslations();
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocFile | null>(null);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(false);

  // 加载文档列表
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await fetch('/api/docs');
        const data = await response.json();
        setDocs(data.docs ?? []);
      } catch (error) {
        console.error('加载文档列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, []);

  // 加载文档内容
  const fetchDocContent = useCallback(async (docPath: string) => {
    setContentLoading(true);
    try {
      const response = await fetch(`/api/docs/content?path=${encodeURIComponent(docPath)}`);
      const data = await response.json();
      setContent(data.content ?? '');
    } catch (error) {
      console.error('加载文档内容失败:', error);
      setContent('');
    } finally {
      setContentLoading(false);
    }
  }, []);

  const handleDocSelect = useCallback((doc: DocFile) => {
    setSelectedDoc(doc);
    fetchDocContent(doc.path);
  }, [fetchDocContent]);

  return (
    <AppLayout>
      <Flexbox horizontal gap={24} style={{ height: 'calc(100vh - 120px)' }}>
        {/* 左侧文档列表 */}
        <Flexbox style={{ width: 280, flexShrink: 0 }} gap={16}>
          <Text strong style={{ fontSize: 20 }}>
            {t('common.docs')}
          </Text>
          
          {loading ? (
            <Skeleton active />
          ) : (
            <List
              dataSource={docs}
              renderItem={(doc) => (
                <List.Item
                  onClick={() => { handleDocSelect(doc); }}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: selectedDoc?.path === doc.path ? 'var(--ant-color-primary-bg)' : undefined,
                    padding: '12px 16px',
                    borderRadius: 'var(--ant-border-radius)',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedDoc?.path !== doc.path) {
                      e.currentTarget.style.backgroundColor = 'var(--ant-color-fill-secondary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedDoc?.path !== doc.path) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Text strong={selectedDoc?.path === doc.path}>
                    {doc.title}
                  </Text>
                </List.Item>
              )}
              locale={{ emptyText: '暂无文档' }}
            />
          )}
        </Flexbox>

        {/* 右侧内容预览 */}
        <Flexbox style={{ flex: 1, minWidth: 0 }} gap={16}>
          {selectedDoc ? (
            <>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {selectedDoc.title}
              </Typography.Title>
              
              <div
                style={{
                  padding: 24,
                  backgroundColor: 'var(--ant-color-bg-container)',
                  borderRadius: 'var(--ant-border-radius-lg)',
                  border: '1px solid var(--ant-color-border-secondary)',
                  overflow: 'auto',
                  maxHeight: 'calc(100vh - 240px)',
                }}
              >
                {contentLoading ? (
                  <Skeleton active paragraph={{ rows: 8 }} />
                ) : (
                  <Markdown>{content}</Markdown>
                )}
              </div>
            </>
          ) : (
            <Flexbox flex={1} align="center" justify="center">
              <Text type="secondary">
                请从左侧选择一篇文档查看
              </Text>
            </Flexbox>
          )}
        </Flexbox>
      </Flexbox>
    </AppLayout>
  );
}
