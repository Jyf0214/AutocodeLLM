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

import { type LobeUser, type SSOProvider } from '@lobechat/types';
import { t } from 'i18next';

import { type UserStore } from '@/store/user';

const nickName = (s: UserStore) => {
  const defaultNickName = s.user?.fullName || s.user?.username;
  if (s.isSignedIn) return defaultNickName;

  return t('userPanel.anonymousNickName', { ns: 'common' });
};

const username = (s: UserStore) => {
  if (s.isSignedIn) return s.user?.username;

  return 'anonymous';
};

export const userProfileSelectors = {
  displayUserName: (s: UserStore): string => s.user?.fullName || username(s) || s.user?.email || '',
  email: (s: UserStore): string => s.user?.email || '',
  fullName: (s: UserStore): string => s.user?.fullName || '',
  interests: (s: UserStore): string[] => s.user?.interests || [],
  nickName,
  userAvatar: (s: UserStore): string => s.user?.avatar || '',
  userId: (s: UserStore) => s.user?.id,
  userProfile: (s: UserStore): LobeUser | null | undefined => s.user,
  username,
};

export const authSelectors = {
  authProviders: (s: UserStore): SSOProvider[] => s.authProviders || [],
  hasPasswordAccount: (s: UserStore) => s.hasPasswordAccount ?? false,
  isFreePlan: (s: UserStore) => s.isFreePlan,
  isLoaded: (s: UserStore) => s.isLoaded,
  isLoadedAuthProviders: (s: UserStore) => s.isLoadedAuthProviders ?? false,
  isLogin: (s: UserStore) => s.isSignedIn,
  isLoginWithAuth: (s: UserStore) => s.isSignedIn,
};
