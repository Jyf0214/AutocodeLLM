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

import { Icon, Tag } from '@lobehub/ui';
import { createStaticStyles, cx } from 'antd-style';
import { BadgeCheck, CircleUser, Package } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { type InstallPluginMeta } from '@/types/tool/plugin';

const styles = createStaticStyles(({ css, cssVar }) => ({
  community: css`
    color: color-mix(in srgb, ${cssVar.colorInfo} 75%, transparent);
    background: ${cssVar.colorInfoBg};

    &:hover {
      color: ${cssVar.colorInfo};
    }
  `,
  custom: css`
    color: color-mix(in srgb, ${cssVar.colorWarning} 75%, transparent);
    background: ${cssVar.colorWarningBg};

    &:hover {
      color: ${cssVar.colorWarning};
    }
  `,
  official: css`
    color: color-mix(in srgb, ${cssVar.colorSuccess} 75%, transparent);
    background: ${cssVar.colorSuccessBg};

    &:hover {
      color: ${cssVar.colorSuccess};
    }
  `,
}));

interface PluginTagProps extends Pick<InstallPluginMeta, 'author' | 'type'> {
  showIcon?: boolean;
  showText?: boolean;
}

const PluginTag = memo<PluginTagProps>(({ showIcon = true, author, type, showText = true }) => {
  const { t } = useTranslation('plugin');
  const isCustom = type === 'customPlugin';
  const isOfficial = author === 'LobeHub';

  return (
    <Tag
      className={cx(isCustom ? styles.custom : isOfficial ? styles.official : styles.community)}
      icon={showIcon && <Icon icon={isCustom ? Package : isOfficial ? BadgeCheck : CircleUser} />}
    >
      {showText && (author || t(isCustom ? 'store.customPlugin' : 'store.communityPlugin'))}
    </Tag>
  );
});

export default PluginTag;
