/**
 * 本代码来源于 LobeChat 项目（https://github.com/lobehub/lobe-chat）
 *
 * LobeChat 许可证信息：
 * LobeHub Community License（基于 Apache License 2.0）
 * Copyright (c) 2024-2026 LobeHub LLC. All rights reserved.
 * 详细信息：http://www.apache.org/licenses/LICENSE-2.0
 *
 * 修改声明：
 * 本文件已从 LobeChat 源代码进行修改以适配 AutocodeLLM 项目。
 * 修改内容包括：目录结构调整、依赖适配、API 接口兼容等。
 *
 * AutocodeLLM 项目许可证：
 * Apache License, Version 2.0
 * Copyright (c) 2026 Jyf0214
 *
 * 双重许可：本文件同时受上述两个许可证约束。
 * 商业使用需分别获得对应授权。
 */

import { ActionIcon, Button, DropdownMenu, Flexbox, Icon } from '@lobehub/ui';
import { InfoIcon, MoreVerticalIcon, Trash2 } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { useServerConfigStore } from '@/store/serverConfig';
import { KnowledgeType } from '@/types/knowledgeBase';

interface ActionsProps {
  enabled?: boolean;
  id: string;
  type: KnowledgeType;
}

const Actions = memo<ActionsProps>(({ id, type, enabled }) => {
  const { t } = useTranslation('chat');

  const mobile = useServerConfigStore((s) => s.isMobile);
  const [
    addFilesToAgent,
    addKnowledgeBasesToAgent,
    removeFilesFromAgent,
    removeKnowledgeBasesFromAgent,
  ] = useAgentStore((s) => [
    s.addFilesToAgent,
    s.addKnowledgeBaseToAgent,
    s.removeFileFromAgent,
    s.removeKnowledgeBaseFromAgent,
  ]);

  const [loading, setLoading] = useState(false);

  const assignKnowledge = async () => {
    setLoading(true);
    if (type === KnowledgeType.KnowledgeBase) {
      await addKnowledgeBasesToAgent(id);
    } else {
      await addFilesToAgent([id], true);
    }
    setLoading(false);
  };

  const removeKnowledge = async () => {
    setLoading(true);
    if (type === KnowledgeType.KnowledgeBase) {
      await removeKnowledgeBasesFromAgent(id);
    } else {
      await removeFilesFromAgent(id);
    }
    setLoading(false);
  };

  return (
    <Flexbox horizontal align={'center'}>
      {enabled ? (
        <DropdownMenu
          placement="bottomRight"
          items={[
            {
              icon: <Icon icon={InfoIcon} />,
              key: 'detail',
              label: t('knowledgeBase.library.action.detail'),
              onClick: () => {
                if (type === KnowledgeType.KnowledgeBase) {
                  window.open(`/resource/library/${id}`);
                  return;
                }

                window.open(`/resource?file=${id}`);
              },
            },
            {
              danger: true,
              icon: <Icon icon={Trash2} />,
              key: 'remove',
              label: t('knowledgeBase.library.action.remove'),
              onClick: removeKnowledge,
            },
          ]}
        >
          <ActionIcon icon={MoreVerticalIcon} loading={loading} />
        </DropdownMenu>
      ) : (
        <Button
          loading={loading}
          size={mobile ? 'small' : undefined}
          type={'primary'}
          onClick={assignKnowledge}
        >
          {t('knowledgeBase.library.action.add')}
        </Button>
      )}
    </Flexbox>
  );
});

export default Actions;
