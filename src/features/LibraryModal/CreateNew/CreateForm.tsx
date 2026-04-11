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

import { Button, Flexbox, Input, TextArea } from '@lobehub/ui';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useKnowledgeBaseStore } from '@/store/library';

interface CreateFormProps {
  id?: string;
  initialValues?: { name?: string; description?: string };
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

const CreateForm = memo<CreateFormProps>(({ id, initialValues, onClose, onSuccess }) => {
  const { t } = useTranslation('knowledgeBase');
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(initialValues?.name || '');
  const [description, setDescription] = useState(initialValues?.description || '');
  const createNewKnowledgeBase = useKnowledgeBaseStore((s) => s.createNewKnowledgeBase);
  const updateKnowledgeBase = useKnowledgeBaseStore((s) => s.updateKnowledgeBase);

  const isEditMode = !!id;

  const handleSubmit = async () => {
    if (!name.trim()) return;

    setLoading(true);
    const values = { name: name.trim(), description: description.trim() };

    try {
      if (isEditMode) {
        await updateKnowledgeBase(id, values);
        setLoading(false);
        onClose?.();
      } else {
        const newId = await createNewKnowledgeBase(values);
        setLoading(false);

        if (onSuccess) {
          onSuccess(newId);
          onClose?.();
        } else {
          window.location.href = `/resource/library/${newId}`;
        }
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <Flexbox gap={16}>
      <Input
        autoFocus
        placeholder={t('createNew.name.placeholder')}
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Flexbox gap={8}>
        <label style={{ fontSize: 14 }}>{t('createNew.description.label')}</label>
        <TextArea
          placeholder={t('createNew.description.placeholder')}
          style={{ minHeight: 120 }}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </Flexbox>
      <Button block loading={loading} type={'primary'} onClick={handleSubmit}>
        {isEditMode ? t('createNew.edit.confirm') : t('createNew.confirm')}
      </Button>
    </Flexbox>
  );
});

export default CreateForm;
