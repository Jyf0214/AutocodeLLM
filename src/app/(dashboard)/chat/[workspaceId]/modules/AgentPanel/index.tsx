/**
 * 本文件是 AutocodeLLM 项目的原始实现
 *
 * AutocodeLLM 项目许可证:
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 */

'use client';

import React from 'react';
import { Flexbox, Text, Icon, Avatar } from '@lobehub/ui';
import { Tag, Spin } from 'antd';
import {
  LoadingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PauseCircleOutlined,
} from '@ant-design/icons';

interface AgentInstance {
  id: string;
  name: string;
  role: 'supervisor' | 'worker' | 'orchestrator';
  status: 'idle' | 'running' | 'completed' | 'error' | 'cancelled';
  task?: string;
  result?: string;
}

interface AgentPanelProps {
  agents: AgentInstance[];
  visible?: boolean;
  onClose?: () => void;
}

/**
 * Agent状态图标
 */
const StatusIcon: React.FC<{ status: AgentInstance['status'] }> = ({ status }) => {
  const config: Record<string, { icon: React.ComponentType; color: string; text: string; spin?: boolean }> = {
    idle: { icon: PauseCircleOutlined, color: '#999', text: '等待中' },
    running: { icon: LoadingOutlined, color: '#1890ff', text: '执行中', spin: true },
    completed: { icon: CheckCircleOutlined, color: '#52c41a', text: '已完成' },
    error: { icon: CloseCircleOutlined, color: '#ff4d4f', text: '失败' },
    cancelled: { icon: PauseCircleOutlined, color: '#faad14', text: '已取消' },
  };

  const item = config[status];
  if (!item) return null;
  
  const { icon: IconComponent, color, text, spin } = item;

  return (
    <Flexbox gap={4} horizontal align="center">
      <Spin spinning={spin ?? false}>
        <Icon icon={IconComponent as React.ComponentType} size={14} color={color} />
      </Spin>
      <Text style={{ fontSize: 12, color }}>{text}</Text>
    </Flexbox>
  );
};

/**
 * Agent角色标签
 */
const RoleTag: React.FC<{ role: AgentInstance['role'] }> = ({ role }) => {
  const config = {
    supervisor: { color: '#722ed1', text: '👑 监督者', bg: '#f9f0ff' },
    worker: { color: '#1890ff', text: '🔧 执行者', bg: '#e6f7ff' },
    orchestrator: { color: '#52c41a', text: '🎯 编排者', bg: '#f6ffed' },
  };

  const { color, text, bg } = config[role];

  return (
    <Tag
      color={color}
      style={{
        background: bg,
        border: 'none',
        fontSize: 11,
        padding: '2px 8px',
      }}
    >
      {text}
    </Tag>
  );
};

/**
 * 单个Agent卡片
 */
const AgentCard: React.FC<{ agent: AgentInstance }> = ({ agent }) => {
  const roleIcons = {
    supervisor: '👑',
    worker: '🔧',
    orchestrator: '🎯',
  };

  return (
    <Flexbox
      gap={12}
      style={{
        padding: 12,
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg)',
      }}
    >
      <Flexbox horizontal justify="space-between" align="center">
        <Flexbox gap={8} horizontal align="center">
          <Avatar
            avatar={roleIcons[agent.role]}
            size={32}
            background={
              agent.status === 'running'
                ? 'var(--lobe-color-primary)'
                : 'var(--color-fill-quaternary)'
            }
          />
          <Flexbox>
            <Text strong style={{ fontSize: 13 }}>
              {agent.name}
            </Text>
            <RoleTag role={agent.role} />
          </Flexbox>
        </Flexbox>
        <StatusIcon status={agent.status} />
      </Flexbox>

      {agent.task && (
        <Text type="secondary" style={{ fontSize: 12 }}>
          任务: {agent.task}
        </Text>
      )}

      {agent.status === 'running' && (
        <Flexbox gap={4} horizontal align="center" style={{ marginTop: 4 }}>
          <Spin size="small">
            <div />
          </Spin>
          <Text type="secondary" style={{ fontSize: 12 }}>
            正在处理...
          </Text>
        </Flexbox>
      )}
    </Flexbox>
  );
};

/**
 * Agent面板组件
 * 显示当前活跃的Agent列表和状态
 */
export const AgentPanel: React.FC<AgentPanelProps> = ({ agents, visible = true }) => {
  if (!visible || agents.length === 0) {
    return null;
  }

  const runningCount = agents.filter((a) => a.status === 'running').length;
  const completedCount = agents.filter((a) => a.status === 'completed').length;

  return (
    <Flexbox
      gap={12}
      style={{
        padding: 16,
        borderRadius: 8,
        background: 'var(--color-bg-layout)',
        maxHeight: 400,
        overflowY: 'auto',
      }}
    >
      <Flexbox horizontal justify="space-between" align="center">
        <Text strong style={{ fontSize: 14 }}>
          Agent 协作面板
        </Text>
        <Flexbox gap={8} horizontal>
          <Tag color="blue">运行中: {runningCount}</Tag>
          <Tag color="green">已完成: {completedCount}</Tag>
        </Flexbox>
      </Flexbox>

      <Flexbox gap={8}>
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </Flexbox>

      {runningCount > 0 && (
        <Flexbox
          gap={8}
          horizontal
          align="center"
          justify="center"
          style={{ marginTop: 8, padding: 8 }}
        >
          <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {runningCount} 个Agent正在执行...
          </Text>
        </Flexbox>
      )}
    </Flexbox>
  );
};

export default AgentPanel;
