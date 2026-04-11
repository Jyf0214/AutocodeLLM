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

import { createModal, Flexbox, Icon, useModalContext } from '@lobehub/ui';
import { BookUp2Icon } from 'lucide-react';
import { memo, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import SelectForm from './SelectForm';

interface AddFilesToKnowledgeBaseModalProps {
  fileIds: string[];
  knowledgeBaseId?: string;
  onClose?: () => void;
  resolveFileIds?: () => Promise<string[]>;
  selectedCount?: number;
}

interface ModalContentProps {
  fileIds: string[];
  knowledgeBaseId?: string;
  resolveFileIds?: () => Promise<string[]>;
  selectedCount?: number;
}

const ModalContent = memo<ModalContentProps>(
  ({ fileIds, knowledgeBaseId, resolveFileIds, selectedCount }) => {
    const { t } = useTranslation('knowledgeBase');
    const { close } = useModalContext();
    return (
      <>
        <Flexbox
          horizontal
          gap={8}
          paddingBlock={16}
          paddingInline={16}
          style={{ paddingBottom: 0 }}
        >
          <Icon icon={BookUp2Icon} />
          {t('addToKnowledgeBase.title')}
        </Flexbox>
        <Flexbox padding={16} style={{ paddingTop: 0 }}>
          <SelectForm
            fileIds={fileIds}
            knowledgeBaseId={knowledgeBaseId}
            resolveFileIds={resolveFileIds}
            selectedCount={selectedCount}
            onClose={close}
          />
        </Flexbox>
      </>
    );
  },
);

ModalContent.displayName = 'AddFilesToKnowledgeBaseModalContent';

export const useAddFilesToKnowledgeBaseModal = () => {
  const open = useCallback((params?: AddFilesToKnowledgeBaseModalProps) => {
    createModal({
      afterClose: params?.onClose,
      children: (
        <Suspense fallback={<div style={{ minHeight: 200 }} />}>
          <ModalContent
            fileIds={params?.fileIds || []}
            knowledgeBaseId={params?.knowledgeBaseId}
            resolveFileIds={params?.resolveFileIds}
            selectedCount={params?.selectedCount}
          />
        </Suspense>
      ),
      footer: null,
      title: null,
    });
  }, []);

  return { open };
};
