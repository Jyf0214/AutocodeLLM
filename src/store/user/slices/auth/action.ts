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

import { type SSOProvider } from '@lobechat/types';

import { type StoreSetter } from '@/store/types';

import { type UserStore } from '../../store';

interface AuthProvidersData {
  hasPasswordAccount: boolean;
  providers: SSOProvider[];
}

const fetchAuthProvidersData = async (): Promise<AuthProvidersData> => {
  const { accountInfo, listAccounts } = await import('@/libs/better-auth/auth-client');
  const result = await listAccounts();
  const accounts = result.data || [];
  const hasPasswordAccount = accounts.some((account) => account.providerId === 'credential');
  const providers = await Promise.all(
    accounts
      .filter((account) => account.providerId !== 'credential')
      .map(async (account) => {
        // In theory, the id_token could be decrypted from the accounts table, but I found that better-auth on GitHub does not save the id_token
        const info = await accountInfo({
          query: { accountId: account.accountId },
        });
        return {
          email: info.data?.user?.email ?? undefined,
          provider: account.providerId,
          providerAccountId: account.accountId,
        };
      }),
  );
  return { hasPasswordAccount, providers };
};

type Setter = StoreSetter<UserStore>;
export const createAuthSlice = (set: Setter, get: () => UserStore, _api?: unknown) =>
  new UserAuthActionImpl(set, get, _api);

export class UserAuthActionImpl {
  readonly #get: () => UserStore;
  readonly #set: Setter;

  constructor(set: Setter, get: () => UserStore, _api?: unknown) {
    void _api;
    this.#set = set;
    this.#get = get;
  }

  fetchAuthProviders = async (): Promise<void> => {
    // Skip if already loaded
    if (this.#get().isLoadedAuthProviders) return;

    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount, isLoadedAuthProviders: true });
    } catch (error) {
      console.error('Failed to fetch auth providers:', error);
      this.#set({ isLoadedAuthProviders: true });
    }
  };

  logout = async (): Promise<void> => {
    const { signOut } = await import('@/libs/better-auth/auth-client');
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          // Use window.location.href to trigger a full page reload
          // This ensures all client-side state (React, Zustand, cache) is cleared
          window.location.href = '/signin';
        },
      },
    });
  };

  openLogin = async (): Promise<void> => {
    // Skip if already on a login page (/signin, /signup)
    const pathname = location.pathname;
    if (pathname.startsWith('/signin') || pathname.startsWith('/signup')) {
      return;
    }

    const currentUrl = location.toString();
    window.location.href = `/signin?callbackUrl=${encodeURIComponent(currentUrl)}`;
  };

  refreshAuthProviders = async (): Promise<void> => {
    try {
      const { hasPasswordAccount, providers } = await fetchAuthProvidersData();
      this.#set({ authProviders: providers, hasPasswordAccount });
    } catch (error) {
      console.error('Failed to refresh auth providers:', error);
    }
  };
}

export type UserAuthAction = Pick<UserAuthActionImpl, keyof UserAuthActionImpl>;
