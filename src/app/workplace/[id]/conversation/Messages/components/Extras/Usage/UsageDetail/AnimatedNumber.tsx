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

import { memo, useEffect, useRef, useState } from 'react';

interface AnimatedNumberProps {
  duration?: number;
  formatter?: (value: number) => string;
  value: number;
}

const AnimatedNumber = memo<AnimatedNumberProps>(({ value, duration = 3000, formatter }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const frameRef = useRef<number>(undefined);
  const startTimeRef = useRef<number>(undefined);
  const startValueRef = useRef(value);

  useEffect(() => {
    const startValue = startValueRef.current;
    const diff = value - startValue;

    if (diff === 0) return;

    const animate = (currentTime: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = currentTime;
      }

      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easeOutCubic easing function
      const easeProgress = 1 - (1 - progress) ** 3;
      const current = startValue + diff * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        startValueRef.current = value;
        startTimeRef.current = undefined;
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [value, duration]);

  return formatter ? formatter(displayValue) : displayValue.toString();
});

export default AnimatedNumber;
