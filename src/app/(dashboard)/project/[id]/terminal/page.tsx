'use client';

import { useParams } from 'next/navigation';
import { Flexbox, Text, Alert } from '@/lib/ui';
import { CodeOutlined } from '@ant-design/icons';

export default function ProjectTerminalPage() {
  const params = useParams();
  const projectId = params.id as string;

  if (!projectId) {
    return (
      <Flexbox align="center" justify="center" style={{ minHeight: '50vh' }}>
        <Text>{'项目 ID 不存在'}</Text>
      </Flexbox>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 120px)', padding: '0 16px' }}>
      <Alert
        type="warning"
        icon={<CodeOutlined />}
        title="终端功能暂未实现"
        description={<p>Web 终端功能正在开发中。</p>}
      />
    </div>
  );
}
