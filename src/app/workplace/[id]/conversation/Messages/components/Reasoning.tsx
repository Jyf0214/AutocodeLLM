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

import { type MessageContentPart } from '@lobechat/types';
import { deserializeParts } from '@lobechat/utils';
import { memo } from 'react';

import Thinking from '@/features/Conversation/components/Thinking';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/selectors';

import { messageStateSelectors, useConversationStore } from '../../store';
import { RichContentRenderer } from './RichContentRenderer';

interface ReasoningProps {
  content?: string;
  duration?: number;
  id: string;
  isMultimodal?: boolean;
  tempDisplayContent?: MessageContentPart[];
}

const Reasoning = memo<ReasoningProps>(
  ({ content = '', duration, id, isMultimodal, tempDisplayContent }) => {
    const isReasoning = useConversationStore(messageStateSelectors.isMessageInReasoning(id));
    const transitionMode = useUserStore(userGeneralSettingsSelectors.transitionMode);

    const parts = tempDisplayContent || deserializeParts(content);

    // If parts are provided, render multimodal content
    const thinkingContent = isMultimodal && parts ? <RichContentRenderer parts={parts} /> : content;

    return (
      <Thinking
        content={thinkingContent}
        duration={duration}
        thinking={isReasoning}
        thinkingAnimated={transitionMode === 'fadeIn' && isReasoning}
      />
    );
  },
);

export default Reasoning;
