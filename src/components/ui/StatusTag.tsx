import { Tag, TagProps } from 'antd';

export type StatusType = 'success' | 'error' | 'warning' | 'processing' | 'default' | 'normal';

export interface StatusTagConfig {
  status: string;
  color?: TagProps['color'];
  text?: string;
}

const defaultStatusMap: Record<string, { color: string; text: string }> = {
  active: { color: 'green', text: '启用' },
  inactive: { color: 'default', text: '禁用' },
  enabled: { color: 'green', text: '启用' },
  disabled: { color: 'default', text: '禁用' },
  connected: { color: 'green', text: '已连接' },
  disconnected: { color: 'default', text: '未连接' },
  pending: { color: 'orange', text: '处理中' },
  processing: { color: 'processing', text: '处理中' },
  success: { color: 'green', text: '成功' },
  error: { color: 'red', text: '失败' },
  failed: { color: 'red', text: '失败' },
  running: { color: 'default', text: '运行中' },
  stopped: { color: 'default', text: '已停止' },
};

export interface StatusTagProps extends Omit<TagProps, 'color'> {
  status: string;
  statusMap?: Record<string, { color: string; text: string }>;
}

export const StatusTag = ({
  status,
  statusMap = defaultStatusMap,
  ...props
}: StatusTagProps) => {
  const config = statusMap[status] || { color: 'default', text: status };

  return (
    <Tag color={config.color} {...props}>
      {config.text || status}
    </Tag>
  );
};

export const createStatusTag = (customMap?: Record<string, { color: string; text: string }>) => {
  const map = { ...defaultStatusMap, ...customMap };
  return (props: StatusTagProps) => <StatusTag statusMap={map} {...props} />;
};