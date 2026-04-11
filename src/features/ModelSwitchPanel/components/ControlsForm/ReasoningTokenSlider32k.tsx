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

import { Flexbox, InputNumber } from '@lobehub/ui';
import { Slider } from 'antd';
import { memo, useMemo } from 'react';
import useMergeState from 'use-merge-value';

const Kibi = 1024;
const MAX_VALUE = 32 * Kibi; // 32768

// Mark values mapped by equal-spaced indices
const MARK_TOKENS = [1, 2, 4, 8, 16, 32];

interface ReasoningTokenSlider32kProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
  value?: number;
}

const ReasoningTokenSlider32k = memo<ReasoningTokenSlider32kProps>(
  ({ value, onChange, defaultValue }) => {
    const [token, setTokens] = useMergeState(0, {
      defaultValue,
      onChange,
      value,
    });

    // Convert token value to index
    const tokenToIndex = (t: number): number => {
      const k = t / Kibi;
      for (let i = 0; i < MARK_TOKENS.length - 1; i++) {
        if (k <= MARK_TOKENS[i]) return i;
      }
      return MARK_TOKENS.length - 1;
    };

    const [sliderIndex, setSliderIndex] = useMergeState(0, {
      defaultValue: typeof defaultValue === 'undefined' ? 0 : tokenToIndex(defaultValue),
      value: typeof value === 'undefined' ? 0 : tokenToIndex(value),
    });

    const marks = useMemo(() => {
      return MARK_TOKENS.reduce(
        (acc, token, index) => {
          acc[index] = `${token}k`;
          return acc;
        },
        {} as Record<number, string>,
      );
    }, []);

    const step = useMemo(() => {
      const current = token ?? 0;

      if (current <= Kibi) return 128;

      if (current < 8 * Kibi) return Kibi;

      return 4 * Kibi;
    }, [token]);

    return (
      <Flexbox horizontal align={'center'} gap={12} paddingInline={'4px 0'}>
        <Flexbox flex={1} style={{ minWidth: 200, maxWidth: 320 }}>
          <Slider
            marks={marks}
            max={MARK_TOKENS.length - 1}
            min={0}
            step={null}
            tooltip={{ open: false }}
            value={sliderIndex}
            onChange={(v) => {
              setSliderIndex(v);
              setTokens(MARK_TOKENS[v] * Kibi);
            }}
          />
        </Flexbox>
        <div>
          <InputNumber
            changeOnWheel
            max={MAX_VALUE}
            min={0}
            step={step}
            style={{ width: 80 }}
            value={token}
            onChange={(e) => {
              if (!e && e !== 0) return;
              const clampedValue = Math.min(Math.round(e as number), MAX_VALUE);
              setTokens(clampedValue);
              setSliderIndex(tokenToIndex(clampedValue));
            }}
          />
        </div>
      </Flexbox>
    );
  },
);

export default ReasoningTokenSlider32k;
