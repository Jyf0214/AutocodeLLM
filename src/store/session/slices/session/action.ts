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

import { getSingletonAnalyticsOptional } from '@lobehub/analytics';
import isEqual from 'fast-deep-equal';
import { t } from 'i18next';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';
import { type PartialDeep } from 'type-fest';

import { message } from '@/components/AntdStaticMethods';
import { DEFAULT_AGENT_LOBE_SESSION, INBOX_SESSION_ID } from '@/const/session';
import { mutate, useClientDataSWR } from '@/libs/swr';
import { chatGroupService } from '@/services/chatGroup';
import { sessionService } from '@/services/session';
import { getChatGroupStoreState } from '@/store/agentGroup';
import { type SessionStore } from '@/store/session';
import { type StoreSetter } from '@/store/types';
import { getUserStoreState, useUserStore } from '@/store/user';
import { settingsSelectors, userProfileSelectors } from '@/store/user/selectors';
import {
  type ChatSessionList,
  type LobeAgentSession,
  type LobeSessionGroups,
  type LobeSessions,
  type UpdateSessionParams,
} from '@/types/session';
import { LobeSessionType } from '@/types/session';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

import { type SessionDispatch } from './reducers';
import { sessionsReducer } from './reducers';
import { sessionSelectors } from './selectors';
import { sessionMetaSelectors } from './selectors/meta';

const n = setNamespace('session');

const FETCH_SESSIONS_KEY = 'fetchSessions';
const SEARCH_SESSIONS_KEY = 'searchSessions';

type Setter = StoreSetter<SessionStore>;
export const createSessionSlice = (set: Setter, get: () => SessionStore, _api?: unknown) =>
  new SessionActionImpl(set, get, _api);

