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

import {
  type ChatMessageExtra,
  type ChatToolPayload,
  type CreateMessageParams,
  type MessagePluginItem,
  type UIChatMessage,
} from '@lobechat/types';
import isEqual from 'fast-deep-equal';
import i18n from 'i18next';
import { produce } from 'immer';

import { merge } from '@/utils/merge';

interface UpdateMessages {
  type: 'updateMessages';
  value: UIChatMessage[];
}

interface UpdateMessage {
  id: string;
  type: 'updateMessage';
  value: Partial<UIChatMessage>;
}

interface CreateMessage {
  id: string;
  type: 'createMessage';
  value: CreateMessageParams;
}

interface DeleteMessage {
  id: string;
  type: 'deleteMessage';
}

interface DeleteMessages {
  ids: string[];
  type: 'deleteMessages';
}

interface UpdatePluginState {
  id: string;
  key: string;
  type: 'updatePluginState';
  value: any;
}

interface UpdateMessagePlugin {
  id: string;
  type: 'updateMessagePlugin';
  value: Partial<MessagePluginItem>;
}

interface UpdateMessageTools {
  id: string;
  tool_call_id: string;
  type: 'updateMessageTools';
  value: Partial<ChatToolPayload>;
}

interface AddMessageTool {
  id: string;
  type: 'addMessageTool';
  value: ChatToolPayload;
}
interface DeleteMessageTool {
  id: string;
  tool_call_id: string;
  type: 'deleteMessageTool';
}

interface UpdateMessageExtra {
  id: string;
  key: string;
  type: 'updateMessageExtra';
  value: any;
}

interface UpdateMessageMetadata {
  id: string;
  type: 'updateMessageMetadata';
  value: Partial<UIChatMessage['metadata']>;
}

export type MessageDispatch =
  | CreateMessage
  | UpdateMessage
  | UpdateMessages
  | UpdatePluginState
  | UpdateMessageExtra
  | UpdateMessageMetadata
  | DeleteMessage
  | UpdateMessagePlugin
  | UpdateMessageTools
  | AddMessageTool
  | DeleteMessageTool
  | DeleteMessages;

export const messagesReducer = (
  state: UIChatMessage[],
  payload: MessageDispatch,
): UIChatMessage[] => {
  switch (payload.type) {
    case 'updateMessage': {
      return produce(state, (draftState) => {
        const { id, value } = payload;

        const index = draftState.findIndex((i) => i.id === id);
        if (index >= 0) {
          draftState[index] = merge(draftState[index], { ...value, updatedAt: Date.now() });
        }
      });
    }

    case 'updateMessageExtra': {
      return produce(state, (draftState) => {
        const { id, key, value } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message) return;

        if (!message.extra) {
          message.extra = { [key]: value } as ChatMessageExtra;
        } else {
          message.extra[key as keyof ChatMessageExtra] = value;
        }

        message.updatedAt = Date.now();
      });
    }

    case 'updateMessageMetadata': {
      return produce(state, (draftState) => {
        const { id, value } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message) return;

        message.metadata = merge(message.metadata, value);
        message.updatedAt = Date.now();
      });
    }

    case 'updatePluginState': {
      return produce(state, (draftState) => {
        const { id, key, value } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message) return;

        let newState;
        if (!message.pluginState) {
          newState = { [key]: value } as any;
        } else {
          newState = merge(message.pluginState, { [key]: value });
        }

        if (isEqual(message.pluginState, newState)) return;

        message.pluginState = newState;
        message.updatedAt = Date.now();
      });
    }

    case 'updateMessagePlugin': {
      return produce(state, (draftState) => {
        const { id, value } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message || message.role !== 'tool') return;

        message.plugin = merge(message.plugin, value);
        message.updatedAt = Date.now();
      });
    }

    case 'addMessageTool': {
      return produce(state, (draftState) => {
        const { id, value } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message || message.role !== 'assistant') return;

        if (!message.tools) {
          message.tools = [value];
        } else {
          const index = message.tools.findIndex((tool) => tool.id === value.id);

          if (index > 0) return;
          message.tools.push(value);
        }

        message.updatedAt = Date.now();
      });
    }

    case 'deleteMessageTool': {
      return produce(state, (draftState) => {
        const { id, tool_call_id } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message || message.role !== 'assistant' || !message.tools) return;

        message.tools = message.tools.filter((tool) => tool.id !== tool_call_id);

        message.updatedAt = Date.now();
      });
    }

    case 'updateMessageTools': {
      return produce(state, (draftState) => {
        const { id, value, tool_call_id } = payload;
        const message = draftState.find((i) => i.id === id);
        if (!message || message.role !== 'assistant' || !message.tools) return;

        const index = message.tools.findIndex((tool) => tool.id === tool_call_id);

        if (index < 0) return;
        message.tools[index] = merge(message.tools[index], value);

        message.updatedAt = Date.now();
      });
    }

    case 'createMessage': {
      return produce(state, (draftState) => {
        const { value, id } = payload;

        draftState.push({ ...value, createdAt: Date.now(), id, updatedAt: Date.now() });
      });
    }

    case 'updateMessages': {
      return payload.value;
    }

    case 'deleteMessage': {
      return produce(state, (draft) => {
        const { id } = payload;

        const index = draft.findIndex((m) => m.id === id);

        if (index >= 0) draft.splice(index, 1);
      });
    }
    case 'deleteMessages': {
      return produce(state, (draft) => {
        const { ids } = payload;

        return draft.filter((item) => {
          return !ids.includes(item.id);
        });
      });
    }

    default: {
      throw new Error(i18n.t('errors.unimplementedType', { ns: 'common' }));
    }
  }
};
