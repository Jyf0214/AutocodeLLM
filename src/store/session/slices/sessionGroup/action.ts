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

import { t } from 'i18next';

import { message } from '@/components/AntdStaticMethods';
import { sessionService } from '@/services/session';
import { type SessionStore } from '@/store/session';
import { type StoreSetter } from '@/store/types';
import { type SessionGroupItem } from '@/types/session';

import { type SessionGroupsDispatch } from './reducer';
import { sessionGroupsReducer } from './reducer';

type Setter = StoreSetter<SessionStore>;
export const createSessionGroupSlice = (set: Setter, get: () => SessionStore, _api?: unknown) =>
  new SessionGroupActionImpl(set, get, _api);

export class SessionGroupActionImpl {
  readonly #get: () => SessionStore;

  constructor(set: Setter, get: () => SessionStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  addSessionGroup = async (name: string): Promise<string> => {
    const id = await sessionService.createSessionGroup(name);

    await this.#get().refreshSessions();

    return id;
  };

  clearSessionGroups = async (): Promise<void> => {
    await sessionService.removeSessionGroups();
    await this.#get().refreshSessions();
  };

  removeSessionGroup = async (id: string): Promise<void> => {
    await sessionService.removeSessionGroup(id);
    await this.#get().refreshSessions();
  };

  updateSessionGroupName = async (id: string, name: string): Promise<void> => {
    await sessionService.updateSessionGroup(id, { name });
    await this.#get().refreshSessions();
  };

  updateSessionGroupSort = async (items: SessionGroupItem[]): Promise<void> => {
    const sortMap = items.map((item, index) => ({ id: item.id, sort: index }));

    this.#get().internal_dispatchSessionGroups({ sortMap, type: 'updateSessionGroupOrder' });

    message.loading({
      content: t('sessionGroup.sorting', { ns: 'chat' }),
      duration: 0,
      key: 'updateSessionGroupSort',
    });

    await sessionService.updateSessionGroupOrder(sortMap);
    message.destroy('updateSessionGroupSort');
    message.success(t('sessionGroup.sortSuccess', { ns: 'chat' }));

    await this.#get().refreshSessions();
  };

  internal_dispatchSessionGroups = (payload: SessionGroupsDispatch): void => {
    const nextSessionGroups = sessionGroupsReducer(this.#get().sessionGroups, payload);
    this.#get().internal_processSessions(this.#get().sessions, nextSessionGroups);
  };
}

export type SessionGroupAction = Pick<SessionGroupActionImpl, keyof SessionGroupActionImpl>;
