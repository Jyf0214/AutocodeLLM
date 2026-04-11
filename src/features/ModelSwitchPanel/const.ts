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

export const STORAGE_KEY = 'MODEL_SWITCH_PANEL_WIDTH';
export const STORAGE_KEY_MODE = 'MODEL_SWITCH_PANEL_MODE';
export const DEFAULT_WIDTH = 320;
export const MIN_WIDTH = 280;
export const MAX_WIDTH = 600;
export const MAX_PANEL_HEIGHT = 460;
export const TOOLBAR_HEIGHT = 40;
export const FOOTER_HEIGHT = 48;

export const ITEM_HEIGHT = {
  'empty-model': 32,
  'group-header': 32,
  'model-item': 32,
  'no-provider': 32,
} as const;

export const ENABLE_RESIZING = {
  bottom: false,
  bottomLeft: false,
  bottomRight: false,
  left: false,
  right: true,
  top: false,
  topLeft: false,
  topRight: false,
} as const;
