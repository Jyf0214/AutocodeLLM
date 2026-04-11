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

import { Flexbox, Icon, SliderWithInput } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { FlowerIcon, TrainFrontTunnel } from 'lucide-react';
import { memo } from 'react';

interface TopPProps {
  disabled?: boolean;
  onChange?: (value: number) => void;
  value?: number;
}

const TopP = memo<TopPProps>(({ value, onChange, disabled }) => {
  return (
    <Flexbox style={{ width: '100%' }}>
      <SliderWithInput
        changeOnWheel
        controls={false}
        disabled={disabled}
        max={1}
        min={0}
        size={'small'}
        step={0.1}
        style={{ height: 42 }}
        value={value}
        marks={{
          0: (
            <Icon
              icon={TrainFrontTunnel}
              size={'small'}
              style={{ color: cssVar.colorTextQuaternary }}
            />
          ),
          0.9: <div />,
          1: (
            <Icon icon={FlowerIcon} size={'small'} style={{ color: cssVar.colorTextQuaternary }} />
          ),
        }}
        styles={{
          input: {
            maxWidth: 43,
          },
        }}
        onChange={onChange}
      />
    </Flexbox>
  );
});
export default TopP;
