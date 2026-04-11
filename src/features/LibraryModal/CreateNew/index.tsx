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

import { createModal, Flexbox, useModalContext } from '@lobehub/ui';
import { memo, Suspense, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import CreateForm from './CreateForm';

interface ModalContentProps {
  id?: string;
  initialValues?: { name?: string; description?: string };
  onSuccess?: (id: string) => void;
}

const ModalContent = memo<ModalContentProps>(({ id, initialValues, onSuccess }) => {
  const { close } = useModalContext();

  return (
    <Flexbox paddingInline={8} style={{ paddingBottom: 8 }}>
      <CreateForm id={id} initialValues={initialValues} onClose={close} onSuccess={onSuccess} />
    </Flexbox>
  );
});

ModalContent.displayName = 'KnowledgeBaseCreateModalContent';

interface OpenParams {
  id?: string;
  initialValues?: { name?: string; description?: string };
  onSuccess?: (id: string) => void;
}

export const useCreateNewModal = () => {
  const { t } = useTranslation('knowledgeBase');

  const open = useCallback(
    (props?: OpenParams) => {
      const isEditMode = !!props?.id;

      createModal({
        children: (
          <Suspense fallback={<div style={{ minHeight: 200 }} />}>
            <ModalContent
              id={props?.id}
              initialValues={props?.initialValues}
              onSuccess={props?.onSuccess}
            />
          </Suspense>
        ),
        width: 420,
        focusTriggerAfterClose: true,
        footer: null,
        title: isEditMode ? t('createNew.edit.title') : t('createNew.title'),
      });
    },
    [t],
  );

  return { open };
};
