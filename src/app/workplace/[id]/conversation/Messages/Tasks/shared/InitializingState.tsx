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

import { Flexbox, Text } from '@lobehub/ui';
import { createStaticStyles, keyframes } from 'antd-style';
import { memo, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import NeuralNetworkLoading from '@/components/NeuralNetworkLoading';
import { shinyTextStyles } from '@/styles';

import { formatElapsedTime } from './utils';

const shimmer = keyframes`
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(100%);
  }
`;

const styles = createStaticStyles(({ css, cssVar }) => ({
  container: css`
    padding-block: 12px;
  `,
  progress: css`
    position: relative;

    overflow: hidden;

    height: 3px;
    border-radius: 2px;

    background: ${cssVar.colorFillSecondary};
  `,
  progressShimmer: css`
    position: absolute;
    inset-block-start: 0;
    inset-inline-start: 0;

    width: 100%;
    height: 100%;

    background: linear-gradient(90deg, transparent, ${cssVar.colorPrimaryBgHover}, transparent);

    animation: ${shimmer} 2s infinite;
  `,
}));

const InitializingState = memo(() => {
  const { t } = useTranslation('chat');
  const [elapsedTime, setElapsedTime] = useState(0);

  // Timer for updating elapsed time every second
  useEffect(() => {
    const startTime = Date.now();

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Flexbox className={styles.container} gap={12}>
      <Flexbox horizontal align="center" gap={8}>
        <NeuralNetworkLoading size={14} />
        <Text className={shinyTextStyles.shinyText} weight={500}>
          {t('task.status.initializing')}
        </Text>
        <Text type="secondary">({formatElapsedTime(elapsedTime)})</Text>
      </Flexbox>
    </Flexbox>
  );
});

InitializingState.displayName = 'InitializingState';

export default InitializingState;
