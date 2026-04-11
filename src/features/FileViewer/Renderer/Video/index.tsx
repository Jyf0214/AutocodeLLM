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

import { Center } from '@lobehub/ui';
import { createStaticStyles } from 'antd-style';
import { memo } from 'react';

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    padding: ${cssVar.paddingSM};
    border-radius: ${cssVar.borderRadiusLG};
    background: ${cssVar.colorBgContainer};
  `,
  video: css`
    max-width: 100%;
    max-height: 100%;
    border-radius: ${cssVar.borderRadius};

    object-fit: contain;
    box-shadow: ${cssVar.boxShadowTertiary};

    &::-webkit-media-controls-panel {
      background: linear-gradient(to bottom, transparent 0%, rgb(0 0 0 / 30%) 100%);
    }

    &:focus {
      outline: 2px solid ${cssVar.colorPrimary};
      outline-offset: 2px;
    }
  `,
}));

interface VideoViewerProps {
  fileId: string;
  url: string | null;
}

const VideoViewer = memo<VideoViewerProps>(({ url }) => {
  if (!url) return null;

  return (
    <Center className={styles.container} height={'100%'} width={'100%'}>
      <video controls className={styles.video} height={'100%'} src={url} width={'100%'} />
    </Center>
  );
});

export default VideoViewer;
