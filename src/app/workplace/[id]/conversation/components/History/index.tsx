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

import { ModelTag } from '@lobehub/icons';
import { Center, Flexbox, Icon, Markdown, Text } from '@lobehub/ui';
import { createStaticStyles, cssVar } from 'antd-style';
import { ScrollText } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { agentChatConfigSelectors } from '@/store/agent/selectors';
import { useAgentStore } from '@/store/agent/store';

import { dataSelectors, useConversationStore } from '../../store';
import HistoryDivider from './HistoryDivider';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    padding-inline: 12px;
    border-radius: 12px;
  `,
  content: css`
    color: ${cssVar.colorTextDescription};
  `,
  line: css`
    width: 3px;
    height: 100%;
    background: ${cssVar.colorBorder};
  `,
}));

const History = memo(() => {
  const { t } = useTranslation('chat');
  const [content, model] = useConversationStore(() => {
    const history = dataSelectors.currentTopicSummary();
    return [history?.content, history?.model];
  });

  const enableCompressHistory = useAgentStore(
    (s) => agentChatConfigSelectors.currentChatConfig(s).enableCompressHistory,
  );

  return (
    <Flexbox paddingInline={16} style={{ paddingBottom: 8 }}>
      <HistoryDivider enable />
      {enableCompressHistory && !!content && (
        <Flexbox className={styles.container} gap={8}>
          <Flexbox horizontal align={'flex-start'} gap={8}>
            <Center height={20} width={20}>
              <Icon icon={ScrollText} size={16} style={{ color: cssVar.colorTextDescription }} />
            </Center>
            <Text type={'secondary'}>{t('historySummary')}</Text>
            {model && (
              <div>
                <ModelTag model={model} />
              </div>
            )}
          </Flexbox>
          <Flexbox horizontal align={'flex-start'} gap={8}>
            <Flexbox align={'center'} padding={8} width={20}>
              <div className={styles.line} />
            </Flexbox>
            <Markdown className={styles.content} variant={'chat'}>
              {content}
            </Markdown>
          </Flexbox>
        </Flexbox>
      )}
    </Flexbox>
  );
});

export default History;
