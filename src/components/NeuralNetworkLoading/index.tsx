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

import { createStaticStyles, keyframes } from 'antd-style';
import { type CSSProperties } from 'react';
import { memo } from 'react';

const pulseAnim = keyframes`
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
`;

const flowAnim = keyframes`
  0% {
    transform: translateX(0);
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateX(var(--flow-distance));
    opacity: 0.5;
  }
`;

const rotateAnim = keyframes`
  100% {
    transform: rotate(360deg);
  }
`;

const scaleAnim = keyframes`
  0%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  50% {
    transform: scale(1);
    opacity: 1;
  }
`;

const styles = createStaticStyles(({ css, cssVar }) => ({
  center: css`
    fill: ${cssVar.colorTextSecondary};
    animation: ${scaleAnim} 2s infinite;
  `,

  connection: css`
    opacity: 0.3;
    stroke: ${cssVar.colorTextSecondary};
    stroke-width: 0.5;
  `,

  container: css`
    display: flex;
    align-items: center;
    justify-content: center;
  `,

  node: css`
    fill: ${cssVar.colorTextSecondary};
    animation: ${pulseAnim} 2s infinite;
  `,

  particle: css`
    fill: ${cssVar.colorTextSecondary};
    animation: ${flowAnim} 2s infinite;
  `,

  ring: css`
    transform-origin: center;

    fill: none;
    stroke: ${cssVar.colorFill};
    stroke-dasharray: 0 8;
    stroke-width: 1;

    animation: ${rotateAnim} 20s infinite linear;
  `,

  svg: css`
    width: 100%;
    height: 100%;
  `,
}));

interface NeuralNetworkLoadingProps {
  size?: number;
}

const NeuralNetworkLoading = memo<NeuralNetworkLoadingProps>(({ size = 16 }) => {
  const nodeCount = 3;
  const layerCount = 3;

  // Generate nodes for each layer
  const nodes = [];
  for (let layerIndex = 0; layerIndex < layerCount; layerIndex++) {
    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
      const x = 25 + layerIndex * 25;
      const y = 25 + nodeIndex * 25;
      const delay = (layerIndex * nodeCount + nodeIndex) * 0.2;
      nodes.push(
        <circle
          className={styles.node}
          cx={x}
          cy={y}
          key={`node-${layerIndex}-${nodeIndex}`}
          r="3"
          style={{ animationDelay: `${delay}s` }}
        />,
      );
    }
  }

  // Generate connections between layers
  const connections = [];
  for (let layerIndex = 0; layerIndex < layerCount - 1; layerIndex++) {
    for (let nodeIndex = 0; nodeIndex < nodeCount; nodeIndex++) {
      const x1 = 25 + layerIndex * 25;
      const y1 = 25 + nodeIndex * 25;
      for (let targetIndex = 0; targetIndex < nodeCount; targetIndex++) {
        const x2 = 25 + (layerIndex + 1) * 25;
        const y2 = 25 + targetIndex * 25;
        connections.push(
          <line
            className={styles.connection}
            key={`connection-${layerIndex}-${nodeIndex}-${targetIndex}`}
            x1={x1}
            x2={x2}
            y1={y1}
            y2={y2}
          />,
        );
      }
    }
  }

  // Generate particles
  const particles = [0, 1, 2].map((index) => (
    <circle
      className={styles.particle}
      cx={25}
      cy={50}
      key={`particle-${index}`}
      r="1.5"
      style={
        {
          '--flow-distance': '50px',
          'animationDelay': `${index * 0.6}s`,
        } as CSSProperties
      }
    />
  ));

  return (
    <div className={styles.container} style={{ height: size, width: size }}>
      <svg className={styles.svg} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        {/* Connections */}
        {connections}

        {/* Nodes */}
        {nodes}

        {/* Particles */}
        {particles}

        {/* Central processing unit */}
        <rect className={styles.center} height="6" width="6" x="47" y="47" />

        {/* Rotating outer ring */}
        <circle className={styles.ring} cx="50" cy="50" r="40" />
      </svg>
    </div>
  );
});

export default NeuralNetworkLoading;
