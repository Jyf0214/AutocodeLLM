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

import { type UIChatMessage } from '@lobechat/types';
import { Flexbox, Modal, Segmented, Tabs } from '@lobehub/ui';
import { memo, useId, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ShareDataProvider from '@/features/ShareModal/ShareDataProvider';
import SharePdf from '@/features/ShareModal/SharePdf';
import { useIsMobile } from '@/hooks/useIsMobile';

import { useConversationStore } from '../../store';
import ShareImage from './ShareImage';
import ShareText from './ShareText';

enum Tab {
  PDF = 'pdf',
  Screenshot = 'screenshot',
  Text = 'text',
}

export interface ShareModalProps {
  message: UIChatMessage;
  onCancel: () => void;
  open: boolean;
}

const ShareModal = memo<ShareModalProps>(({ onCancel, open, message }) => {
  const [tab, setTab] = useState<Tab>(Tab.Screenshot);
  const { t } = useTranslation('chat');
  const uniqueId = useId();
  const isMobile = useIsMobile();
  const context = useConversationStore((s) => s.context);

  const tabItems = useMemo(() => {
    const items = [
      {
        children: <ShareImage message={message} mobile={isMobile} uniqueId={uniqueId} />,
        key: Tab.Screenshot,
        label: t('shareModal.screenshot'),
      },
      {
        children: <ShareText item={message} />,
        key: Tab.Text,
        label: t('shareModal.text'),
      },
      {
        children: (
          <ShareDataProvider context={context}>
            <SharePdf message={message} />
          </ShareDataProvider>
        ),
        key: Tab.PDF,
        label: t('shareModal.pdf'),
      },
    ];

    return items;
  }, [context, isMobile, message, uniqueId, t]);

  return (
    <Modal
      allowFullscreen
      centered={false}
      destroyOnHidden={true}
      footer={null}
      open={open}
      title={t('share', { ns: 'common' })}
      width={1440}
      onCancel={onCancel}
    >
      <Flexbox gap={isMobile ? 8 : 24}>
        <Segmented
          block
          style={{ width: '100%' }}
          value={tab}
          variant={'filled'}
          options={tabItems.map((item) => {
            return {
              label: item?.label,
              value: item?.key,
            };
          })}
          onChange={(value) => setTab(value as Tab)}
        />
        <Tabs
          activeKey={tab}
          indicator={{ align: 'center', size: (origin) => origin - 20 }}
          items={tabItems}
          renderTabBar={() => <></>}
          onChange={(key) => setTab(key as Tab)}
        />
      </Flexbox>
    </Modal>
  );
});

export default ShareModal;
