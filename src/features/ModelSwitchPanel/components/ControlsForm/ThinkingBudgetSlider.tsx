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

// Define special value mappings
const SPECIAL_VALUES = {
  AUTO: -1,
  OFF: 0,
};

// Define slider position to actual value mapping
const SLIDER_TO_VALUE_MAP = [
  SPECIAL_VALUES.AUTO, // Position 0 -> -1 (Auto)
  SPECIAL_VALUES.OFF, // Position 1 -> 0 (OFF)
  128, // Position 2 -> 128
  512, // Position 3 -> 512
  1024, // Position 4 -> 1024
  2048, // Position 5 -> 2048
  4096, // Position 6 -> 4096
  8192, // Position 7 -> 8192
  16_384, // Position 8 -> 16384
  24_576, // Position 9 -> 24576
  32_768, // Position 10 -> 32768
];

// Get slider position from actual value
const getSliderPosition = (value: number): number => {
  const exactIndex = SLIDER_TO_VALUE_MAP.indexOf(value);
  if (exactIndex !== -1) return exactIndex;

  if (value <= SPECIAL_VALUES.AUTO) return 0;
  if (value > SPECIAL_VALUES.OFF && value <= 128) return 2;

  let position = 0;

  for (const [index, mappedValue] of SLIDER_TO_VALUE_MAP.entries()) {
    if (mappedValue <= value) {
      position = index;
      continue;
    }

    break;
  }

  return position;
};

// Get actual value from slider position (fix: 0 is no longer treated as falsy)
const getValueFromPosition = (position: number): number => {
  const v = SLIDER_TO_VALUE_MAP[position];
  return v === undefined ? SPECIAL_VALUES.AUTO : v;
};

const getStepForValue = (value: number): number => {
  if (value < 0) return 1;
  if (value <= 1024) return 128;
  if (value < 8192) return 1024;
  return 2048;
};

interface ThinkingBudgetSliderProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
  value?: number;
}

const ThinkingBudgetSlider = memo<ThinkingBudgetSliderProps>(
  ({ value, onChange, defaultValue }) => {
    // First determine the initial budget value
    const initialBudget = value ?? defaultValue ?? SPECIAL_VALUES.AUTO;

    const [budget, setBudget] = useMergeState(initialBudget, {
      defaultValue,
      onChange,
      value,
    });

    const sliderPosition = getSliderPosition(budget);

    const updateWithSliderPosition = (position: number) => {
      const newValue = getValueFromPosition(position);
      setBudget(newValue);
    };

    const updateWithRealValue = (value: number) => {
      setBudget(value);
    };

    const inputStep = useMemo(() => getStepForValue(budget), [budget]);

    const marks = useMemo(() => {
      return {
        0: 'Auto',
        1: 'OFF',
        2: '128',
        3: '512',
        4: '1K',
        5: '2K',
        6: '4K',
        7: '8K',
        8: '16K',
        9: '24K',
        10: '32K',
      };
    }, []);

    return (
      <Flexbox horizontal align={'center'} gap={12} paddingInline={'4px 0'}>
        <Flexbox flex={1}>
          <Slider
            marks={marks}
            max={10}
            min={0}
            step={null}
            tooltip={{ open: false }}
            value={sliderPosition}
            onChange={updateWithSliderPosition}
          />
        </Flexbox>
        <div>
          <InputNumber
            changeOnWheel
            max={32_768}
            min={-1}
            step={inputStep}
            style={{ width: 80 }}
            value={budget}
            formatter={(value, _info) => {
              if (value === SPECIAL_VALUES.AUTO) return 'Auto';
              if (value === SPECIAL_VALUES.OFF) return 'OFF';
              return `${value}`;
            }}
            parser={(value) => {
              if (typeof value === 'string') {
                if (value.toLowerCase() === 'auto') return SPECIAL_VALUES.AUTO;
                if (value.toLowerCase() === 'off') return SPECIAL_VALUES.OFF;
                return parseInt(value.replaceAll(/[^\d-]/g, ''), 10) || 0;
              }
              if (typeof value === 'number') {
                return value;
              }
              return SPECIAL_VALUES.AUTO;
            }}
            onChange={(e) => {
              if (e === null || e === undefined) return;
              updateWithRealValue(e as number);
            }}
          />
        </div>
      </Flexbox>
    );
  },
);

export default ThinkingBudgetSlider;
