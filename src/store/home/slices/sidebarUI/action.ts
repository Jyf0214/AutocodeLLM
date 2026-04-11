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
import { agentService } from '@/services/agent';
import { chatGroupService } from '@/services/chatGroup';
import { homeService } from '@/services/home';
import { sessionService } from '@/services/session';
import { getAgentStoreState } from '@/store/agent';
import { type HomeStore } from '@/store/home/store';
import { type StoreSetter } from '@/store/types';
import { type SessionGroupItemBase } from '@/types/session';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('sidebarUI');

type Setter = StoreSetter<HomeStore>;
export const createSidebarUISlice = (set: Setter, get: () => HomeStore, _api?: unknown) =>
  new SidebarUIActionImpl(set, get, _api);

export class SidebarUIActionImpl {
  readonly #get: () => HomeStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => HomeStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  duplicateAgent = async (agentId: string, newTitle?: string): Promise<void> => {
    const messageLoadingKey = 'duplicateAgent.loading';

    message.loading({
      content: t('duplicateSession.loading', { ns: 'chat' }),
      duration: 0,
      key: messageLoadingKey,
    });

    const result = await agentService.duplicateAgent(agentId, newTitle);

    if (!result) {
      message.destroy(messageLoadingKey);
      message.error(t('copyFail', { ns: 'common' }));
      return;
    }

    await this.#get().refreshAgentList();
    message.destroy(messageLoadingKey);
    message.success(t('duplicateSession.success', { ns: 'chat' }));

    // Switch to the new agent
    const agentStore = getAgentStoreState();
    agentStore.setActiveAgentId(result.agentId);
  };

  duplicateAgentGroup = async (groupId: string, newTitle?: string): Promise<void> => {
    const messageLoadingKey = 'duplicateAgentGroup.loading';

    message.loading({
      content: t('duplicateSession.loading', { ns: 'chat' }),
      duration: 0,
      key: messageLoadingKey,
    });

    const result = await chatGroupService.duplicateGroup(groupId, newTitle);

    if (!result) {
      message.destroy(messageLoadingKey);
      message.error(t('copyFail', { ns: 'common' }));
      return;
    }

    await this.#get().refreshAgentList();
    message.destroy(messageLoadingKey);
    message.success(t('duplicateSession.success', { ns: 'chat' }));

    // Switch to the new group (using supervisor agent id)
    const agentStore = getAgentStoreState();
    agentStore.setActiveAgentId(result.supervisorAgentId);
  };

  pinAgent = async (agentId: string, pinned: boolean): Promise<void> => {
    await agentService.updateAgentPinned(agentId, pinned);
    await this.#get().refreshAgentList();
  };

  pinAgentGroup = async (groupId: string, pinned: boolean): Promise<void> => {
    await chatGroupService.updateGroup(groupId, { pinned });
    await this.#get().refreshAgentList();
  };

  removeAgent = async (agentId: string): Promise<void> => {
    await agentService.removeAgent(agentId);
    await this.#get().refreshAgentList();
  };

  removeAgentGroup = async (groupId: string): Promise<void> => {
    // Delete the group
    await chatGroupService.deleteGroup(groupId);
    await this.#get().refreshAgentList();
  };

  renameAgentGroup = async (
    groupId: string,
    title: string,
    avatar?: string | null,
    backgroundColor?: string,
  ): Promise<void> => {
    await chatGroupService.updateGroup(groupId, { avatar, backgroundColor, title });
    await this.#get().refreshAgentList();
  };

  updateAgentGroup = async (agentId: string, groupId: string | null): Promise<void> => {
    await homeService.updateAgentSessionGroupId(agentId, groupId === 'default' ? null : groupId);
    await this.#get().refreshAgentList();
  };

  addGroup = async (name: string): Promise<string> => {
    const id = await sessionService.createSessionGroup(name);
    await this.#get().refreshAgentList();
    return id;
  };

  removeGroup = async (groupId: string): Promise<void> => {
    await sessionService.removeSessionGroup(groupId);
    await this.#get().refreshAgentList();
  };

  updateGroupName = async (groupId: string, name: string): Promise<void> => {
    await sessionService.updateSessionGroup(groupId, { name });
    await this.#get().refreshAgentList();
  };

  updateGroupSort = async (items: SessionGroupItemBase[]): Promise<void> => {
    const sortMap = items.map((item, index) => ({ id: item.id, sort: index }));

    message.loading({
      content: t('sessionGroup.sorting', { ns: 'chat' }),
      duration: 0,
      key: 'updateGroupSort',
    });

    await sessionService.updateSessionGroupOrder(sortMap);
    message.destroy('updateGroupSort');
    message.success(t('sessionGroup.sortSuccess', { ns: 'chat' }));

    await this.#get().refreshAgentList();
  };

  setAgentUpdatingId = (id: string | null): void => {
    this.#set({ agentUpdatingId: id }, false, n('setAgentUpdatingId'));
  };

  setGroupUpdatingId = (id: string | null): void => {
    this.#set({ groupUpdatingId: id }, false, n('setGroupUpdatingId'));
  };
}

export type SidebarUIAction = Pick<SidebarUIActionImpl, keyof SidebarUIActionImpl>;
