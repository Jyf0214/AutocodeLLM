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
import { memo, useState } from 'react';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';

interface ImageViewerProps {
  fileId: string;
  url: string | null;
}

const ImageViewer = memo<ImageViewerProps>(({ url }) => {
  const [isLoaded, setIsLoaded] = useState(false);

  if (!url) return null;

  return (
    <Center height={'100%'} width={'100%'}>
      {!isLoaded && <NeuralNetworkLoading size={36} />}
      { }
      <img
        alt="Image preview"
        src={url}
        style={{
          display: isLoaded ? 'block' : 'none',
          height: '100%',
          objectFit: 'contain',
          overflow: 'hidden',
          width: '100%',
        }}
        onLoad={() => setIsLoaded(true)}
      />
    </Center>
  );
});

export default ImageViewer;
