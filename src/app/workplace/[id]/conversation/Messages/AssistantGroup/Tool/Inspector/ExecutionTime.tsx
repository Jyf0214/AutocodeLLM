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

import { Text } from '@lobehub/ui';
import { memo, useEffect, useRef, useState } from 'react';

interface ExecutionTimeProps {
  isExecuting: boolean;
}

const formatElapsedTime = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;

  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;

  const minutes = seconds / 60;
  return `${minutes.toFixed(1)}min`;
};

const ExecutionTime = memo<ExecutionTimeProps>(({ isExecuting }) => {
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());
  const rafRef = useRef<number | null>(null);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!isExecuting) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    startTimeRef.current = Date.now();
    setElapsed(0);

    const update = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= 100) {
        setElapsed(Date.now() - startTimeRef.current);
        lastUpdateRef.current = timestamp;
      }
      rafRef.current = requestAnimationFrame(update);
    };

    rafRef.current = requestAnimationFrame(update);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isExecuting]);

  if (!isExecuting) return null;

  return (
    <Text fontSize={12} style={{ flexShrink: 0, whiteSpace: 'nowrap' }} type="secondary">
      {formatElapsedTime(elapsed)}
    </Text>
  );
});

export default ExecutionTime;
