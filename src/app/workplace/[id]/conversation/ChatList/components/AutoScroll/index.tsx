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

import { memo, useEffect } from 'react';

import {
  dataSelectors,
  messageStateSelectors,
  useConversationStore,
  virtuaListSelectors,
} from '../../../store';

/**
 * AutoScroll component - handles auto-scrolling logic during AI generation.
 * Should be placed inside the last item of VList so it only triggers when visible.
 *
 * This component has no visual output - it only contains the auto-scroll logic.
 * Debug UI and BackBottom button are rendered separately outside VList.
 */
const AutoScroll = memo(() => {
  const atBottom = useConversationStore(virtuaListSelectors.atBottom);
  const isScrolling = useConversationStore(virtuaListSelectors.isScrolling);
  const isGenerating = useConversationStore(messageStateSelectors.isAIGenerating);
  const scrollToBottom = useConversationStore((s) => s.scrollToBottom);
  const dbMessages = useConversationStore(dataSelectors.dbMessages);

  const shouldAutoScroll = atBottom && isGenerating && !isScrolling;

  // Get the content length of the last message to monitor streaming output
  const lastMessage = dbMessages.at(-1);
  const lastMessageContentLength =
    typeof lastMessage?.content === 'string' ? lastMessage.content.length : 0;

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom(false);
    }
  }, [shouldAutoScroll, scrollToBottom, dbMessages.length, lastMessageContentLength]);

  // No visual output - this component only handles auto-scroll logic
  return null;
});

AutoScroll.displayName = 'ConversationAutoScroll';

export default AutoScroll;
