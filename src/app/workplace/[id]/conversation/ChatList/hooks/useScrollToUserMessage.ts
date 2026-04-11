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

import { useCallback, useEffect, useRef } from 'react';

const PIN_RETRY_DELAYS = [0, 32, 96];

interface UseScrollToUserMessageOptions {
  /**
   * Current data source length (number of messages)
   */
  dataSourceLength: number;
  /**
   * Whether the second-to-last message is from the user
   * (When sending a message, user + assistant messages are created as a pair)
   */
  isSecondLastMessageFromUser: boolean;
  /**
   * Function to scroll to a specific index
   */
  scrollToIndex:
    | ((index: number, options?: { align?: 'start' | 'center' | 'end'; smooth?: boolean }) => void)
    | null;
  /**
   * Whether the conversation spacer is mounted and providing fill height.
   * When the spacer mounts after the initial scroll, a follow-up scroll is
   * fired so the user message lands at the correct position once the extra
   * height is available.
   */
  spacerActive: boolean;
}

/**
 * Hook to handle scrolling to user message when user sends a new message.
 * Only triggers scroll when user sends a new message (detected by checking if
 * 2 new messages were added and the second-to-last is from user).
 *
 * Scrolls immediately on message send (works when content already fills the
 * viewport). If a conversation spacer mounts afterwards (adding fill height),
 * a follow-up scroll is fired so the user message lands correctly.
 *
 * This ensures that in group chat scenarios, when multiple agents are responding,
 * the view doesn't jump around as each agent starts speaking.
 */
export function useScrollToUserMessage({
  dataSourceLength,
  isSecondLastMessageFromUser,
  scrollToIndex,
  spacerActive,
}: UseScrollToUserMessageOptions): void {
  const prevLengthRef = useRef(dataSourceLength);
  const timerIdsRef = useRef<number[]>([]);
  // Index of the user message that needs to be scrolled to, or null if no pending scroll
  const pendingScrollIndexRef = useRef<number | null>(null);

  const clearPendingPins = useCallback(() => {
    timerIdsRef.current.forEach((timerId) => {
      window.clearTimeout(timerId);
    });
    timerIdsRef.current = [];
  }, []);

  const executeScroll = useCallback(
    (userMessageIndex: number) => {
      if (!scrollToIndex) return;

      clearPendingPins();

      PIN_RETRY_DELAYS.forEach((delay) => {
        const timerId = window.setTimeout(() => {
          scrollToIndex(userMessageIndex, {
            align: 'start',
            smooth: true,
          });
        }, delay);

        timerIdsRef.current.push(timerId);
      });
    },
    [clearPendingPins, scrollToIndex],
  );

  useEffect(() => {
    return clearPendingPins;
  }, [clearPendingPins]);

  // Detect when user sends a new message and scroll immediately
  useEffect(() => {
    const newMessageCount = dataSourceLength - prevLengthRef.current;
    prevLengthRef.current = dataSourceLength;

    // Only scroll when user sends a new message (2 messages added: user + assistant pair)
    if (newMessageCount === 2 && isSecondLastMessageFromUser && scrollToIndex) {
      const userMessageIndex = dataSourceLength - 2;

      // Always scroll immediately – works when content already fills the viewport.
      // Also store the index so a follow-up scroll can fire once the spacer mounts.
      pendingScrollIndexRef.current = userMessageIndex;
      executeScroll(userMessageIndex);
    }
  }, [dataSourceLength, isSecondLastMessageFromUser, scrollToIndex, executeScroll]);

  // Re-scroll when spacer mounts (provides the extra fill height)
  useEffect(() => {
    if (spacerActive && pendingScrollIndexRef.current !== null) {
      const index = pendingScrollIndexRef.current;
      pendingScrollIndexRef.current = null;
      executeScroll(index);
    }
  }, [spacerActive, executeScroll]);
}
