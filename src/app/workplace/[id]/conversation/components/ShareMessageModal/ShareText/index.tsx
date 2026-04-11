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
import { Button, copyToClipboard, Flexbox } from '@lobehub/ui';
import { App } from 'antd';
import isEqual from 'fast-deep-equal';
import { CopyIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { exportFile } from '@/utils/client';

import { styles } from '../style';
import Preview from './Preview';
import { generateMarkdown } from './template';

interface ShareTextProps {
  item: UIChatMessage;
}

const ShareText = memo<ShareTextProps>(({ item }) => {
  const { t } = useTranslation(['chat', 'common']);
  const { message } = App.useApp();

  const messages = [item];
  const topic = useChatStore(topicSelectors.currentActiveTopic, isEqual);

  const title = topic?.title || t('shareModal.exportTitle');
  const content = generateMarkdown({
    messages,
  }).replaceAll('\n\n\n', '\n');

  const isMobile = useIsMobile();

  const button = (
    <>
      <Button
        block
        icon={CopyIcon}
        size={isMobile ? undefined : 'large'}
        type={'primary'}
        onClick={async () => {
          await copyToClipboard(content);
          message.success(t('copySuccess', { ns: 'common' }));
        }}
      >
        {t('copy', { ns: 'common' })}
      </Button>
      <Button
        block
        size={isMobile ? undefined : 'large'}
        onClick={() => {
          exportFile(content, `${title}.md`);
        }}
      >
        {t('shareModal.downloadFile')}
      </Button>
    </>
  );

  return (
    <>
      <Flexbox className={styles.body} gap={16} horizontal={!isMobile}>
        <Preview content={content} />
        <Flexbox className={styles.sidebar} gap={12}>
          {!isMobile && button}
        </Flexbox>
      </Flexbox>
      {isMobile && (
        <Flexbox horizontal className={styles.footer} gap={8}>
          {button}
        </Flexbox>
      )}
    </>
  );
});

export default ShareText;
