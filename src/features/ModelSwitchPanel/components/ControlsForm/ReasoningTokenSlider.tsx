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
const MAX_VALUE = 64 * Kibi; // 65536

const exponent = (num: number) => Math.log2(num);
const powerKibi = (num: number) => Math.round(Math.pow(2, num) * Kibi);

interface MaxTokenSliderProps {
  defaultValue?: number;
  onChange?: (value: number) => void;
  value?: number;
}

const ReasoningTokenSlider = memo<MaxTokenSliderProps>(({ value, onChange, defaultValue }) => {
  const [token, setTokens] = useMergeState(0, {
    defaultValue,
    onChange,
    value,
  });

  const [powValue, setPowValue] = useMergeState(0, {
    defaultValue: exponent(typeof defaultValue === 'undefined' ? 0 : defaultValue / 1024),
    value: exponent(typeof value === 'undefined' ? 0 : value / Kibi),
  });

  const updateWithPowValue = (value: number) => {
    setPowValue(value);

    setTokens(Math.min(powerKibi(value), MAX_VALUE));
  };

  const updateWithRealValue = (value: number) => {
    setTokens(Math.round(value));

    setPowValue(exponent(value / Kibi));
  };

  const marks = useMemo(() => {
    return {
      [exponent(1)]: '1k',
      [exponent(2)]: '2k',
      [exponent(4)]: '4k', // 4 kibi = 4096
      [exponent(8)]: '8k',
      [exponent(16)]: '16k',
      [exponent(32)]: '32k',
      [exponent(64)]: '64k',
    };
  }, []);

  const step = useMemo(() => {
    const current = token ?? 0;

    if (current <= Kibi) return 128;

    if (current < 8 * Kibi) return Kibi;

    return 4 * Kibi;
  }, [token]);

  return (
    <Flexbox horizontal align={'center'} gap={12} paddingInline={'4px 0'}>
      <Flexbox flex={1}>
        <Slider
          marks={marks}
          max={exponent(64)}
          min={exponent(1)}
          step={null}
          tooltip={{ open: false }}
          value={powValue}
          onChange={updateWithPowValue}
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
            updateWithRealValue(e as number);
          }}
        />
      </div>
    </Flexbox>
  );
});
export default ReasoningTokenSlider;
