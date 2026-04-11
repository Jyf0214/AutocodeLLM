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

'use client';

import { LoadingOutlined } from '@ant-design/icons';
import { Alert, Flexbox, Icon } from '@lobehub/ui';
import { App, Modal, Spin, Typography, Upload } from 'antd';
import { sha256 } from 'js-sha256';
import { ArrowLeftRight, InboxIcon, Sparkles, Upload as UploadIcon } from 'lucide-react';
import { memo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { lambdaClient } from '@/libs/trpc/client/lambda';
import { uploadService } from '@/services/upload';
import { useToolStore } from '@/store/tool';

interface UploadSkillModalProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

const UploadSkillModal = memo<UploadSkillModalProps>(({ open, onOpenChange }) => {
  const { t } = useTranslation(['setting', 'common']);
  const { message } = App.useApp();
  const importAgentSkillFromZip = useToolStore((s) => s.importAgentSkillFromZip);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    onOpenChange(false);
    setError(null);
  };

  const handleUploadFile = async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const { data: metadata } = await uploadService.uploadFileToS3(file, {
        directory: 'skills',
      });

      const hash = sha256(await file.arrayBuffer());

      const result = await lambdaClient.file.createFile.mutate({
        fileType: file.type || 'application/zip',
        hash,
        metadata: {},
        name: file.name,
        size: file.size,
        url: metadata.path,
      });

      await importAgentSkillFromZip({ zipFileId: result.id });
      message.success(t('agentSkillModal.importSuccess'));
      handleClose();
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      destroyOnClose
      closable={!loading}
      footer={null}
      maskClosable={!loading}
      open={open}
      title={null}
      width={480}
      onCancel={handleClose}
    >
      <Flexbox align="center" gap={16} padding={'16px 0'}>
        <Flexbox horizontal align="center" gap={8}>
          <Icon icon={UploadIcon} size={28} />
          <Icon
            icon={ArrowLeftRight}
            size={16}
            style={{ color: 'var(--ant-color-text-tertiary)' }}
          />
          <Icon icon={Sparkles} size={28} />
        </Flexbox>

        <Flexbox align="center" gap={4}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            {t('agentSkillModal.upload.title')}
          </Typography.Title>
          <Typography.Text type="secondary">{t('agentSkillModal.upload.desc')}</Typography.Text>
        </Flexbox>
      </Flexbox>

      <Flexbox gap={16}>
        {error && (
          <Alert showIcon title={t('agentSkillModal.importError', { error })} type="error" />
        )}

        <Upload.Dragger
          accept=".zip,.skill"
          disabled={loading}
          showUploadList={false}
          beforeUpload={(file) => {
            handleUploadFile(file);
            return false;
          }}
        >
          <Flexbox align="center" gap={8} padding={24}>
            {loading ? (
              <>
                <Spin indicator={<LoadingOutlined spin />} />
                <Typography.Text type="secondary">
                  {t('agentSkillModal.upload.uploading')}
                </Typography.Text>
              </>
            ) : (
              <>
                <Icon
                  icon={InboxIcon}
                  size={48}
                  style={{ color: 'var(--ant-color-text-quaternary)' }}
                />
                <Typography.Text type="secondary">
                  {t('agentSkillModal.upload.dragText')}
                </Typography.Text>
              </>
            )}
          </Flexbox>
        </Upload.Dragger>

        <Flexbox gap={8}>
          <Typography.Text strong>{t('agentSkillModal.upload.requirements')}</Typography.Text>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li>
              <Typography.Text type="secondary">
                {t('agentSkillModal.upload.requirementZip')}
              </Typography.Text>
            </li>
            <li>
              <Typography.Text type="secondary">
                {t('agentSkillModal.upload.requirementSkillMd')}
              </Typography.Text>
            </li>
          </ul>
        </Flexbox>
      </Flexbox>
    </Modal>
  );
});

UploadSkillModal.displayName = 'UploadSkillModal';

export default UploadSkillModal;
