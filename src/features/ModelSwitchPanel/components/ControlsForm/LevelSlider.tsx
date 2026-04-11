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

import { Flexbox } from '@lobehub/ui';
import { Slider } from 'antd';
import { type SliderSingleProps } from 'antd/es/slider';
import { type CSSProperties } from 'react';
import { memo, useMemo } from 'react';
import useMergeState from 'use-merge-value';

export interface LevelSliderProps<T extends string = string> {
  /**
   * Default value when uncontrolled
   */
  defaultValue?: T;
  /**
   * Ordered array of level values (left to right on slider)
   */
  levels: readonly T[];
  /**
   * Optional custom marks. If not provided, uses level values as marks.
   */
  marks?: SliderSingleProps['marks'];
  /**
   * Callback when value changes
   */
  onChange?: (value: T) => void;
  /**
   * Style for the slider container
   */
  style?: CSSProperties;
  /**
   * Controlled value
   */
  value?: T;
}

function LevelSlider<T extends string = string>({
  levels,
  value,
  defaultValue,
  onChange,
  marks: customMarks,
  style,
}: LevelSliderProps<T>) {
  const defaultLevel = defaultValue ?? levels[Math.floor(levels.length / 2)];

  const [currentLevel, setCurrentLevel] = useMergeState<T>(defaultLevel, {
    defaultValue,
    onChange,
    value,
  });

  const marks = useMemo(() => {
    if (customMarks) return customMarks;
    const result: SliderSingleProps['marks'] = {};
    levels.forEach((level, index) => {
      result[index] = level;
    });
    return result;
  }, [customMarks, levels]);

  const currentIndex = levels.indexOf(currentLevel);
  const sliderValue = currentIndex === -1 ? Math.floor(levels.length / 2) : currentIndex;

  const handleChange = (index: number) => {
    const newLevel = levels[index];
    if (newLevel !== undefined) {
      setCurrentLevel(newLevel);
    }
  };

  return (
    <Flexbox
      horizontal
      align={'center'}
      gap={12}
      paddingInline={'0 20px'}
      style={{ minWidth: 200, width: '100%', ...style }}
    >
      <Flexbox flex={1}>
        <Slider
          marks={marks}
          max={levels.length - 1}
          min={0}
          step={1}
          tooltip={{ open: false }}
          value={sliderValue}
          onChange={handleChange}
        />
      </Flexbox>
    </Flexbox>
  );
}

export default memo(LevelSlider) as typeof LevelSlider;
