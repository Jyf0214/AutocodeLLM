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

import { Alert, Flexbox, Icon, SliderWithInput } from '@lobehub/ui';
import { css, cssVar, cx } from 'antd-style';
import { Sparkle, Sparkles } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

const alertCls = css`
  .ant-alert-message {
    font-size: 12px;
    line-height: 18px !important;
  }

  .ant-alert-icon {
    height: 18px !important;
  }
`;

const Warning = memo(() => {
  const { t } = useTranslation('setting');
  const [temperature] = useAgentStore((s) => {
    const config = agentSelectors.currentAgentConfig(s);
    return [config.params?.temperature];
  });

  return (
    typeof temperature === 'number' &&
    temperature >= 1.5 && (
      <Alert
        classNames={{ alert: cx(alertCls) }}
        style={{ fontSize: 12 }}
        title={t('settingModel.temperature.warning')}
        type={'warning'}
        variant={'borderless'}
      />
    )
  );
});

interface TemperatureProps {
  disabled?: boolean;
  onChange?: (value: number) => void;
  value?: number;
}

const Temperature = memo<TemperatureProps>(({ value, onChange, disabled }) => {
  return (
    <Flexbox gap={4} style={{ width: '100%' }}>
      <SliderWithInput
        changeOnWheel
        controls={false}
        disabled={disabled}
        max={2}
        size={'small'}
        step={0.1}
        style={{ height: 42 }}
        value={value}
        marks={{
          0: <Icon icon={Sparkle} size={'small'} style={{ color: cssVar.colorTextQuaternary }} />,
          1: <div />,
          2: <Icon icon={Sparkles} size={'small'} style={{ color: cssVar.colorTextQuaternary }} />,
        }}
        styles={{
          input: {
            maxWidth: 43,
          },
        }}
        onChange={onChange}
      />
      {!disabled && <Warning />}
    </Flexbox>
  );
});

export default Temperature;
