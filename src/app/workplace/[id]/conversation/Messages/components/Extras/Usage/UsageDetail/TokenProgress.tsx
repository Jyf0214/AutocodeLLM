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
import { cssVar } from 'antd-style';
import numeral from 'numeral';
import { memo } from 'react';

export interface TokenProgressItem {
  color: string;
  id: string;
  title: string;
  value: number;
}

interface TokenProgressProps {
  data: TokenProgressItem[];
  showIcon?: boolean;
}

const format = (number: number) => numeral(number).format('0,0');

const TokenProgress = memo<TokenProgressProps>(({ data, showIcon }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);

  return (
    <Flexbox gap={8} style={{ position: 'relative' }} width={'100%'}>
      <Flexbox
        horizontal
        height={6}
        width={'100%'}
        style={{
          background: total === 0 ? cssVar.colorFill : undefined,
          borderRadius: 3,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {data.map((item) => (
          <Flexbox
            height={'100%'}
            key={item.id}
            style={{ background: item.color, flex: item.value }}
          />
        ))}
      </Flexbox>
      <Flexbox>
        {data.map((item) => (
          <Flexbox horizontal align={'center'} gap={4} justify={'space-between'} key={item.id}>
            <Flexbox horizontal align={'center'} gap={4}>
              {showIcon && (
                <div
                  style={{
                    background: item.color,
                    borderRadius: '50%',
                    flex: 'none',
                    height: 6,
                    width: 6,
                  }}
                />
              )}
              <div style={{ color: cssVar.colorTextSecondary }}>{item.title}</div>
            </Flexbox>
            <div style={{ fontWeight: 500 }}>{format(item.value)}</div>
          </Flexbox>
        ))}
      </Flexbox>
    </Flexbox>
  );
});

export default TokenProgress;
