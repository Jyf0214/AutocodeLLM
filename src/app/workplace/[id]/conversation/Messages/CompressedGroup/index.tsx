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

import type { CompressionGroupMetadata, UIChatMessage } from '@lobechat/types';
import {
  ActionIcon,
  Flexbox,
  Icon,
  Markdown,
  ScrollShadow,
  Tabs,
  type TabsProps,
} from '@lobehub/ui';
import { App } from 'antd';
import { createStaticStyles, cx } from 'antd-style';
import isEqual from 'fast-deep-equal';
import { ChevronDown, ChevronUp, History, Sparkles, Undo2 } from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import StreamingMarkdown from '@/components/StreamingMarkdown';
import { useChatStore } from '@/store/chat';
import { operationSelectors } from '@/store/chat/selectors';
import { shinyTextStyles } from '@/styles/loading';

import { dataSelectors, useConversationStore } from '../../store';
import CompressedMessageItem from './CompressedMessageItem';
import { isCompressionSummaryGenerating, shouldShowCompressedGroupPanel } from './logic';

const STORAGE_KEY_PREFIX = 'compressed-group-tab:';

const getStoredTab = (id: string): string => {
  if (typeof window === 'undefined') return 'summary';
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`) || 'summary';
};

const setStoredTab = (id: string, tab: string) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, tab);
};

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    margin-block-end: 8px;
    padding-block: 8px;
    padding-inline: 12px;
    border: 1px solid ${cssVar.colorBorderSecondary};
    border-radius: 12px;

    background: ${cssVar.colorBgContainer};
  `,
  contentScroll: css`
    max-height: min(40vh, 400px);
  `,
  header: css`
    .ant-tabs-nav {
      margin-block-end: 0;
    }
  `,
  messagesContainer: css`
    padding-block: 8px;
  `,
}));

export interface CompressedGroupMessageProps {
  id: string;
  index: number;
}

const CompressedGroupMessage = memo<CompressedGroupMessageProps>(({ id }) => {
  const { t } = useTranslation('chat');
  const { modal } = App.useApp();
  const [activeTab, setActiveTab] = useState<string>(() => getStoredTab(id));

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      setStoredTab(id, tab);
    },
    [id],
  );

  const message = useConversationStore(dataSelectors.getDisplayMessageById(id), isEqual);
  const toggleCompressedGroupExpanded = useConversationStore(
    (s) => s.toggleCompressedGroupExpanded,
  );
  const cancelCompression = useConversationStore((s) => s.cancelCompression);

  const handleCancelCompression = useCallback(() => {
    modal.confirm({
      centered: true,
      content: t('compression.cancelConfirm'),
      onOk: () => cancelCompression(id),
      title: t('compression.cancel'),
    });
  }, [id, cancelCompression, modal, t]);

  const content = message?.content;
  const rawCompressedMessages = (message as UIChatMessage)?.compressedMessages;
  const expanded = (message?.metadata as CompressionGroupMetadata)?.expanded ?? true;

  // Filter out placeholder assistant message (content === '...' without tools)
  const compressedMessages = useMemo(() => {
    if (!rawCompressedMessages || rawCompressedMessages.length === 0) return rawCompressedMessages;

    const lastMsg = rawCompressedMessages.at(-1);
    const isPlaceholder =
      lastMsg &&
      (lastMsg.role === 'assistant' || lastMsg.role === 'assistantGroup') &&
      lastMsg.content === '...' &&
      (!lastMsg.tools || lastMsg.tools.length === 0) &&
      (!lastMsg.children || lastMsg.children.length === 0);

    return isPlaceholder ? rawCompressedMessages.slice(0, -1) : rawCompressedMessages;
  }, [rawCompressedMessages]);

  // Check if generateSummary operation is running for this message
  const runningOp = useChatStore(operationSelectors.getDeepestRunningOperationByMessage(id));
  const isGeneratingSummary = isCompressionSummaryGenerating(runningOp?.type);

  const showPanelContent = shouldShowCompressedGroupPanel({
    expanded,
    isGeneratingSummary,
  });

  const tabItems: TabsProps['items'] = useMemo(
    () => [
      {
        icon: <Icon icon={Sparkles} size={14} />,
        key: 'summary',
        label: t('compression.summary'),
      },
      {
        icon: <Icon icon={History} size={14} />,
        key: 'history',
        label: t('compression.history'),
      },
    ],
    [],
  );

  return (
    <Flexbox className={styles.container} gap={8}>
      {isGeneratingSummary ? (
        <>
          <Flexbox horizontal>
            {/*<Icon icon={FolderArchive} size={14} />*/}
            <span className={cx(isGeneratingSummary ? shinyTextStyles.shinyText : '')}>
              {t('compressedHistory')}
            </span>
          </Flexbox>
          <StreamingMarkdown>{content}</StreamingMarkdown>
        </>
      ) : (
        <Flexbox horizontal align={'center'} distribution={'space-between'} width={'100%'}>
          <Tabs
            compact
            activeKey={isGeneratingSummary ? 'summary' : activeTab}
            className={styles.header}
            items={tabItems}
            variant={'rounded'}
            onChange={handleTabChange}
          />
          <Flexbox horizontal gap={4}>
            <ActionIcon
              icon={Undo2}
              size={'small'}
              title={t('compression.cancel')}
              onClick={handleCancelCompression}
            />
            <ActionIcon
              icon={expanded ? ChevronUp : ChevronDown}
              size={'small'}
              onClick={() => toggleCompressedGroupExpanded(id)}
            />
          </Flexbox>
        </Flexbox>
      )}
      {!showPanelContent ? null : activeTab === 'summary' ? (
        <ScrollShadow className={styles.contentScroll} offset={12} size={12}>
          <Markdown style={{ overflow: 'unset' }} variant={'chat'}>
            {content}
          </Markdown>
        </ScrollShadow>
      ) : (
        <ScrollShadow className={styles.contentScroll} offset={12} size={12}>
          <Flexbox className={styles.messagesContainer} gap={4}>
            {compressedMessages?.map((msg) => (
              <CompressedMessageItem key={msg.id} message={msg} />
            ))}
          </Flexbox>
        </ScrollShadow>
      )}
    </Flexbox>
  );
});

CompressedGroupMessage.displayName = 'CompressedGroupMessage';

export default CompressedGroupMessage;
