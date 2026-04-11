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

import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { ActionIcon, Flexbox, Tooltip } from '@lobehub/ui';
import { Popover } from 'antd';
import { createStaticStyles, useTheme } from 'antd-style';
import { PlusIcon, SmilePlus } from 'lucide-react';
import { type FC, memo, type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useGlobalStore } from '@/store/global';
import { globalGeneralSelectors } from '@/store/global/selectors';

import { useConversationStore } from '../../store';

const QUICK_REACTIONS = ['👍', '👎', '❤️', '😄', '😂', '😅', '🎉', '😢', '🤔', '🚀'];

const styles = createStaticStyles(({ css, cssVar }) => ({
  emojiButton: css`
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border-radius: ${cssVar.borderRadius};

    font-size: 18px;

    transition: all 0.2s;

    &:hover {
      transform: scale(1.1);
      background: ${cssVar.colorFillSecondary};
    }
  `,
  moreButton: css`
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;

    width: 32px;
    height: 32px;
    border-radius: ${cssVar.borderRadius};

    color: ${cssVar.colorTextTertiary};

    transition: all 0.2s;

    &:hover {
      color: ${cssVar.colorText};
      background: ${cssVar.colorFillSecondary};
    }
  `,
  pickerContainer: css`
    padding: 4px;
  `,
}));

interface ReactionPickerProps {
  messageId: string;
  trigger?: ReactNode;
}

const ReactionPicker: FC<ReactionPickerProps> = memo(({ messageId, trigger }) => {
  const { t } = useTranslation('chat');
  const theme = useTheme();
  const locale = useGlobalStore(globalGeneralSelectors.currentLanguage);
  const addReaction = useConversationStore((s) => s.addReaction);
  const [open, setOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);

  const handleSelect = (emoji: string) => {
    addReaction(messageId, emoji);
    setOpen(false);
    setShowFullPicker(false);
  };

  const handleOpenChange = (visible: boolean) => {
    setOpen(visible);
    if (!visible) setShowFullPicker(false);
  };

  const content = showFullPicker ? (
    <Picker
      data={data}
      locale={locale?.split('-')[0] || 'en'}
      previewPosition="none"
      skinTonePosition="none"
      theme={theme.appearance === 'dark' ? 'dark' : 'light'}
      onEmojiSelect={(emoji: any) => handleSelect(emoji.native)}
    />
  ) : (
    <Flexbox horizontal className={styles.pickerContainer} gap={4} wrap="wrap">
      {QUICK_REACTIONS.map((emoji) => (
        <div className={styles.emojiButton} key={emoji} onClick={() => handleSelect(emoji)}>
          {emoji}
        </div>
      ))}
      <div className={styles.moreButton} onClick={() => setShowFullPicker(true)}>
        <PlusIcon size={16} />
      </div>
    </Flexbox>
  );

  return (
    <Popover
      arrow={false}
      content={content}
      open={open}
      overlayInnerStyle={{ padding: 0 }}
      placement="top"
      trigger="click"
      onOpenChange={handleOpenChange}
    >
      {trigger || (
        <span {...(open ? { 'data-popup-open': '' } : {})}>
          <Tooltip title={t('messageAction.reaction')}>
            <ActionIcon icon={SmilePlus} size="small" />
          </Tooltip>
        </span>
      )}
    </Popover>
  );
});

ReactionPicker.displayName = 'ReactionPicker';

export default ReactionPicker;
