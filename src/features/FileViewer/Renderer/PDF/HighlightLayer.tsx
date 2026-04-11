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

import { type FC } from 'react';
import { memo } from 'react';

import { useFileStore } from '@/store/file';
import { type ChunkMetadata, type Coordinates, type FileChunk } from '@/types/chunk';

interface HighlightRectProps {
  coordinates: Coordinates;
  highlight: boolean;
}

const HighlightRect: FC<HighlightRectProps> = ({ coordinates, highlight }) => {
  const { points } = coordinates;

  // Assume the points array contains the four vertex coordinates of the rectangle
  const [topLeft, topRight, bottomRight, bottomLeft] = points;

  // Calculate rectangle properties
  const minX = Math.min(topLeft[0], topRight[0], bottomRight[0], bottomLeft[0]);
  const minY = Math.min(topLeft[1], topRight[1], bottomRight[1], bottomLeft[1]);
  const width = Math.max(topLeft[0], topRight[0], bottomRight[0], bottomLeft[0]) - minX;
  const height = Math.max(topLeft[1], topRight[1], bottomRight[1], bottomLeft[1]) - minY;

  return (
    <rect
      fill={highlight ? 'rgba(255, 255, 0, 0.5)' : 'rgba(255, 255, 0, 0.3)'}
      height={height}
      stroke="rgba(255, 255, 0, 0.7)"
      strokeWidth="1"
      width={width}
      x={minX}
      y={minY}
    />
  );
};

interface HighlightLayerProps {
  dataSource: FileChunk[];
  pageNumber: number;
  width: number;
}

const HighlightLayer = memo<HighlightLayerProps>(({ dataSource, pageNumber, width }) => {
  const chunks = dataSource
    .filter((chunk) => chunk.pageNumber && chunk.pageNumber === pageNumber)
    .filter(Boolean);
  const highlightChunkIds = useFileStore((s) => s.highlightChunkIds);

  const isExist = chunks.length > 0;

  if (!isExist) return null;

  const metadata = chunks[0].metadata as ChunkMetadata;
  if (!metadata.coordinates) return;

  const { layout_width, layout_height } = metadata.coordinates;

  const height = metadata.coordinates.layout_height * (width / metadata.coordinates.layout_width);

  return (
    <svg
      height={height}
      style={{ left: 0, position: 'absolute', top: 0, zIndex: 100 }}
      viewBox={`0 0 ${layout_width} ${layout_height}`}
      width={width}
    >
      {chunks.map(
        (chunk, index) =>
          chunk.metadata && (
            <HighlightRect
              coordinates={chunk.metadata.coordinates}
              highlight={highlightChunkIds.includes(chunk.id)}
              key={index}
            />
          ),
      )}
      s
    </svg>
  );
});

export default HighlightLayer;
