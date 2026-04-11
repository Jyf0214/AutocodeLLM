/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { message, Empty } from 'antd';
import { FolderOutlined } from '@ant-design/icons';
import { Flexbox, Text, Button } from '@lobehub/ui';
import { PlusOutlined } from '@ant-design/icons';

import type { WorkspaceListItem } from '@/lib/api/workspace-types';

/**
 * 聊天列表页
 * 显示所有可聊天的工作区
 */
export default function ChatListPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [fetching, setFetching] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      const response = await fetch('/api/workspaces');
      const result: { success: boolean; data?: WorkspaceListItem[] } = await response.json();

      if (result.success) {
        setWorkspaces(result.data ?? []);
      } else {
        message.error('获取工作区列表失败');
      }
    } catch {
      message.error('获取工作区列表失败');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  const handleWorkspaceClick = useCallback(
    (workspaceId: string) => {
      router.push(`/chat/${workspaceId}`);
    },
    [router]
  );

  const handleCreateWorkspace = useCallback(() => {
    router.push('/workplace');
  }, [router]);

  return (
    
      <Flexbox gap={24}>
        <Flexbox horizontal align="center" justify="space-between">
          <Text strong style={{ fontSize: 20 }}>
            聊天
          </Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWorkspace}>
            新建工作区
          </Button>
        </Flexbox>

        {fetching ? (
          <Empty icon={<FolderOutlined />} description="加载中..." />
        ) : workspaces.length === 0 ? (
          <Empty
            icon={<FolderOutlined />}
            title="暂无工作区"
            description="创建一个工作区即可开始聊天"
            action={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleCreateWorkspace}>
                新建工作区
              </Button>
            }
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => handleWorkspaceClick(workspace.id)}
                style={{
                  padding: 16,
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--lobe-color-primary)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--color-border)';
                }}
              >
                <Flexbox gap={12} align="flex-start">
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'var(--lobe-color-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                    }}
                  >
                    💬
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ fontSize: 16, display: 'block', marginBottom: 4 }}>
                      {workspace.name}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 13, display: 'block' }}>
                      {workspace.description || '暂无描述'}
                    </Text>
                  </div>
                </Flexbox>
              </div>
            ))}
          </div>
        )}
      </Flexbox>
    
  );
}
