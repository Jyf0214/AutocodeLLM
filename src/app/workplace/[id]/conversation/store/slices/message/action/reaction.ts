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

import type { EmojiReaction } from '@lobechat/types';
import type { StateCreator } from 'zustand';

import { useUserStore } from '@/store/user';
import { userProfileSelectors } from '@/store/user/selectors';

import type { Store as ConversationStore } from '../../../action';
import { dataSelectors } from '../../data/selectors';

export interface MessageReactionAction {
  /**
   * Add an emoji reaction to a message
   */
  addReaction: (messageId: string, emoji: string) => Promise<void>;

  /**
   * Remove an emoji reaction from a message
   */
  removeReaction: (messageId: string, emoji: string) => Promise<void>;
}

export const messageReactionSlice: StateCreator<
  ConversationStore,
  [['zustand/devtools', never]],
  [],
  MessageReactionAction
> = (set, get) => ({
  addReaction: async (messageId, emoji) => {
    const { updateMessageMetadata } = get();
    const message = dataSelectors.getDisplayMessageById(messageId)(get());
    const userId = userProfileSelectors.userId(useUserStore.getState())!;

    const currentReactions = message?.metadata?.reactions || [];
    const existingIndex = currentReactions.findIndex((r: EmojiReaction) => r.emoji === emoji);

    let newReactions: EmojiReaction[];

    if (existingIndex >= 0) {
      newReactions = currentReactions.map((r: EmojiReaction, i: number) =>
        i === existingIndex ? { ...r, count: r.count + 1, users: [...r.users, userId] } : r,
      );
    } else {
      newReactions = [...currentReactions, { count: 1, emoji, users: [userId] }];
    }

    await updateMessageMetadata(messageId, { reactions: newReactions });
  },

  removeReaction: async (messageId, emoji) => {
    const { updateMessageMetadata } = get();
    const message = dataSelectors.getDisplayMessageById(messageId)(get());
    const userId = userProfileSelectors.userId(useUserStore.getState())!;

    const currentReactions = message?.metadata?.reactions || [];
    const existingIndex = currentReactions.findIndex((r: EmojiReaction) => r.emoji === emoji);

    if (existingIndex < 0) return;

    const emojiReaction = currentReactions[existingIndex];
    let newReactions: EmojiReaction[];

    if (emojiReaction.count <= 1) {
      newReactions = currentReactions.filter((_: EmojiReaction, i: number) => i !== existingIndex);
    } else {
      const userIndex = emojiReaction.users.lastIndexOf(userId);
      const newUsers =
        userIndex >= 0
          ? [
              ...emojiReaction.users.slice(0, userIndex),
              ...emojiReaction.users.slice(userIndex + 1),
            ]
          : emojiReaction.users.slice(0, -1);
      newReactions = currentReactions.map((r: EmojiReaction, i: number) =>
        i === existingIndex ? { ...r, count: r.count - 1, users: newUsers } : r,
      );
    }

    await updateMessageMetadata(messageId, { reactions: newReactions });
  },
});