export class SessionActionImpl {
  readonly #get: () => SessionStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => SessionStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  clearSessions = async (): Promise<void> => {
    await sessionService.removeAllSessions();
    await this.#get().refreshSessions();
  };

  closeAllAgentsDrawer = (): void => {
    this.#set({ allAgentsDrawerOpen: false }, false, n('closeAllAgentsDrawer'));
  };

  createSession = async (
    agent?: PartialDeep<LobeAgentSession>,
    isSwitchSession: boolean = true,
  ): Promise<string> => {
    const { switchSession, refreshSessions } = this.#get();

    // merge the defaultAgent in settings
    const defaultAgent = merge(
      DEFAULT_AGENT_LOBE_SESSION,
      settingsSelectors.defaultAgent(useUserStore.getState()),
    );

    const newSession: LobeAgentSession = merge(defaultAgent, agent);

    const id = await sessionService.createSession(LobeSessionType.Agent, newSession);
    await refreshSessions();

    // Track new agent creation analytics
    const analytics = getSingletonAnalyticsOptional();
    if (analytics) {
      const userStore = getUserStoreState();
      const userId = userProfileSelectors.userId(userStore);

      analytics.track({
        name: 'new_agent_created',
        properties: {
          assistant_name: newSession.meta?.title || 'Untitled Agent',
          assistant_tags: newSession.meta?.tags || [],
          session_id: id,
          user_id: userId || 'anonymous',
        },
      });
    }

    // Whether to goto  to the new session after creation, the default is to switch to
    if (isSwitchSession) switchSession(id);

    return id;
  };

  duplicateSession = async (id: string): Promise<void> => {
    const { switchSession, refreshSessions } = this.#get();
    const session = sessionSelectors.getSessionById(id)(this.#get());

    if (!session) return;
    const title = sessionMetaSelectors.getTitle(session.meta);

    const newTitle = t('duplicateSession.title', { ns: 'chat', title });

    const messageLoadingKey = 'duplicateSession.loading';

    message.loading({
      content: t('duplicateSession.loading', { ns: 'chat' }),
      duration: 0,
      key: messageLoadingKey,
    });

    const newId = await sessionService.cloneSession(id, newTitle);

    // duplicate Session Error
    if (!newId) {
      message.destroy(messageLoadingKey);
      message.error(t('copyFail', { ns: 'common' }));
      return;
    }

    await refreshSessions();
    message.destroy(messageLoadingKey);
    message.success(t('duplicateSession.success', { ns: 'chat' }));

    switchSession(newId);
  };

  openAllAgentsDrawer = (): void => {
    this.#set({ allAgentsDrawerOpen: true }, false, n('openAllAgentsDrawer'));
  };

  pinSession = async (id: string, pinned: boolean): Promise<void> => {
    await this.#get().internal_updateSession(id, { pinned });
  };

  removeSession = async (sessionId: string): Promise<void> => {
    await sessionService.removeSession(sessionId);
    await this.#get().refreshSessions();

    // If the active session deleted, switch to the inbox session
    if (sessionId === this.#get().activeId) {
      this.#get().switchSession(INBOX_SESSION_ID);
    }
  };

  setAgentPinned = (value: boolean | ((prev: boolean) => boolean)): void => {
    this.#set(
      (state) => ({
        isAgentPinned: typeof value === 'function' ? value(state.isAgentPinned) : value,
      }),
      false,
      n('setAgentPinned'),
    );
  };

  switchSession = (sessionId: string): void => {
    if (this.#get().activeAgentId === sessionId) return;

    this.#set({ activeAgentId: sessionId }, false, n(`activeSession/${sessionId}`));
  };

  toggleAgentPinned = (): void => {
    this.#set((state) => ({ isAgentPinned: !state.isAgentPinned }), false, n('toggleAgentPinned'));
  };

  triggerSessionUpdate = async (id: string): Promise<void> => {
    await this.#get().internal_updateSession(id, { updatedAt: new Date() });
  };

  updateSearchKeywords = (keywords: string): void => {
    this.#set(
      { isSearching: !!keywords, sessionSearchKeywords: keywords },
      false,
      n('updateSearchKeywords'),
    );
  };

  updateSessionGroupId = async (sessionId: string, group: string): Promise<void> => {
    const session = sessionSelectors.getSessionById(sessionId)(this.#get());

    if (session?.type === 'group') {
      // For group sessions (chat groups), use the chat group service
      await chatGroupService.updateGroup(sessionId, {
        groupId: group === 'default' ? null : group,
      });
      await this.#get().refreshSessions();
    } else {
      // For regular agent sessions, use the existing session service
      await this.#get().internal_updateSession(sessionId, { group });
    }
  };

  useFetchSessions = (
    enabled: boolean,
    isLogin: boolean | undefined,
  ): SWRResponse<ChatSessionList> => {
    return useClientDataSWR<ChatSessionList>(
      enabled ? [FETCH_SESSIONS_KEY, isLogin] : null,
      () => sessionService.getGroupedSessions(),
      {
        fallbackData: {
          sessionGroups: [],
          sessions: [],
        },
        onSuccess: (data) => {
          if (
            this.#get().isSessionsFirstFetchFinished &&
            isEqual(this.#get().sessions, data.sessions) &&
            isEqual(this.#get().sessionGroups, data.sessionGroups)
          )
            return;

          this.#get().internal_processSessions(data.sessions, data.sessionGroups);

          // Sync chat groups from group sessions to chat store
          const groupSessions = data.sessions.filter((session) => session.type === 'group');
          if (groupSessions.length > 0) {
            // For group sessions, we need to transform them to ChatGroupItem format
            // The session ID is the chat group ID, and we can extract basic group info
            const chatGroupStore = getChatGroupStoreState();
            const chatGroups = groupSessions.map((session) => ({
              accessedAt: session.updatedAt,
              avatar: null,
              backgroundColor: null,
              clientId: null,
              config: null,
              content: null,
              createdAt: session.createdAt,
              description: session.meta?.description || '',
              editorData: null,

              groupId: session.group || null,
              id: session.id, // Add the missing groupId property

              marketIdentifier: null,

              // Will be set by the backend
              pinned: session.pinned || false,

              // Session ID is the chat group ID
              slug: null,

              title: session.meta?.title || 'Untitled Group',
              updatedAt: session.updatedAt,
              userId: '', // Use updatedAt as accessedAt fallback
            }));

            chatGroupStore.internal_updateGroupMaps(chatGroups);
          }

          this.#set(
            { isSessionsFirstFetchFinished: true },
            false,
            n('useFetchSessions/onSuccess', data),
          );
        },
        suspense: true,
      },
    );
  };

  useSearchSessions = (keyword?: string): SWRResponse<any> => {
    return useSWR<LobeSessions>(
      [SEARCH_SESSIONS_KEY, keyword],
      async () => {
        if (!keyword) return [];

        return sessionService.searchSessions(keyword);
      },
      { revalidateOnFocus: false, revalidateOnMount: false },
    );
  };

  internal_dispatchSessions = (payload: SessionDispatch): void => {
    const nextSessions = sessionsReducer(this.#get().sessions, payload);
    this.#get().internal_processSessions(nextSessions, this.#get().sessionGroups);
  };

  internal_updateSession = async (
    id: string,
    data: Partial<UpdateSessionParams>,
  ): Promise<void> => {
    this.#get().internal_dispatchSessions({ id, type: 'updateSession', value: data });

    await sessionService.updateSession(id, data);
    await this.#get().refreshSessions();
  };

  internal_processSessions = (sessions: LobeSessions, sessionGroups: LobeSessionGroups): void => {
    const customGroups = sessionGroups.map((item) => ({
      ...item,
      children: sessions.filter((i) => i.group === item.id && !i.pinned),
    }));

    const defaultGroup = sessions.filter(
      (item) => (!item.group || item.group === 'default') && !item.pinned,
    );
    const pinnedGroup = sessions.filter((item) => item.pinned);

    this.#set(
      {
        customSessionGroups: customGroups,
        defaultSessions: defaultGroup,
        pinnedSessions: pinnedGroup,
        sessionGroups,
        sessions,
      },
      false,
      n('processSessions'),
    );
  };

  refreshSessions = async (): Promise<void> => {
    await mutate([FETCH_SESSIONS_KEY, true]);
  };
}

export type SessionAction = Pick<SessionActionImpl, keyof SessionActionImpl>;
