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

import { produce } from 'immer';

import { INBOX_SESSION_ID } from '@/const/session';
import { SESSION_CHAT_URL } from '@/const/url';
import { type GlobalStore } from '@/store/global';
import { type StoreSetter } from '@/store/types';
import { setNamespace } from '@/utils/storeDebug';

const n = setNamespace('w');

type Setter = StoreSetter<GlobalStore>;
export const globalWorkspaceSlice = (set: Setter, get: () => GlobalStore, _api?: unknown) =>
  new GlobalWorkspacePaneActionImpl(set, get, _api);

export class GlobalWorkspacePaneActionImpl {
  readonly #get: () => GlobalStore;

  constructor(set: Setter, get: () => GlobalStore, _api?: unknown) {
    void _api;
    void set;
    this.#get = get;
  }

  switchBackToChat = (sessionId?: string): void => {
    const target = SESSION_CHAT_URL(sessionId || INBOX_SESSION_ID, this.#get().isMobile);
    this.#get().navigate?.(target);
  };

  toggleAgentSystemRoleExpand = (agentId: string, expanded?: boolean): void => {
    const { status } = this.#get();
    const systemRoleExpandedMap = status.systemRoleExpandedMap || {};
    const nextExpanded = typeof expanded === 'boolean' ? expanded : !systemRoleExpandedMap[agentId];

    this.#get().updateSystemStatus(
      {
        systemRoleExpandedMap: {
          ...systemRoleExpandedMap,
          [agentId]: nextExpanded,
        },
      },
      n('toggleAgentSystemRoleExpand', { agentId, expanded: nextExpanded }),
    );
  };

  toggleCommandMenu = (visible?: boolean): void => {
    const currentVisible = this.#get().status.showCommandMenu;
    this.#get().updateSystemStatus({
      showCommandMenu: typeof visible === 'boolean' ? visible : !currentVisible,
    });
  };

  toggleExpandInputActionbar = (newValue?: boolean): void => {
    const expandInputActionbar =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.expandInputActionbar;

    this.#get().updateSystemStatus(
      { expandInputActionbar },
      n('toggleExpandInputActionbar', newValue),
    );
  };

  toggleExpandSessionGroup = (id: string, expand: boolean): void => {
    const { status } = this.#get();
    const nextExpandSessionGroup = produce(status.expandSessionGroupKeys, (draft: string[]) => {
      if (expand) {
        if (draft.includes(id)) return;
        draft.push(id);
      } else {
        const index = draft.indexOf(id);
        if (index !== -1) draft.splice(index, 1);
      }
    });
    this.#get().updateSystemStatus({ expandSessionGroupKeys: nextExpandSessionGroup });
  };

  toggleLeftPanel = (newValue?: boolean): void => {
    const showLeftPanel =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.showLeftPanel;
    this.#get().updateSystemStatus({ showLeftPanel }, n('toggleLeftPanel', newValue));
  };

  toggleMobilePortal = (newValue?: boolean): void => {
    const mobileShowPortal =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.mobileShowPortal;

    this.#get().updateSystemStatus({ mobileShowPortal }, n('toggleMobilePortal', newValue));
  };

  toggleMobileTopic = (newValue?: boolean): void => {
    const mobileShowTopic =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.mobileShowTopic;

    this.#get().updateSystemStatus({ mobileShowTopic }, n('toggleMobileTopic', newValue));
  };

  toggleRightPanel = (newValue?: boolean): void => {
    const showRightPanel =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.showRightPanel;

    this.#get().updateSystemStatus({ showRightPanel }, n('toggleRightPanel', newValue));
  };

  toggleSystemRole = (newValue?: boolean): void => {
    const showSystemRole =
      typeof newValue === 'boolean' ? newValue : !this.#get().status.mobileShowTopic;

    this.#get().updateSystemStatus({ showSystemRole }, n('toggleMobileTopic', newValue));
  };

  toggleWideScreen = (newValue?: boolean): void => {
    const noWideScreen =
      typeof newValue === 'boolean' ? !newValue : !this.#get().status.noWideScreen;

    this.#get().updateSystemStatus({ noWideScreen }, n('toggleWideScreen', newValue));
  };

  toggleZenMode = (): void => {
    const { status } = this.#get();
    const nextZenMode = !status.zenMode;

    this.#get().updateSystemStatus({ zenMode: nextZenMode }, n('toggleZenMode'));
  };
}

export type GlobalWorkspacePaneAction = Pick<
  GlobalWorkspacePaneActionImpl,
  keyof GlobalWorkspacePaneActionImpl
>;
