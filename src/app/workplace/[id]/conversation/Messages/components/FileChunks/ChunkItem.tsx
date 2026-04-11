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

import { type ChatFileChunk } from '@lobechat/types';
import { Center, Flexbox, Text, Tooltip } from '@lobehub/ui';
import { cx } from 'antd-style';
import { memo } from 'react';

import FileIcon from '@/components/FileIcon';
import { useIsDark } from '@/hooks/useIsDark';
import { useChatStore } from '@/store/chat';

import { styles } from './style';

export interface ChunkItemProps extends ChatFileChunk {
  index: number;
}

const ChunkItem = memo<ChunkItemProps>(({ id, fileId, similarity, text, filename, fileType }) => {
  const isDarkMode = useIsDark();
  // Note: openFilePreview is a portal action, kept in ChatStore as it's a global UI state
  const openFilePreview = useChatStore((s) => s.openFilePreview);

  return (
    <Flexbox
      horizontal
      align={'center'}
      className={cx(styles.container, isDarkMode ? styles.containerDark : styles.containerLight)}
      gap={4}
      key={id}
      onClick={(e) => {
        e.stopPropagation();
        openFilePreview({ chunkId: id, chunkText: text, fileId });
      }}
    >
      <FileIcon fileName={filename} fileType={fileType} size={20} variant={'raw'} />
      <Flexbox horizontal gap={12} justify={'space-between'} style={{ maxWidth: 200 }}>
        <Text ellipsis>{filename}</Text>
        {similarity && (
          <Tooltip title={similarity}>
            <Center className={styles.badge}>{similarity.toFixed(1)}</Center>
          </Tooltip>
        )}
      </Flexbox>
    </Flexbox>
  );
});

export default ChunkItem;
