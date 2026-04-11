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

'use client';

import { Center, DropdownMenu, Icon, Tag } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { LucideToyBrick } from 'lucide-react';
import { memo, useMemo } from 'react';

import Avatar from '@/components/Plugins/PluginAvatar';
import { filterToolIdsByCurrentEnv } from '@/helpers/toolAvailability';
import { pluginHelpers, useToolStore } from '@/store/tool';
import { pluginSelectors, toolSelectors } from '@/store/tool/selectors';

import PluginStatus from './PluginStatus';

export interface PluginTagProps {
  plugins: string[];
}

const PluginTag = memo<PluginTagProps>(({ plugins }) => {
  const list = useToolStore(toolSelectors.metaList, isEqual);
  const installedPlugins = useToolStore(pluginSelectors.installedPlugins, isEqual);

  const visiblePlugins = useMemo(
    () => filterToolIdsByCurrentEnv(plugins, { installedPlugins }),
    [installedPlugins, plugins],
  );

  const displayPlugin = useToolStore(toolSelectors.getMetaById(visiblePlugins[0] || ''), isEqual);

  if (visiblePlugins.length === 0) return null;

  const count = visiblePlugins.length;

  return (
    <DropdownMenu
      items={() =>
        visiblePlugins.map((id) => {
          const item = list.find((i) => i.identifier === id);

          const isDeprecated = !item;
          const avatar = isDeprecated ? '♻️' : pluginHelpers.getPluginAvatar(item.meta || item);

          return {
            icon: (
              <Center style={{ minWidth: 24 }}>
                <Avatar avatar={avatar} size={24} />
              </Center>
            ),
            key: id,
            label: (
              <PluginStatus
                deprecated={isDeprecated}
                id={id}
                title={pluginHelpers.getPluginTitle(item?.meta || item)}
              />
            ),
          };
        })
      }
    >
      <Tag style={{ cursor: 'pointer' }}>
        {<Icon icon={LucideToyBrick} />}
        {pluginHelpers.getPluginTitle(displayPlugin) || visiblePlugins[0]}
        {count > 1 && <div>({visiblePlugins.length - 1}+)</div>}
      </Tag>
    </DropdownMenu>
  );
});

export default PluginTag;
