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

import { SiReact } from '@icons-pack/react-simple-icons';
import { Icon } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { CodeXml, GlobeIcon, ImageIcon, Loader2, OrigamiIcon } from 'lucide-react';
import { memo } from 'react';

interface ArtifactProps {
  type: string;
}

const SIZE = 28;
const ArtifactIcon = memo<ArtifactProps>(({ type }) => {
  if (!type)
    return <Icon spin icon={Loader2} size={SIZE} style={{ color: cssVar.colorTextSecondary }} />;

  switch (type) {
    case 'application/lobe.artifacts.code': {
      return <Icon icon={CodeXml} size={SIZE} style={{ color: cssVar.colorTextSecondary }} />;
    }

    case 'application/lobe.artifacts.react': {
      return <SiReact size={SIZE} style={{ color: cssVar.colorTextSecondary }} />;
    }

    case 'image/svg+xml': {
      return <Icon icon={ImageIcon} size={SIZE} style={{ color: cssVar.colorTextSecondary }} />;
    }
    case 'text/html': {
      return <Icon icon={GlobeIcon} size={SIZE} style={{ color: cssVar.colorTextSecondary }} />;
    }
    default: {
      return (
        <Icon color={cssVar.purple} icon={OrigamiIcon} size={{ size: SIZE, strokeWidth: 1.2 }} />
      );
    }
  }
});

export default ArtifactIcon;
