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

import { Center, Flexbox, Icon } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import { Loader2 } from 'lucide-react';
import { memo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsDark } from '@/hooks/useIsDark';
import { useChatStore } from '@/store/chat';
import { chatPortalSelectors, messageStateSelectors } from '@/store/chat/selectors';
import { dotLoading } from '@/styles/loading';

import { type MarkdownElementProps } from '../../type';
import ArtifactIcon from './Icon';

const styles = createStaticStyles(({ css, cssVar }) => ({
  avatar: css`
    border-inline-end: 1px solid ${cssVar.colorSplit};
    background: ${cssVar.colorFillQuaternary};
  `,
  container: css`
    cursor: pointer;

    margin-block-start: 12px;
    border: 1px solid ${cssVar.colorBorder};
    border-radius: 8px;

    color: ${cssVar.colorText};

    box-shadow: ${cssVar.boxShadowTertiary};

    &:hover {
      background: ${cssVar.colorFillQuaternary};
    }
  `,
  container_dark: css`
    box-shadow: ${cssVar.boxShadowSecondary};
  `,
  desc: css`
    font-size: 12px;
    color: ${cssVar.colorTextTertiary};
  `,
  title: css`
    overflow: hidden;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 1;

    text-overflow: ellipsis;
  `,
}));

interface ArtifactProps extends MarkdownElementProps {
  identifier: string;
  language?: string;
  title: string;
  type: string;
}

const Render = memo<ArtifactProps>(({ identifier, title, type, language, children, id }) => {
  const { t } = useTranslation('chat');
  const isDarkMode = useIsDark();

  const hasChildren = !!children;
  const str = ((children as string) || '').toString?.();

  const [isGenerating, isArtifactTagClosed, openArtifact, closeArtifact] = useChatStore((s) => {
    return [
      messageStateSelectors.isMessageGenerating(id)(s),
      chatPortalSelectors.isArtifactTagClosed(id, identifier)(s),
      s.openArtifact,
      s.closeArtifact,
    ];
  });

  const openArtifactUI = () => {
    openArtifact({ id, identifier, language, title, type });
  };

  useEffect(() => {
    if (!hasChildren || !isGenerating) return;

    openArtifactUI();
  }, [isGenerating, hasChildren, str, identifier, title, type, id, language]);

  return (
    <Flexbox
      className={cx(styles.container, isDarkMode && styles.container_dark)}
      gap={16}
      width={'100%'}
      onClick={() => {
        const state = useChatStore.getState();
        const currentArtifactMessageId = chatPortalSelectors.artifactMessageId(state);
        const currentArtifactIdentifier = chatPortalSelectors.artifactIdentifier(state);
        if (currentArtifactMessageId === id && currentArtifactIdentifier === identifier) {
          closeArtifact();
        } else {
          openArtifactUI();
        }
      }}
    >
      <Flexbox horizontal align={'center'} flex={1}>
        <Center horizontal className={styles.avatar} height={64} width={64}>
          <ArtifactIcon type={type} />
        </Center>
        <Flexbox gap={4} paddingBlock={8} paddingInline={12}>
          {!title && isGenerating ? (
            <Flexbox horizontal className={cx(dotLoading)}>
              {t('artifact.generating')}
            </Flexbox>
          ) : (
            <Flexbox className={cx(styles.title)}>{title || t('artifact.unknownTitle')}</Flexbox>
          )}
          {hasChildren && (
            <Flexbox horizontal className={styles.desc}>
              {identifier} ·{' '}
              <Flexbox horizontal gap={2}>
                {!isArtifactTagClosed && (
                  <div>
                    <Icon spin icon={Loader2} />
                  </div>
                )}
                {str?.length}
              </Flexbox>
            </Flexbox>
          )}
        </Flexbox>
      </Flexbox>
    </Flexbox>
  );
});

export default Render;
