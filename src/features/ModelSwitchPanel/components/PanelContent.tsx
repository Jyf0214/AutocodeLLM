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

import { Flexbox } from '@lobehub/ui';
import { type ComponentType, type FC } from 'react';
import { useState } from 'react';
import { Rnd } from 'react-rnd';

import { useEnabledChatModels } from '@/hooks/useEnabledChatModels';
import { useUserStore } from '@/store/user';
import { userGeneralSettingsSelectors } from '@/store/user/slices/settings/selectors/general';
import type { EnabledProviderWithModels } from '@/types/aiProvider';

import { DEFAULT_WIDTH, ENABLE_RESIZING, MAX_WIDTH, MIN_WIDTH } from '../const';
import { usePanelSize } from '../hooks/usePanelSize';
import { usePanelState } from '../hooks/usePanelState';
import { List } from './List';
import type { PricingMode } from './ModelDetailPanel';
import { Toolbar } from './Toolbar';

interface PanelContentProps {
  enabledList?: EnabledProviderWithModels[];
  model?: string;
  ModelItemComponent?: ComponentType<any>;
  onModelChange?: (params: { model: string; provider: string }) => Promise<void>;
  onOpenChange?: (open: boolean) => void;
  pricingMode?: PricingMode;
  provider?: string;
}

export const PanelContent: FC<PanelContentProps> = ({
  ModelItemComponent,
  enabledList: enabledListProp,
  model: modelProp,
  onModelChange: onModelChangeProp,
  onOpenChange,
  pricingMode,
  provider: providerProp,
}) => {
  const chatEnabledList = useEnabledChatModels();
  const enabledList = enabledListProp ?? chatEnabledList;
  const [searchKeyword, setSearchKeyword] = useState('');
  const isDevMode = useUserStore((s) => userGeneralSettingsSelectors.config(s).isDevMode);
  const { groupMode, handleGroupModeChange } = usePanelState();
  const { panelHeight, panelWidth, handlePanelWidthChange } = usePanelSize(enabledList.length);

  const content = (
    <>
      <Toolbar
        groupMode={groupMode}
        searchKeyword={searchKeyword}
        showGroupModeSwitch={isDevMode}
        onGroupModeChange={handleGroupModeChange}
        onSearchKeywordChange={setSearchKeyword}
      />
      <List
        ModelItemComponent={ModelItemComponent}
        enabledList={enabledList}
        groupMode={isDevMode ? groupMode : 'byModel'}
        model={modelProp}
        pricingMode={pricingMode}
        provider={providerProp}
        searchKeyword={searchKeyword}
        onModelChange={onModelChangeProp}
        onOpenChange={onOpenChange}
      />
    </>
  );

  if (isDevMode) {
    return (
      <Rnd
        disableDragging
        enableResizing={ENABLE_RESIZING}
        maxWidth={MAX_WIDTH}
        minWidth={MIN_WIDTH}
        position={{ x: 0, y: 0 }}
        size={{ height: panelHeight, width: panelWidth }}
        style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}
        onResizeStop={(_e, _direction, ref) => {
          handlePanelWidthChange(ref.offsetWidth);
        }}
      >
        {content}
      </Rnd>
    );
  }

  return (
    <Flexbox
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: panelHeight,
        position: 'relative',
        width: DEFAULT_WIDTH,
      }}
    >
      {content}
    </Flexbox>
  );
};
