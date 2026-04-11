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

import { isDesktop } from '@lobechat/const';
import type { UserGeneralConfig } from '@lobechat/types';
import { getSingletonAnalyticsOptional } from '@lobehub/analytics';
import { type SWRResponse } from 'swr';
import useSWR from 'swr';
import { type PartialDeep } from 'type-fest';

import { DEFAULT_PREFERENCE } from '@/const/user';
import { mutate, useOnlyFetchOnceSWR } from '@/libs/swr';
import { userService } from '@/services/user';
import { type StoreSetter } from '@/store/types';
import { type UserStore } from '@/store/user';
import { type GlobalServerConfig } from '@/types/serverConfig';
import { type LobeUser, type UserInitializationState } from '@/types/user';
import { type UserSettings } from '@/types/user/settings';
import { merge } from '@/utils/merge';
import { setNamespace } from '@/utils/storeDebug';

import { userGeneralSettingsSelectors } from '../settings/selectors';

const n = setNamespace('common');

const GET_USER_STATE_KEY = 'initUserState';
/**
 * Common actions
 */

type Setter = StoreSetter<UserStore>;
export const createCommonSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new CommonActionImpl(set, get, _api);

export class CommonActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  refreshUserState = async (): Promise<void> => {
    await mutate(GET_USER_STATE_KEY);
  };

  updateAvatar = async (avatar: string): Promise<void> => {
    await userService.updateAvatar(avatar);
    await this.#get().refreshUserState();
  };

  updateFullName = async (fullName: string): Promise<void> => {
    await userService.updateFullName(fullName);
    await this.#get().refreshUserState();
  };

  updateInterests = async (interests: string[]): Promise<void> => {
    await userService.updateInterests(interests);
    await this.#get().refreshUserState();
  };

  updateKeyVaultConfig = async (provider: string, config: any): Promise<void> => {
    await this.#get().setSettings({ keyVaults: { [provider]: config } });
  };

  updateUsername = async (username: string): Promise<void> => {
    await userService.updateUsername(username);
    await this.#get().refreshUserState();
  };

  useCheckTrace = (shouldFetch: boolean): SWRResponse<any> => {
    return useSWR<boolean>(
      shouldFetch ? 'checkTrace' : null,
      () => {
        const telemetry = userGeneralSettingsSelectors.telemetry(this.#get());

        // if user have set the telemetry, return false
        if (typeof telemetry === 'boolean') return Promise.resolve(false);

        return Promise.resolve(this.#get().isUserCanEnableTrace);
      },
      {
        revalidateOnFocus: false,
      },
    );
  };

  useInitUserState = (
    isLogin: boolean | undefined,
    serverConfig: GlobalServerConfig,
    options?: {
      onError?: (error: any) => void;
      onSuccess?: (data: UserInitializationState) => void;
    },
  ): SWRResponse => {
    return useOnlyFetchOnceSWR<UserInitializationState>(
      !!isLogin || isDesktop ? GET_USER_STATE_KEY : null,
      () => userService.getUserState(),
      {
        onError: (error) => {
          options?.onError?.(error);
        },
        onSuccess: (data) => {
          options?.onSuccess?.(data);

          if (data) {
            // merge settings
            const serverSettings: PartialDeep<UserSettings> = {
              defaultAgent: serverConfig.defaultAgent,
              image: serverConfig.image,
              systemAgent: serverConfig.systemAgent,
            };

            const defaultSettings = merge(this.#get().defaultSettings, serverSettings);

            // merge preference
            const isEmpty = Object.keys(data.preference || {}).length === 0;
            const preference = isEmpty ? DEFAULT_PREFERENCE : data.preference;

            // if there is avatar or userId (from client DB), update it into user
            const user =
              data.avatar || data.userId
                ? merge(this.#get().user, {
                    avatar: data.avatar,
                    email: data.email,
                    firstName: data.firstName,
                    fullName: data.fullName,
                    id: data.userId,
                    interests: data.interests,
                    latestName: data.lastName,
                    username: data.username,
                  } as LobeUser)
                : this.#get().user;

            this.#set(
              {
                defaultSettings,
                isFreePlan: data.isFreePlan,
                isOnboard: data.isOnboard,
                isShowPWAGuide: data.canEnablePWAGuide,
                isUserCanEnableTrace: data.canEnableTrace,
                isUserHasConversation: data.hasConversation,
                isUserStateInit: true,
                agentOnboarding: data.agentOnboarding,
                onboarding: data.onboarding,
                preference,
                referralStatus: data.referralStatus,
                settings: data.settings || {},
                subscriptionPlan: data.subscriptionPlan,
                user,
              },
              false,
              n('initUserState'),
            );

            const autoDetectedGeneralConfig: Partial<UserGeneralConfig> = {};
            const currentGeneralSettings = data.settings?.general;

            // Auto-detect and sync browser timezone on first load
            if (!currentGeneralSettings?.timezone && typeof Intl !== 'undefined') {
              const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
              if (detectedTimezone) autoDetectedGeneralConfig.timezone = detectedTimezone;
            }

            // Keep reply language aligned with the browser locale until the user makes a choice.
            if (!currentGeneralSettings?.responseLanguage && typeof navigator !== 'undefined') {
              autoDetectedGeneralConfig.responseLanguage =
                userGeneralSettingsSelectors.currentResponseLanguage(this.#get());
            }

            if (Object.keys(autoDetectedGeneralConfig).length > 0) {
              this.#get()
                .updateGeneralConfig(autoDetectedGeneralConfig)
                .catch(() => {});
            }

            //analytics
            const analytics = getSingletonAnalyticsOptional();
            analytics?.identify(data.userId || '', {
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              username: data.username,
            });
          }
        },
      },
    );
  };
}

export type CommonAction = Pick<CommonActionImpl, keyof CommonActionImpl>;
