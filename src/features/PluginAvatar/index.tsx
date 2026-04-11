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

import { Icon } from '@lobehub/ui';
import isEqual from 'fast-deep-equal';
import { LucideToyBrick } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import Avatar from '@/components/Plugins/PluginAvatar';
import { pluginHelpers, useToolStore } from '@/store/tool';
import { toolSelectors } from '@/store/tool/selectors';

interface PluginAvatarProps {
  identifier: string;
  size?: number;
}

const PluginAvatar = memo<PluginAvatarProps>(({ identifier, size = 32 }) => {
  const { t } = useTranslation('plugin');

  const pluginMeta = useToolStore(toolSelectors.getMetaById(identifier), isEqual);
  const pluginAvatar = pluginHelpers.getPluginAvatar(pluginMeta);
  const pluginTitle = pluginHelpers.getPluginTitle(pluginMeta) ?? identifier;

  return pluginAvatar ? (
    <Avatar alt={pluginTitle} avatar={pluginAvatar} size={size} />
  ) : (
    <Icon icon={LucideToyBrick} />
  );
});
export default PluginAvatar;
