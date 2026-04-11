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

import { type DropdownMenuPlacement } from '@lobehub/ui';
import { type AiModelForSelect } from 'model-bank';
import { type ComponentType } from 'react';

import { type EnabledProviderWithModels } from '@/types/aiProvider';

import { type PricingMode } from './components/ModelDetailPanel';

export type GroupMode = 'byModel' | 'byProvider';

export interface ModelWithProviders {
  displayName: string;
  model: AiModelForSelect;
  providers: Array<{
    id: string;
    logo?: string;
    name: string;
    source?: EnabledProviderWithModels['source'];
  }>;
}

export type ListItem =
  | {
      data: ModelWithProviders;
      type: 'model-item-single';
    }
  | {
      data: ModelWithProviders;
      type: 'model-item-multiple';
    }
  | {
      provider: EnabledProviderWithModels;
      type: 'group-header';
    }
  | {
      model: AiModelForSelect;
      provider: EnabledProviderWithModels;
      type: 'provider-model-item';
    }
  | {
      provider: EnabledProviderWithModels;
      type: 'empty-model';
    }
  | {
      type: 'no-provider';
    };

export type DropdownPlacement = DropdownMenuPlacement;

export interface ModelSwitchPanelProps {
  children?: React.ReactNode;
  /**
   * When set (e.g. image/video generation), uses this list instead of enabled chat models.
   */
  enabledList?: EnabledProviderWithModels[];
  /**
   * Current model ID. If not provided, uses currentAgentModel from store.
   */
  model?: string;
  /**
   * Optional row component for generation UIs (e.g. ImageModelItem). Requires `enabledList` + `pricingMode`.
   */
  ModelItemComponent?: ComponentType<any>;
  /**
   * Callback when model changes. If not provided, uses updateAgentConfig from store.
   */
  onModelChange?: (params: { model: string; provider: string }) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  /**
   * Whether to open the panel on hover. Defaults to true.
   */
  openOnHover?: boolean;
  /**
   * Dropdown placement. Defaults to 'topLeft'.
   */
  placement?: DropdownPlacement;
  /**
   * Pass-through to ModelDetailPanel for image/video approximate pricing.
   */
  pricingMode?: PricingMode;
  /**
   * Current provider ID. If not provided, uses currentAgentModelProvider from store.
   */
  provider?: string;
}
