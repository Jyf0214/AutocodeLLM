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

import { DEFAULT_LANG } from '@/const/locale';
import { type Locales, normalizeLocale } from '@/locales/resources';
import { isOnServerSide } from '@/utils/env';

import { type UserStore } from '../../../store';
import { currentSettings } from './settings';

const generalConfig = (s: UserStore) => currentSettings(s).general || {};

const neutralColor = (s: UserStore) => generalConfig(s).neutralColor;
const primaryColor = (s: UserStore) => generalConfig(s).primaryColor;
const fontSize = (s: UserStore) => generalConfig(s).fontSize;
const highlighterTheme = (s: UserStore) => generalConfig(s).highlighterTheme;
const mermaidTheme = (s: UserStore) => generalConfig(s).mermaidTheme;
const transitionMode = (s: UserStore) => generalConfig(s).transitionMode;
const animationMode = (s: UserStore) => generalConfig(s).animationMode;
const contextMenuMode = (s: UserStore) => {
  const config = generalConfig(s).contextMenuMode;
  if (config !== undefined) return config;
  return isDesktop ? 'default' : 'disabled';
};
const responseLanguage = (s: UserStore) => generalConfig(s).responseLanguage;
const currentResponseLanguage = (s: UserStore): Locales => {
  const locale = responseLanguage(s);

  if (locale) return normalizeLocale(locale);
  if (isOnServerSide) return DEFAULT_LANG;

  return normalizeLocale(navigator.language);
};
const telemetry = (s: UserStore) => generalConfig(s).telemetry;
const enableAutoScrollOnStreaming = (s: UserStore) =>
  generalConfig(s).enableAutoScrollOnStreaming ?? true;

export const userGeneralSettingsSelectors = {
  animationMode,
  config: generalConfig,
  contextMenuMode,
  enableAutoScrollOnStreaming,
  fontSize,
  highlighterTheme,
  mermaidTheme,
  neutralColor,
  primaryColor,
  currentResponseLanguage,
  responseLanguage,
  telemetry,
  transitionMode,
};
